// =====================================================
// One-time Railway DB initializer
// =====================================================

require("dotenv").config();

// 🛑 SAFETY GUARD — prevents accidental production runs
if (process.env.NODE_ENV === "production") {
  console.log("Init script disabled in production");
  process.exit(0);
}

const fs = require("fs");
const path = require("path");
const pool = require("../../db");

async function run() {
  try {
    console.log("🚀 Starting Railway schema initialization...");

    const sqlPath = path.join(__dirname, "init-railway.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    await pool.query(sql);

    console.log("✅ Railway schema initialized successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Schema initialization failed:", err);
    process.exit(1);
  }
}

run();