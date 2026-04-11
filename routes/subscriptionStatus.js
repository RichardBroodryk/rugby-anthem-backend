// =====================================================
// Subscription Status Endpoint — Rugby Anthem Zone
// =====================================================

const express = require("express");
const router = express.Router();
const pool = require("../db");

// 🔐 uses existing auth middleware from server.js

// ✅ MAIN ROUTE (FIXED)
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ================= CACHE FIRST =================
    try {
      const cacheRes = await pool.query(
        `SELECT tier_code, has_premium, has_super
         FROM user_access_cache
         WHERE user_id = $1`,
        [userId]
      );

      if (cacheRes.rows.length > 0) {
        return res.json({
          tier: cacheRes.rows[0].tier_code,
          hasPremium: cacheRes.rows[0].has_premium,
          hasSuper: cacheRes.rows[0].has_super,
          source: "cache",
        });
      }
    } catch (cacheErr) {
      console.warn("Cache lookup failed, falling back:", cacheErr.message);
    }

    // ================= USERS TABLE FALLBACK =================
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

// ✅ OPTIONAL: keep backward compatibility
router.get("/status", async (req, res, next) => {
  req.url = "/";
  return router.handle(req, res, next);
});

module.exports = router;