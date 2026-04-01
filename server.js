require('dotenv').config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ================= EXISTING ROUTES =================
const paddleWebhook = require('./routes/paddleWebhook');
const subscriptionStatus = require('./routes/subscriptionStatus');
const createCheckout = require('./routes/createCheckout');

const rugbyRoutes = require("./routes/testRugby");
const statsGateway = require("./routes/statsGateway");
const payfastNotify = require("./routes/payfastNotify");

// 🔥 NEW — DATA CONTROL LAYER
const rugbyData = require("./routes/rugbyData");

const newsRoutes = require("./routes/news");

const app = express();

console.log("API SPORTS KEY:", process.env.API_SPORTS_KEY);

// ================= CORS =================
const allowedOrigins = [
  "https://www.rugbyanthemzone.com",
  "https://rugbyanthemzone.com",
  "https://rugby-anthem-frontend.vercel.app",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
};

app.use(cors(corsOptions));

// ================= BODY =================
app.use(express.json());

// ================= HEALTH =================
app.get("/", (req,res)=>{
  res.send("Rugby Anthem Zone backend is running");
});

// ================= JWT =================
const JWT_SECRET = (process.env.JWT_SECRET || "").trim();

if(!JWT_SECRET){
  throw new Error("JWT_SECRET missing from environment");
}

// ================= AUTH =================
function authMiddleware(req,res,next){
  try{
    let header = req.headers.authorization;

    if(Array.isArray(header)) header = header[0];

    if(!header || typeof header !== "string"){
      return res.status(401).json({error:"No token"});
    }

    if(!header.toLowerCase().startsWith("bearer ")){
      return res.status(401).json({error:"Invalid token format"});
    }

    const token = header.slice(7).trim();
    const decoded = jwt.verify(token,JWT_SECRET);

    req.userId = decoded.userId;
    req.userEmail = decoded.email || null;

    next();

  }catch(err){
    console.error("AUTH FAIL:",err.message);
    res.status(401).json({error:"Invalid token"});
  }
}

// ================= AUTH ROUTES =================
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

app.post("/api/login", async(req,res)=>{
  const {email,password} = req.body;

  try{
    const result = await pool.query(
      "SELECT id,email,password_hash FROM users WHERE email=$1",
      [email]
    );

    if(result.rows.length === 0){
      return res.status(401).json({error:"Invalid credentials"});
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password,user.password_hash);

    if(!valid){
      return res.status(401).json({error:"Invalid credentials"});
    }

    const token = jwt.sign(
      { userId:String(user.id), email:String(user.email) },
      JWT_SECRET,
      {expiresIn:"7d"}
    );

    res.json({token});

  }catch(err){
    res.status(500).json({error:"Login failed"});
  }
});

// ================= EXISTING ROUTES =================
app.use("/api", rugbyRoutes);
app.use("/api/stats", statsGateway);
app.use("/api/webhooks/paddle", paddleWebhook);

app.use("/api/subscription",authMiddleware,subscriptionStatus);
app.use("/api/payments",authMiddleware,createCheckout);
app.use("/api", payfastNotify);

// 🔥 NEW — DATA CONTROL ROUTE
app.use("/api/rugby", rugbyData);

// 📰 NEWS ROUTE
app.use("/api/news", newsRoutes);

// ================= VIDEOS ROUTE =================
app.get("/api/videos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, thumbnail, url, category, published_at
      FROM videos
      ORDER BY published_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching videos:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// ================= START =================
const PORT = process.env.PORT || 4000;

app.listen(PORT,()=>{
  console.log("Server running on port",PORT);
});