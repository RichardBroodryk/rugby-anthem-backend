// =====================================================
// Paddle Webhook Handler — Rugby Anthem Zone
// PRODUCTION SUBSCRIPTION LOGIC (HARDENED)
// =====================================================

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const pool = require("../db");

// =====================================================
// 🔐 RAW BODY for Paddle (MUST come before JSON parsing)
// =====================================================
router.use(express.raw({ type: "application/json" }));

// =====================================================
// 🔐 SIGNATURE VERIFICATION
// =====================================================
function verifyPaddleSignature(req) {
  const signature = req.headers["paddle-signature"];
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!signature) {
    throw new Error("Missing Paddle signature header");
  }

  if (!secret) {
    throw new Error("Missing PADDLE_WEBHOOK_SECRET");
  }

  const rawBody = req.body; // Buffer

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    throw new Error("Invalid Paddle signature");
  }
}

// =====================================================
// MAIN WEBHOOK
// =====================================================
router.post("/", async (req, res) => {
  try {
    // 🔐 VERIFY FIRST (before trusting payload)
    verifyPaddleSignature(req);

    // safe parse
    const event =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : JSON.parse(req.body.toString());

    const eventId = event?.event_id || event?.id;
    const eventType = event?.event_type || event?.type;

    if (!eventId || !eventType) {
      return res.status(400).json({ error: "Invalid Paddle payload" });
    }

    // ================= IDEMPOTENCY =================
    const insertResult = await pool.query(
      `INSERT INTO webhook_events (paddle_event_id, event_type, processed)
       VALUES ($1, $2, false)
       ON CONFLICT (paddle_event_id) DO NOTHING
       RETURNING id`,
      [eventId, eventType]
    );

    // duplicate event
    if (insertResult.rows.length === 0) {
      console.log("⚠️ Duplicate Paddle webhook ignored:", eventId);
      return res.json({ received: true });
    }

    console.log("📩 Paddle event:", eventType);

    // ================= ROUTING =================
    switch (eventType) {
      case "subscription.created":
      case "subscription_created":
        await handleSubscriptionCreated(event);
        break;

      case "transaction.paid":
      case "transaction_paid":
      case "transaction.completed":
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
    console.error("❌ Paddle webhook error:", err.message || err);
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
    const statusRaw = sub.status || "active";

    const normalizedStatus =
      statusRaw === "active" || statusRaw === "trialing"
        ? "active"
        : statusRaw;

    // 🔎 Resolve tier
    const tierRes = await pool.query(
      `SELECT tier_code FROM tiers WHERE paddle_price_id = $1`,
      [priceId]
    );

    if (!tierRes.rows.length) {
      console.error("❌ Unknown price_id:", priceId);
      return;
    }

    const tierCode = tierRes.rows[0].tier_code;

    // =====================================================
    // 🔎 FIND USER (fallback to custom_data.user_id)
    // =====================================================

    let userId = null;

    // try by customer id first
    const userByCustomer = await pool.query(
      `SELECT id FROM users WHERE paddle_customer_id = $1`,
      [customerId]
    );

    if (userByCustomer.rows.length > 0) {
      userId = userByCustomer.rows[0].id;
    } else {
      const fallbackUserId = event?.data?.custom_data?.user_id;

      if (!fallbackUserId) {
        console.log("⚠️ No user match and no custom_data.user_id");
        return;
      }

      userId = fallbackUserId;

      // 🔥 backfill customer id
      await pool.query(
        `UPDATE users
         SET paddle_customer_id = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [customerId, userId]
      );

      console.log("🧩 Backfilled paddle_customer_id for user:", userId);
    }

    // upsert subscription
    await pool.query(
      `INSERT INTO subscriptions
       (user_id, paddle_subscription_id, paddle_customer_id, tier_code, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (paddle_subscription_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         tier_code = EXCLUDED.tier_code`,
      [userId, paddleSubId, customerId, tierCode, normalizedStatus]
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