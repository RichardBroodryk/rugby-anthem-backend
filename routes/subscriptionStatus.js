// =====================================================
// Subscription Status Endpoint — Rugby Anthem Zone
// One-tier paid access status
//
// Backend contract moving forward:
// - access: "active" | "inactive"
// - hasAccess: boolean
//
// Transitional compatibility:
// - tier is still returned temporarily because parts of the
//   frontend auth layer still normalize from it
// =====================================================

const express = require("express");
const router = express.Router();
const pool = require("../db");

function buildAccessPayload(userRow, subscriptionRow = null) {
  const tier = String(userRow?.tier || "free").toLowerCase();
  const isActive = userRow?.is_active === true;
  const hasAccess = tier === "premium" && isActive;

  return {
    access: hasAccess ? "active" : "inactive",
    hasAccess,
    tier, // temporary compatibility field; remove after frontend cleanup
    source: subscriptionRow ? "users+subscriptions" : "users",
    subscription: subscriptionRow
      ? {
          status: subscriptionRow.status || null,
          nextBillingDate: subscriptionRow.next_billing_date || null,
          cancelledAt: subscriptionRow.cancelled_at || null,
        }
      : null,
  };
}

// =====================================================
// GET /api/subscription
// =====================================================
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRes = await pool.query(
      `
      SELECT id, email, tier, is_active
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];

    // Get most recent subscription record if present
    const subscriptionRes = await pool.query(
      `
      SELECT
        paddle_subscription_id,
        status,
        next_billing_date,
        cancelled_at,
        updated_at
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
      `,
      [userId]
    );

    const subscription = subscriptionRes.rows[0] || null;

    return res.json(buildAccessPayload(user, subscription));
  } catch (err) {
    console.error("Subscription status error:", err);
    return res.status(500).json({
      error: "Failed to fetch subscription status",
    });
  }
});

// =====================================================
// Backward-compatible alias
// GET /api/subscription/status
// =====================================================
router.get("/status", async (req, res, next) => {
  req.url = "/";
  return router.handle(req, res, next);
});

module.exports = router;