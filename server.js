require("dotenv").config();

console.log("🚀 SERVER STARTING...");
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
console.log("JWT_SECRET present:", !!process.env.JWT_SECRET);
console.log("PADDLE_API_KEY present:", !!process.env.PADDLE_API_KEY);
console.log("PADDLE_WEBHOOK_SECRET present:", !!process.env.PADDLE_WEBHOOK_SECRET);

try {
  console.log("🔌 Loading DB...");
  const pool = require("./db");
  console.log("✅ DB module loaded");
} catch (err) {
  console.error("❌ FAILED TO LOAD DB MODULE:", err.message);
  process.exit(1);
}

// ================= IMPORTS =================
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ================= INIT =================
const app = express();

// ================= DB =================
const pool = require("./db");
console.log("✅ DB loaded");

// ================= CORS =================
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://www.rugbyanthemzone.com",
      "https://rugbyanthemzone.com",
    ],
    credentials: true,
  })
);

// ================= SAFE OPTIONS HANDLER =================
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
   res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return res.sendStatus(200);
  }
  next();
});

// ================= MIDDLEWARE =================
// 🔥 MUST BE FIRST — raw body for Paddle webhook
app.use("/api/webhooks/paddle", express.raw({ type: "*/*" }));

// JSON for all other routes
app.use(express.json());

// ================= JWT =================
const JWT_SECRET = (process.env.JWT_SECRET || "").trim();
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET missing");
  process.exit(1);
}

// ================= AUTH MIDDLEWARE =================
function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({ error: "No token" });
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

// ================= ROUTE IMPORTS =================
const subscriptionStatus = require("./routes/subscriptionStatus");
const subscriptionRoutes = require("./routes/subscription");
const createCheckout = require("./routes/createCheckout");
const paddleWebhook = require("./routes/paddleWebhook");

const rugbyRoutes = require("./routes/testRugby");
const statsGateway = require("./routes/statsGateway");
const payfastNotify = require("./routes/payfastNotify");
const rugbyData = require("./routes/rugbyData");
const newsRoutes = require("./routes/news");
const loyaltyRoutes = require("./routes/loyalty");

console.log("✅ All routes loaded");

// ================= AUTH ROUTES =================

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, tier, is_active, auth_provider) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, tier`,
      [normalizedEmail, hashed, "freemium", true, "email"]
    );

    const newUser = result.rows[0];

    console.log("✅ New user created successfully - ID:", newUser.id);

    const token = jwt.sign(
      {
        userId: String(newUser.id),
        email: newUser.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      userId: newUser.id,
      email: newUser.email,
      tier: newUser.tier,
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err.message);

    if (err.code === "23505") {
      return res.status(400).json({ error: "User already exists" });
    }

    res
      .status(500)
      .json({ error: "Registration failed", debug: err.message });
  }
});

// ================= LOGIN =================

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    const result = await pool.query(
      "SELECT id, email, password_hash, tier FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: String(user.id),
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ LOGIN SUCCESS:", user.id);

    res.json({
      token,
      userId: user.id,
      email: user.email,
      tier: user.tier,
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.message);
    res.status(500).json({ error: "Login failed", debug: err.message });
  }
});

// ================= CORE ROUTES =================
app.use("/api/webhooks/paddle", paddleWebhook);
app.use("/api/subscription", authMiddleware, subscriptionStatus);
app.use("/api/payments", authMiddleware, createCheckout);
app.use("/api", subscriptionRoutes);

// ================= OTHER ROUTES =================
app.use("/api", rugbyRoutes);
app.use("/api/stats", statsGateway);
app.use("/api", payfastNotify);
app.use("/api/rugby", rugbyData);
app.use("/api/news", newsRoutes);
app.use("/api/loyalty", loyaltyRoutes);

// ================= HEALTH =================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    message: "Rugby Anthem Zone backend is running",
  });
});

app.get("/", (req, res) => {
  res.send("Rugby Anthem Zone backend is running");
});

// ================= START =================
const PORT = process.env.PORT || 4000;

console.log("🚀 USING PORT:", PORT);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Listening on 0.0.0.0:${PORT} - ready for Fly proxy`);
});