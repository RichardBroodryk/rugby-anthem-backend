const { Pool } = require("pg");

console.log("🔌 Loading database module...");

let pool;

if (process.env.DATABASE_URL) {
  // Production on Fly.io - handle both .internal and .flycast
  let connString = process.env.DATABASE_URL.trim();

  // Force disable SSL for unmanaged Fly Postgres (most reliable)
  if (!connString.includes("sslmode=")) {
    connString += (connString.includes("?") ? "&" : "?") + "sslmode=disable";
  }

  pool = new Pool({
    connectionString: connString,
    ssl: false,                    // Important for Fly unmanaged clusters
    max: 10,                       // Reasonable pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  console.log("🌐 Using Fly production database (SSL disabled, .internal preferred)");
} else {
  // Local development
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log("💻 Using local database");
}

// Set search_path safely
pool.on("connect", (client) => {
  client.query("SET search_path TO public").catch(err => {
    console.warn("⚠️ Could not set search_path:", err.message);
  });
});

// Non-blocking connection test with better logging
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully");
    client.release();
  } catch (err) {
    console.error("❌ CRITICAL: Database connection failed:", err.message);
    console.error("   Connection string starts with:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 60) + "..." : "none");
  }
})();

module.exports = pool;