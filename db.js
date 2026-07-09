const { Pool } = require("pg");

console.log("🔌 Loading database module...");

const isProduction = process.env.NODE_ENV === "production";

let pool;

if (process.env.DATABASE_URL) {
  const connString = process.env.DATABASE_URL.trim();

  pool = new Pool({
    connectionString: connString,
    ssl: isProduction
      ? {
          rejectUnauthorized: false,
        }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  console.log("🌐 Using DATABASE_URL connection");
} else {
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  console.log("💻 Using local database connection");
}

pool.on("connect", (client) => {
  client
    .query("SET search_path TO public")
    .catch((err) => {
      console.warn("⚠️ Could not set search_path:", err.message);
    });
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL pool error:", err.message);
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully");
    client.release();
  } catch (err) {
    console.error("❌ CRITICAL: Database connection failed:", err.message);

    if (process.env.DATABASE_URL) {
      console.error(
        "DATABASE_URL starts with:",
        `${process.env.DATABASE_URL.substring(0, 40)}...`
      );
    } else {
      console.error("DATABASE_URL not set; using local DB env vars");
    }
  }
})();

module.exports = pool;