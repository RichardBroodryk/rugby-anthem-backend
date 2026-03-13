require('dotenv').config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const paddleWebhook = require('./routes/paddleWebhook');
const subscriptionStatus = require('./routes/subscriptionStatus');
const createCheckout = require('./routes/createCheckout');

const rugbyRoutes = require("./routes/testRugby");
const statsGateway = require("./routes/statsGateway");

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

// ✅ ACTIVATE CORS
app.use(cors(corsOptions));


// ================= BODY PARSER =================
app.use(express.json());


// ================= HEALTH =================
app.get("/", (req,res)=>{
  res.send("Rugby Anthem Zone backend is running");
});


// ================= JWT SECRET =================
const JWT_SECRET = (process.env.JWT_SECRET || "").trim();

if(!JWT_SECRET){
  throw new Error("JWT_SECRET missing from environment");
}


// ================= AUTH MIDDLEWARE =================
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

// ================= REGISTER =================
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

    if (!result.rows || result.rows.length === 0) {
      return res.status(500).json({ error: "User insert failed" });
    }

    res.json({
      userId: result.rows[0].id,
      email: result.rows[0].email
    });

  } catch (err) {

    console.error("Register error:", err.message);

    if (err.code === "23505") {
      return res.status(400).json({ error: "User already exists" });
    }

    res.status(500).json({ error: err.message });
  }

});

// ================= LOGIN =================
app.post("/api/login", async(req,res)=>{

  console.log("🔥 LOGIN ROUTE HIT — SERVER.JS");

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

    const payload={
      userId:String(user.id),
      email:String(user.email)
    };

    const token = jwt.sign(payload,JWT_SECRET,{expiresIn:"7d"});

    res.json({token});

  }catch(err){

    console.error("Login error:",err);

    res.status(500).json({error:"Login failed"});
  }

});


// ================= ROUTES =================
app.use("/api", rugbyRoutes);
app.use("/api/stats", statsGateway);
app.use("/api/webhooks/paddle", paddleWebhook);

app.use("/api/subscription",authMiddleware,subscriptionStatus);
app.use("/api/payments",authMiddleware,createCheckout);


// ================= START =================
const PORT = process.env.PORT || 4000;

app.listen(PORT,()=>{
  console.log("Server running on port",PORT);
});