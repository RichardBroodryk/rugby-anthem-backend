// =====================================================
// Paddle Webhook Handler — Rugby Anthem Zone
// =====================================================

const express = require("express");
const router = express.Router();
const pool = require("../db");

// Paddle sends JSON
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    const eventId = event?.event_id || event?.id;
    const eventType = event?.event_type || event?.type;

    if (!eventId || !eventType) {
      return res.status(400).json({ error: "Invalid Paddle payload" });
    }

    // =====================================================
    // IDEMPOTENCY CHECK
    // =====================================================
    const existing = await pool.query(
      `SELECT id FROM webhook_events WHERE paddle_event_id = $1`,
      [eventId]
    );

    if (existing.rows.length > 0) {
      console.log("⚠️ Duplicate Paddle webhook ignored:", eventId);
      return res.json({ received: true });
    }

    // Record webhook receipt
    await pool.query(
      `INSERT INTO webhook_events (paddle_event_id, event_type, processed)
       VALUES ($1, $2, false)`,
      [eventId, eventType]
    );

    console.log("📩 Paddle event:", eventType);

    // =====================================================
    // EVENT ROUTING
    // =====================================================
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

    // Mark processed
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
  console.log("✅ subscription created");
}

async function handleTransactionPaid(event) {
  console.log("💰 transaction paid");
}

async function handleSubscriptionUpdated(event) {
  console.log("🔄 subscription updated");
}

async function handleSubscriptionCancelled(event) {
  console.log("❌ subscription cancelled");
}

async function handleTransactionRefunded(event) {
  console.log("↩️ transaction refunded");
}

module.exports = router;