require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Initialize database and ensure tables exist
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log('Database connected');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL,
        plan TEXT NOT NULL,
        gateway TEXT,
        external_subscription_id TEXT,
        next_billing_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables ensured');
    client.release();
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

initializeDatabase();

// ================= HEALTH CHECK =================
app.get('/', (req, res) => {
  res.send('Rugby Anthem Zone backend is running');
});

// DEBUG: check database connection
app.get('/debug-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database()');
    res.json(result.rows[0]);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ================= AUTH MIDDLEWARE =================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ================= SUBSCRIPTION MIDDLEWARE =================
async function requirePremium(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT plan FROM subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.userId, 'active']
    );

    const subscription = result.rows[0];

    if (!subscription) {
      return res.status(403).json({ error: 'No active subscription' });
    }

    if (
      subscription.plan === 'premium' ||
      subscription.plan === 'super_premium'
    ) {
      next();
    } else {
      return res.status(403).json({ error: 'Premium access required' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Subscription check failed' });
  }
}

// ================= ROUTES =================

// ================= API-SPORTS TEST ROUTE =================
app.get('/api/test-rugby', async (req, res) => {
  try {
    const response = await axios.get(
      'https://v1.rugby.api-sports.io/leagues',
      {
        headers: {
          'x-apisports-key': process.env.API_SPORTS_KEY,
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('API-Sports error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch rugby data',
    });
  }
});

// ================= RAW FIXTURE TEST =================
app.get('/api/test-fixtures', async (req, res) => {
  try {
    const response = await axios.get(
      'https://v1.rugby.api-sports.io/fixtures',
      {
        headers: {
          'x-apisports-key': process.env.API_SPORTS_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Fixture test error:', error.message);

    res.status(500).json({
      error: 'Failed to fetch fixtures',
    });
  }
});

// ================= MATCHES ENDPOINT =================
app.get('/api/matches', async (req, res) => {
  try {
    const response = await axios.get(
      'https://v1.rugby.api-sports.io/games',
      {
        headers: {
          'x-apisports-key': process.env.API_SPORTS_KEY,
        },
        params: {
          league: 51,     // Six Nations
          season: 2024,   // Allowed season
          status: 'FT',   // Finished matches
        },
      }
    );

    const games = response.data.response || [];

    const matches = games.map((game) => ({
      id: game.game.id,
      league: game.league.name,
      homeTeam: game.teams.home.name,
      awayTeam: game.teams.away.name,
      homeScore: game.scores.home,
      awayScore: game.scores.away,
      status: game.game.status.long,
      kickoff: game.game.date,
    }));

    res.json(matches);
  } catch (error) {
    console.error('Match fetch error:', error.response?.data || error.message);

    res.status(500).json({
      error: 'Failed to fetch match data',
    });
  }
});

// Register
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ================= PAYFAST PAYMENT SESSION =================
app.post('/api/payments/create-session', async (req, res) => {
  try {
    const { userId, plan } = req.body;

    let amount;
    if (plan === 'premium') amount = 4.99;
    else if (plan === 'super_premium') amount = 9.99;
    else return res.status(400).json({ error: 'Invalid plan' });

    const paymentData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: 'http://localhost:3000/payment-success',
      cancel_url: 'http://localhost:3000/payment-cancel',
      notify_url:
        'https://rugby-anthem-backend-production.up.railway.app/api/payments/webhook',
      amount: amount.toFixed(2),
      item_name: `Rugby Anthem Zone ${plan} subscription`,
      custom_str1: userId,
      custom_str2: plan,
    };

    const queryString = new URLSearchParams(paymentData).toString();
    const paymentUrl = `${process.env.PAYFAST_URL}?${queryString}`;

    res.json({ paymentUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment session creation failed' });
  }
});

// ================= PAYFAST WEBHOOK =================
app.post('/api/payments/webhook', async (req, res) => {
  try {
    const paymentStatus = req.body.payment_status;
    const userId = req.body.custom_str1;
    const plan = req.body.custom_str2;

    if (paymentStatus === 'COMPLETE') {
      const update = await pool.query(
        `UPDATE subscriptions
         SET status = 'active', plan = $2, gateway = 'payfast'
         WHERE user_id = $1`,
        [userId, plan]
      );

      if (update.rowCount === 0) {
        await pool.query(
          `INSERT INTO subscriptions (user_id, status, plan, gateway)
           VALUES ($1, 'active', $2, 'payfast')`,
          [userId, plan]
        );
      }

      console.log(`Subscription activated for user ${userId}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

// Premium-protected route
app.get('/premium-content', authenticateToken, requirePremium, (req, res) => {
  res.json({ message: 'Welcome to premium content!' });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
