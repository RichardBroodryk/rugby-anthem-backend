// =====================================================
// Subscription Status Endpoint — Rugby Anthem Zone
// =====================================================

const express = require("express");
const router = express.Router();
const pool = require("../db");

// ✅ MAIN ROUTE (CACHE DISABLED — FIXED)
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🔥 DIRECT USERS TABLE (SOURCE OF TRUTH)
    const userRes = await pool.query(
      `SELECT tier FROM users WHERE id = $1`,
      [userId]
    );

    const tier = userRes.rows[0]?.tier || "freemium";

    return res.json({
      tier,
      hasPremium: tier === "premium" || tier === "super",
      hasSuper: tier === "super",
      source: "users",
    });

  } catch (err) {
    console.error("Subscription status error:", err);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

// ✅ BACKWARD COMPAT
router.get("/status", async (req, res, next) => {
  req.url = "/";
  return router.handle(req, res, next);
});

module.exports = router;