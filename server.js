require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const paddleWebhook = require('./routes/paddleWebhook');
const subscriptionStatus = require('./routes/subscriptionStatus');
const createCheckout = require('./routes/createCheckout');

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// Paddle webhook (no auth)
app.use('/api/webhooks/paddle', paddleWebhook);

// ================= JWT SECRET =================
const JWT_SECRET = (process.env.JWT_SECRET || '').trim();

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET missing from environment');
}

// ================= AUTH MIDDLEWARE =================
function authMiddleware(req, res, next) {
  try {
    let header = req.headers.authorization;

    if (Array.isArray(header)) header = header[0];

    if (!header || typeof header !== 'string') {
      return res.status(401).json({ error: 'No token' });
    }

    if (!header.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const token = header.slice(7).trim();
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.userId;
    req.userEmail = decoded.email || null;

    return next();
  } catch (err) {
    console.error('AUTH FAIL:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ================= HEALTH =================
app.get('/', (req, res) => {
  res.send('Rugby Anthem Zone backend is running');
});

// ================= REGISTER =================
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashed]
    );

    return res.json({
      userId: result.rows[0].id,
      email: result.rows[0].email,
    });
  } catch (err) {
    console.error('Register error:', err);

    if (err.code === '23505') {
      return res.status(400).json({ error: 'User already exists' });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
});

// ================= LOGIN (BULLETPROOF) =================
// ================= LOGIN (FORCED EMAIL PAYLOAD) =================
app.post('/api/login', async (req, res) => {
  console.log('🔥 LOGIN ROUTE HIT — SERVER.JS');

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 🔒 FORCE STRING NORMALIZATION
    const payload = {
      userId: String(user.id),
      email: String(user.email),
    };

    console.log('✅ JWT PAYLOAD ABOUT TO SIGN:', payload);

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ================= PROTECTED ROUTES =================
app.use('/api/subscription', authMiddleware, subscriptionStatus);
app.use('/api/payments', authMiddleware, createCheckout);

// ================= START =================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});