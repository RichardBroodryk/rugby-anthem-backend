const { Pool } = require("pg");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {

  // 🚀 Fly / production mode
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log("🌐 Using production database");

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

// Ensure public schema
pool.on("connect", (client) => {
  client.query("SET search_path TO public");
});

// Test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully");
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();

module.exports = pool;