require("dotenv").config();

console.log("🚀 SERVER STARTING...");
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
console.log("JWT_SECRET present:", !!process.env.JWT_SECRET);
console.log("PADDLE_API_KEY present:", !!process.env.PADDLE_API_KEY);
console.log(
  "PADDLE_WEBHOOK_SECRET present:",
  !!process.env.PADDLE_WEBHOOK_SECRET
);

try {
  console.log("🔌 Loading DB...");
  require("./db");
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

// Shared auth middleware
const { authMiddleware } = require("./middleware/authMiddleware");

// ================= INIT =================
const app = express();

// ================= DB =================
const pool = require("./db");
console.log("✅ DB loaded");

// ================= JWT =================
const JWT_SECRET = (process.env.JWT_SECRET || "").trim();
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET missing");
  process.exit(1);
}

// ================= CORS =================
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  "https://www.rugbyanthemzone.com",
  "https://rugbyanthemzone.com",
]);

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server / curl / Render health checks with no origin
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.warn("❌ Blocked by CORS:", origin);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
  optionsSuccessStatus: 200,
};

// Apply CORS globally before routes
app.use(cors(corsOptions));

// ================= MIDDLEWARE =================
// Paddle webhook must receive raw body
app.use("/api/webhooks/paddle", express.raw({ type: "*/*" }));

// JSON for all other routes
app.use(express.json());

// ================= ROUTE IMPORTS =================
const subscriptionStatus = require("./routes/subscriptionStatus");
const subscriptionRoutes = require("./routes/subscription");
const createCheckout = require("./routes/createCheckout");
const paddleWebhook = require("./routes/paddleWebhook");
const paddleConfig = require("./routes/paddleConfig");

const rugbyRoutes = require("./routes/testRugby");
const statsGateway = require("./routes/statsGateway");
const rugbyData = require("./routes/rugbyData");
const newsRoutes = require("./routes/news");
const loyaltyRoutes = require("./routes/loyalty");

console.log("✅ All routes loaded");

// =====================================================
// ACCESS HELPERS
// Transitional one-tier model:
//
// - users.tier is still present for legacy compatibility
// - "premium" is treated as the paid RAZ access flag for now
// - "free" means account exists but no paid access yet
// =====================================================
function buildAccessPayload(userRow) {
  const tier = String(userRow?.tier || "free").toLowerCase();
  const hasAccess = tier === "premium" && userRow?.is_active === true;

  return {
    access: hasAccess ? "active" : "inactive",
    hasAccess,
    tier, // transitional legacy field; remove later once frontend is fully cleaned
  };
}

// ================= AUTH ROUTES =================
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        tier,
        is_active,
        auth_provider
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, tier, is_active
      `,
      [normalizedEmail, hashed, "free", false, "email"]
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
      ...buildAccessPayload(newUser),
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err.message);

    if (err.code === "23505") {
      return res.status(400).json({ error: "User already exists" });
    }

    res.status(500).json({
      error: "Registration failed",
      debug: err.message,
    });
  }
});

// ================= LOGIN =================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT id, email, password_hash, tier, is_active
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

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
      ...buildAccessPayload(user),
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.message);
    res.status(500).json({
      error: "Login failed",
      debug: err.message,
    });
  }
});

// ================= CORE ROUTES =================
app.use("/api/webhooks/paddle", paddleWebhook);
app.use("/api/subscription", authMiddleware, subscriptionStatus);
app.use("/api/payments", authMiddleware, createCheckout);
app.use("/api/payments/config", paddleConfig);
app.use("/api", subscriptionRoutes);

// ================= OTHER APP ROUTES =================
app.use("/api", rugbyRoutes);
app.use("/api/stats", statsGateway);
app.use("/api/rugby", rugbyData);
app.use("/api/news", newsRoutes);
app.use("/api/loyalty", loyaltyRoutes);

// ================= HEALTH =================
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    message: "Rugby Anthem Zone backend is running",
  });
});

app.get("/", (_req, res) => {
  res.send("Rugby Anthem Zone backend is running");
});

// ================= START =================
const PORT = process.env.PORT || 4000;

console.log("🚀 USING PORT:", PORT);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Listening on 0.0.0.0:${PORT}`);
});