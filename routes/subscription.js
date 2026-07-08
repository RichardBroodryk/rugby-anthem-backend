// =====================================================
// Subscription Actions — Rugby Anthem Zone
// One-tier paid access model
// =====================================================

const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middleware/authMiddleware");

// =====================================================
// POST /api/cancel-subscription
//
// Cancels the user's Paddle subscription at the end of the
// current billing period. Access remains active until the
// paid term actually ends and the webhook/reconciliation
// marks the subscription inactive.
// =====================================================
router.post("/cancel-subscription", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // =====================================================
    // 1) Find the user's most relevant subscription record
    //
    // Prefer the most recently updated active-ish subscription.
    // =====================================================
    const subRes = await pool.query(
      `
      SELECT
        id,
        paddle_subscription_id,
        status,
        cancelled_at,
        next_billing_date,
        updated_at,
        created_at
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY
        CASE
          WHEN LOWER(COALESCE(status, '')) IN ('active', 'trialing', 'past_due', 'paused', 'canceling', 'cancelling') THEN 0
          ELSE 1
        END,
        updated_at DESC,
        created_at DESC
      LIMIT 1
      `,
      [userId]
    );

    if (subRes.rows.length === 0) {
      return res.status(400).json({
        error: "No subscription found for this user",
      });
    }

    const subscription = subRes.rows[0];
    const subscriptionId = subscription.paddle_subscription_id;
    const currentStatus = String(subscription.status || "").toLowerCase();

    if (!subscriptionId) {
      return res.status(400).json({
        error: "No Paddle subscription ID found for this user",
      });
    }

    // If already in a cancel flow, return a stable response
    if (
      ["canceling", "cancelling", "canceled", "cancelled"].includes(
        currentStatus
      )
    ) {
      return res.json({
        success: true,
        alreadyPendingCancellation: true,
        subscriptionStatus: currentStatus,
        nextBillingDate: subscription.next_billing_date || null,
        cancelledAt: subscription.cancelled_at || null,
        message:
          "Subscription is already scheduled for cancellation or has already been cancelled.",
      });
    }

    // =====================================================
    // 2) Call Paddle API — cancel at end of billing period
    // =====================================================
    const paddleRes = await fetch(
      `https://api.paddle.com/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effective_from: "next_billing_period",
        }),
      }
    );

    const paddleData = await paddleRes.json().catch(() => ({}));

    if (!paddleRes.ok) {
      console.error("❌ Paddle cancel error:", paddleData);
      return res.status(500).json({
        error: "Failed to cancel subscription",
        debug:
          paddleData?.error?.detail ||
          paddleData?.error?.message ||
          paddleData?.message ||
          null,
      });
    }

    // =====================================================
    // 3) Mark subscription as canceling in our DB
    //
    // We do NOT revoke access here.
    // Access remains active until the paid term actually ends.
    // =====================================================
    const updateRes = await pool.query(
      `
      UPDATE subscriptions
      SET
        status = $1,
        cancelled_at = COALESCE(cancelled_at, NOW()),
        updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        paddle_subscription_id,
        status,
        next_billing_date,
        cancelled_at
      `,
      ["canceling", subscription.id]
    );

    const updated = updateRes.rows[0];

    // =====================================================
    // 4) Return success
    // =====================================================
    return res.json({
      success: true,
      subscriptionStatus: updated?.status || "canceling",
      nextBillingDate: updated?.next_billing_date || null,
      cancelledAt: updated?.cancelled_at || null,
      message: "Subscription will cancel at the end of the billing period",
    });
  } catch (err) {
    console.error("❌ Cancel subscription error:", err);
    return res.status(500).json({
      error: "Server error",
    });
  }
});

module.exports = router;