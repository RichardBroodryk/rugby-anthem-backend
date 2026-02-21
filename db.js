// =====================================================
// Rugby Anthem Zone — Database Connection (Hybrid)
// Works locally AND on Railway
// =====================================================

const { Pool } = require("pg");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
  // 🚀 Railway / production mode
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log("🌐 Using Railway database");
} else {
  // 💻 Local development mode
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log("💻 Using local database");
}

// ✅ CRITICAL: Force PostgreSQL to use public schema
pool.on("connect", (client) => {
  client.query("SET search_path TO public");
});

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully");
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
};

testConnection();

module.exports = pool;