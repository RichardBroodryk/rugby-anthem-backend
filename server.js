require('dotenv').config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("🔥 NEW VERSION DEPLOYED");

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();

// ================= ROUTES =================
const paddleWebhook = require('./routes/paddleWebhook');
const subscriptionStatus = require('./routes/subscriptionStatus');
const createCheckout = require('./routes/createCheckout');

const rugbyRoutes = require("./routes/testRugby");
const statsGateway = require("./routes/statsGateway");
const payfastNotify = require("./routes/payfastNotify");
const rugbyData = require("./routes/rugbyData");
const newsRoutes = require("./routes/news");
const loyaltyRoutes = require("./routes/loyalty");

// ================= MIDDLEWARE =================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("Rugby Anthem Zone backend is running");
});

// ================= JWT =================
const JWT_SECRET = (process.env.JWT_SECRET || "").trim();

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing from environment");
}

// ================= AUTH MIDDLEWARE =================
function authMiddleware(req, res, next) {
  try {
    let header = req.headers.authorization;

    if (!header || typeof header !== "string") {
      return res.status(401).json({ error: "No token" });
    }

    if (!header.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const token = header.slice(7).trim();
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();

  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ================= AUTH ROUTES =================

// ✅ REGISTER
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email,password_hash) VALUES ($1,$2) RETURNING id,email",
      [email, hashed]
    );

    res.json({
      userId: result.rows[0].id,
      email: result.rows[0].email
    });

  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "User already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});

// ✅ LOGIN (🔥 RESTORED)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id,email,password_hash FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: String(user.id), email: String(user.email) },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

// ================= VERIFY PAYMENT =================
app.post("/api/verify-payment", async (req, res) => {
  try {
    const { txn } = req.body;

    if (!txn) {
      return res.status(400).json({ error: "Transaction ID required" });
    }

    const paddleRes = await axios.get(
      `https://api.paddle.com/transactions/${txn}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const transaction = paddleRes.data?.data;

    if (!transaction) {
      throw new Error("Invalid Paddle response");
    }

    if (transaction.status !== "completed") {
      throw new Error("Transaction not completed");
    }

    const userIdRaw =
  transaction.custom_data?.user_id ||
  transaction.customData?.user_id;

console.log("🔥 USER ID FROM PADDLE:", userIdRaw);

const userId = Number(userIdRaw);

    if (!userId) {
      throw new Error("User ID missing from Paddle metadata");
    }

    let tier = "premium";

    const priceId =
      transaction.items?.[0]?.price?.id ||
      transaction.items?.[0]?.price_id;

    if (priceId === process.env.PADDLE_PRICE_SUPER) {
      tier = "super";
    }

    const result = await pool.query(
  `UPDATE users SET tier = $1 WHERE id = $2 RETURNING id, tier`,
  [tier, userId]
);

console.log("🔥 UPDATE RESULT:", result.rows);

    return res.json({ success: true, tier });

  } catch (err) {
    return res.status(500).json({
      error: "Verification failed",
      debug: err.message
    });
  }
});

// ================= OTHER ROUTES =================
app.use("/api", rugbyRoutes);
app.use("/api/stats", statsGateway);
app.use("/api/webhooks/paddle", paddleWebhook);

app.use("/api/subscription", authMiddleware, subscriptionStatus);
app.use("/api/payments", authMiddleware, createCheckout);

app.use("/api", payfastNotify);
app.use("/api/rugby", rugbyData);
app.use("/api/news", newsRoutes);
app.use("/api/loyalty", loyaltyRoutes);

// ================= START =================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});