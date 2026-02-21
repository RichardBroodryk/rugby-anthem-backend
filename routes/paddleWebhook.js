// =====================================================
// Paddle Webhook Handler — Rugby Anthem Zone
// PRODUCTION SUBSCRIPTION LOGIC
// =====================================================

const express = require("express");
const router = express.Router();
const pool = require("../db");

// =====================================================
// MAIN WEBHOOK
// =====================================================

router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    const eventId = event?.event_id || event?.id;
    const eventType = event?.event_type || event?.type;

    if (!eventId || !eventType) {
      return res.status(400).json({ error: "Invalid Paddle payload" });
    }

    // ================= IDEMPOTENCY =================
    const existing = await pool.query(
      `SELECT id FROM webhook_events WHERE paddle_event_id = $1`,
      [eventId]
    );

    if (existing.rows.length > 0) {
      console.log("⚠️ Duplicate Paddle webhook ignored:", eventId);
      return res.json({ received: true });
    }

    // record webhook receipt
    await pool.query(
      `INSERT INTO webhook_events (paddle_event_id, event_type, processed)
       VALUES ($1, $2, false)`,
      [eventId, eventType]
    );

    console.log("📩 Paddle event:", eventType);

    // ================= ROUTING =================
    switch (eventType) {
      case "subscription.created":
      case "subscription_created":
        await handleSubscriptionCreated(event);
        break;

      case "transaction.paid":
      case "transaction_paid":
        await handleTransactionPaid(event);
        break;

      case "subscription.updated":
      case "subscription_updated":
        await handleSubscriptionUpdated(event);
        break;

      case "subscription.canceled":
      case "subscription_cancelled":
        await handleSubscriptionCancelled(event);
        break;

      case "transaction.refunded":
      case "transaction_refunded":
        await handleTransactionRefunded(event);
        break;

      default:
        console.log("ℹ️ Unhandled Paddle event:", eventType);
    }

    // mark processed
    await pool.query(
      `UPDATE webhook_events
       SET processed = true, processed_at = NOW()
       WHERE paddle_event_id = $1`,
      [eventId]
    );

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Paddle webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

// =====================================================
// HANDLERS
// =====================================================

async function handleSubscriptionCreated(event) {
  try {
    const sub = event.data || event;

    const paddleSubId = sub.id || sub.subscription_id;
    const customerId = sub.customer_id;
    const priceId = sub.items?.[0]?.price?.id || sub.price_id;
    const status = sub.status || "active";

    // find tier from price
    const tierRes = await pool.query(
      `SELECT tier_code FROM tiers WHERE paddle_price_id = $1`,
      [priceId]
    );

    const tierCode = tierRes.rows[0]?.tier_code || "premium";

    // find user by paddle customer id
    const userRes = await pool.query(
      `SELECT id FROM users WHERE paddle_customer_id = $1`,
      [customerId]
    );

    if (userRes.rows.length === 0) {
      console.log("⚠️ User not found for Paddle customer:", customerId);
      return;
    }

    const userId = userRes.rows[0].id;

    // upsert subscription
    await pool.query(
      `INSERT INTO subscriptions
       (user_id, paddle_subscription_id, paddle_customer_id, tier_code, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (paddle_subscription_id)
       DO UPDATE SET status = EXCLUDED.status, tier_code = EXCLUDED.tier_code`,
      [userId, paddleSubId, customerId, tierCode, status]
    );

    await updateUserAccess(userId, tierCode);

    console.log("✅ subscription created/updated for user:", userId);
  } catch (err) {
    console.error("subscription.created handler error:", err);
  }
}

async function handleTransactionPaid(event) {
  try {
    const tx = event.data || event;

    const subId = tx.subscription_id;
    const amount = tx.amount || 0;
    const currency = tx.currency || "USD";
    const eventId = tx.id || tx.transaction_id;

    await pool.query(
      `INSERT INTO payment_events
       (paddle_event_id, paddle_subscription_id, amount, currency, event_type)
       VALUES ($1, $2, $3, $4, 'transaction_paid')
       ON CONFLICT DO NOTHING`,
      [eventId, subId, amount, currency]
    );

    console.log("💰 payment recorded:", subId);
  } catch (err) {
    console.error("transaction.paid handler error:", err);
  }
}

async function handleSubscriptionUpdated(event) {
  try {
    const sub = event.data || event;
    const paddleSubId = sub.id || sub.subscription_id;
    const status = sub.status;

    await pool.query(
      `UPDATE subscriptions
       SET status = $1, updated_at = NOW()
       WHERE paddle_subscription_id = $2`,
      [status, paddleSubId]
    );

    console.log("🔄 subscription updated:", paddleSubId);
  } catch (err) {
    console.error("subscription.updated handler error:", err);
  }
}

async function handleSubscriptionCancelled(event) {
  try {
    const sub = event.data || event;
    const paddleSubId = sub.id || sub.subscription_id;

    const result = await pool.query(
      `UPDATE subscriptions
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE paddle_subscription_id = $1
       RETURNING user_id`,
      [paddleSubId]
    );

    if (result.rows.length > 0) {
      await updateUserAccess(result.rows[0].user_id, "free");
    }

    console.log("❌ subscription cancelled:", paddleSubId);
  } catch (err) {
    console.error("subscription.cancelled handler error:", err);
  }
}

async function handleTransactionRefunded(event) {
  console.log("↩️ transaction refunded");
}

// =====================================================
// USER ACCESS HELPER
// =====================================================

async function updateUserAccess(userId, tierCode) {
  const hasPremium = tierCode === "premium" || tierCode === "super";
  const hasSuper = tierCode === "super";

  await pool.query(
    `INSERT INTO user_access_cache
     (user_id, tier_code, has_premium, has_super, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       tier_code = EXCLUDED.tier_code,
       has_premium = EXCLUDED.has_premium,
       has_super = EXCLUDED.has_super,
       updated_at = NOW()`,
    [userId, tierCode, hasPremium, hasSuper]
  );

  await pool.query(
    `UPDATE users SET tier = $1, updated_at = NOW() WHERE id = $2`,
    [tierCode, userId]
  );
}

module.exports = router;