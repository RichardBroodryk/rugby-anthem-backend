require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // ✅ unified DB connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const paddleWebhook = require('./routes/paddleWebhook'); // ✅ ADDED

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/payments/paddle', paddleWebhook); // ✅ ADDED

// ================= JWT SECRET =================
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// ================= AUTH MIDDLEWARE =================
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) return res.status(401).json({ error: 'No token' });

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ================= HEALTH CHECK =================
app.get('/', (req, res) => {
  res.send('Rugby Anthem Zone backend is running');
});

// ================= AUTH ROUTES =================
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hashed]
    );

    res.json({ userId: result.rows[0].id });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
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

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
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

// ================= YOUTUBE INGESTION =================
app.get('/api/videos/ingest', async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    const searchTerms = [
      'Six Nations highlights',
      'World Rugby highlights',
      'Rugby Sevens highlights',
      'Rugby union highlights',
      'Women rugby highlights',
    ];

    let inserted = 0;

    for (const term of searchTerms) {
      const searchRes = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            q: term,
            type: 'video',
            maxResults: 10,
            order: 'date',
            key: apiKey,
          },
        }
      );

      const items = searchRes.data.items;

      for (const item of items) {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnail = item.snippet.thumbnails.high.url;
        const publishedAt = item.snippet.publishedAt;

        let category = 'highlight';
        const lowerTitle = title.toLowerCase();

        if (
          lowerTitle.includes('hit') ||
          lowerTitle.includes('tackle') ||
          lowerTitle.includes('collision') ||
          lowerTitle.includes('smash')
        ) {
          category = 'hit';
        }

        const exists = await pool.query(
          'SELECT id FROM videos WHERE provider_id = $1',
          [videoId]
        );

        if (exists.rows.length === 0) {
          await pool.query(
            `INSERT INTO videos
            (provider_id, title, thumbnail, url, provider, category, published_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              videoId,
              title,
              thumbnail,
              `https://www.youtube.com/watch?v=${videoId}`,
              'YouTube',
              category,
              publishedAt,
            ]
          );

          inserted++;
        }
      }
    }

    res.json({
      message: 'Keyword ingestion complete',
      inserted,
    });
  } catch (err) {
    console.error('YouTube ingestion error:', err.message);
    res.status(500).json({ error: 'Ingestion failed' });
  }
});

// ================= COMMENTS =================
app.post('/api/comments', authMiddleware, async (req, res) => {
  const {
    tournament_id,
    match_id,
    video_id,
    match_phase,
    content,
  } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments
       (user_id, tournament_id, match_id, video_id, content, match_phase)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.userId,
        tournament_id || null,
        match_id || null,
        video_id || null,
        content,
        match_phase || null,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Comment insert error:', err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

app.get('/api/comments', async (req, res) => {
  const { tournament_id, match_id, video_id } = req.query;

  try {
    let result;

    if (tournament_id) {
      result = await pool.query(
        `SELECT c.*, u.email
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE tournament_id = $1
         ORDER BY created_at DESC`,
        [tournament_id]
      );
    } else if (match_id) {
      result = await pool.query(
        `SELECT c.*, u.email
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE match_id = $1
         ORDER BY created_at DESC`,
        [match_id]
      );
    } else if (video_id) {
      result = await pool.query(
        `SELECT c.*, u.email
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE video_id = $1
         ORDER BY created_at DESC`,
        [video_id]
      );
    } else {
      return res.status(400).json({
        error: 'tournament_id, match_id or video_id required',
      });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Comment fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});