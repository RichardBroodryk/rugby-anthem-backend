require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const paddleWebhook = require('./routes/paddleWebhook');
const subscriptionStatus = require('./routes/subscriptionStatus');
const createCheckout = require('./routes/createCheckout');

const app = express();

app.use(cors());

// ✅ CRITICAL — Paddle webhook MUST be before express.json
app.use('/api/webhooks/paddle', paddleWebhook);

// JSON parser for everything else
app.use(express.json());

// ================= JWT SECRET (TRIMMED) =================
const JWT_SECRET = (process.env.JWT_SECRET || '').trim();

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET missing from environment');
}

// ================= AUTH MIDDLEWARE (HARDENED) =================
function authMiddleware(req, res, next) {
  try {
    let header = req.headers.authorization;

    if (Array.isArray(header)) {
      header = header[0];
    }

    if (!header || typeof header !== 'string') {
      return res.status(401).json({ error: 'No token' });
    }

    header = header.trim();

    if (!header.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const token = header.slice(7).trim();

    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ error: 'Token payload invalid' });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('AUTH FAIL:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ================= ROUTE MOUNTS =================
app.use('/api/subscription', authMiddleware, subscriptionStatus);
app.use('/api/payments', authMiddleware, createCheckout);

// ================= HEALTH CHECK =================
app.get('/', (req, res) => {
  res.send('Rugby Anthem Zone backend is running');
});

// ================= AUTH ROUTES =================
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hashed]
    );

    res.json({ userId: result.rows[0].id });
  } catch (err) {
    console.error('Register error FULL:', err);

    if (err.code === '23505') {
      return res.status(400).json({ error: 'User already exists' });
    }

    return res.status(500).json({
      error: 'Registration failed',
      detail: err.message,
    });
  }
});

// ================= LOGIN (HARDENED — FIXES YOUR BUG) =================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // 🔒 guard missing body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 🔥 CRITICAL GUARD — prevents bcrypt crash
    if (!user.password_hash) {
      console.error('❌ User missing password_hash:', user.email);
      return res.status(401).json({
        error: 'Account not properly set up',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token });
  } catch (err) {
    console.error('Login error FULL:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ================= VIDEOS ENDPOINT =================
app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM videos ORDER BY published_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Video fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});