// =====================================================
// Subscription Actions (Cancel) — Rugby Anthem Zone
// =====================================================

const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const pool = require("../db");

// 🔐 ADD THIS (CRITICAL FIX)
const { authMiddleware } = require("../middleware/authMiddleware");

// =====================================================
// POST /api/cancel-subscription
// =====================================================

router.post("/cancel-subscription", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // 🔒 Ensure authenticated
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // =====================================================
    // 1. Get user's Paddle subscription ID
    // =====================================================
    const userRes = await pool.query(
      `SELECT paddle_subscription_id FROM users WHERE id = $1`,
      [userId]
    );

    const subscriptionId = userRes.rows[0]?.paddle_subscription_id;

    if (!subscriptionId) {
      return res.status(400).json({
        error: "No active subscription found",
      });
    }

    // =====================================================
    // 2. Call Paddle API (cancel at period end)
    // =====================================================
    const paddleRes = await fetch(
      `https://api.paddle.com/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effective_from: "next_billing_period", // ✅ keeps access until end
        }),
      }
    );

    const paddleData = await paddleRes.json();

    if (!paddleRes.ok) {
      console.error("Paddle cancel error:", paddleData);
      return res.status(500).json({
        error: "Failed to cancel subscription",
      });
    }

    // =====================================================
    // 3. Mark user as canceling (UX state only)
    // =====================================================
    await pool.query(
      `UPDATE users 
       SET cancel_at_period_end = true
       WHERE id = $1`,
      [userId]
    );

    // =====================================================
    // 4. Success response
    // =====================================================
    return res.json({
      success: true,
      message: "Subscription will cancel at the end of the billing period",
    });

  } catch (err) {
    console.error("Cancel subscription error:", err);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

module.exports = router;