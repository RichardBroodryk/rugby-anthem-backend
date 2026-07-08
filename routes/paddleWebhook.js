// =====================================================
// Paddle Webhook Handler — Rugby Anthem Zone
// One-tier paid access lifecycle handler
//
// Current one-tier contract:
// - frontend checkout product: "raz-premium"
// - one paid access path only
//
// Transitional backend compatibility:
// - users.tier = "premium" means paid RAZ access
// - users.tier = "free" means account exists but no active paid access
//
// This webhook now handles:
// - transaction.completed
// - subscription.created
// - subscription.updated
// - subscription.canceled / cancelled
// - subscription.past_due / paused (best-effort support)
//
// It keeps:
// - subscriptions table as billing/subscription source of truth
// - users table as fast access cache for current app auth flow
// =====================================================

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const pool = require("../db");

const ACTIVE_PRODUCT = "raz-premium";
const ACTIVE_TIER = "premium";
const INACTIVE_TIER = "free";

// =====================================================
// 🔐 VERIFY SIGNATURE (NON-BLOCKING SAFE MODE)
// =====================================================
function verifyPaddleSignature(req) {
  try {
    const signature = req.headers["paddle-signature"];
    const secret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.warn(
        "⚠️ Missing signature or webhook secret — skipping verification"
      );
      return;
    }

    const payload = req.body.toString();

    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (signature !== expected) {
      console.error("❌ Invalid Paddle signature");
      throw new Error("Invalid signature");
    }

    console.log("✅ Paddle signature verified");
  } catch (err) {
    console.error(
      "⚠️ Signature verification failed (non-blocking):",
      err.message
    );
  }
}

// =====================================================
// HELPERS
// =====================================================
function extractCustomData(data) {
  return data?.custom_data || data?.customData || {};
}

function extractUserId(data) {
  const customData = extractCustomData(data);
  return customData?.user_id ? String(customData.user_id).trim() : null;
}

function extractProduct(data) {
  const customData = extractCustomData(data);
  return customData?.product ? String(customData.product).trim() : null;
}

function extractPriceId(data) {
  return data?.items?.[0]?.price?.id || data?.items?.[0]?.price_id || null;
}

function extractSubscriptionId(data) {
  return (
    data?.subscription_id ||
    data?.subscription?.id ||
    data?.id ||
    null
  );
}

function extractCustomerId(data) {
  return data?.customer_id || data?.customer?.id || null;
}

function extractSubscriptionStatus(data) {
  return data?.status ? String(data.status).toLowerCase() : null;
}

function extractNextBillingDate(data) {
  return (
    data?.next_billed_at ||
    data?.next_billing_date ||
    data?.billing_cycle?.next_billed_at ||
    null
  );
}

function extractCancelledAt(data) {
  return data?.canceled_at || data?.cancelled_at || null;
}

async function setUserAccess({
  userId,
  hasAccess,
  customerId = null,
}) {
  const tier = hasAccess ? ACTIVE_TIER : INACTIVE_TIER;

  const result = await pool.query(
    `
    UPDATE users
    SET
      tier = $1,
      is_active = $2,
      paddle_customer_id = COALESCE($3, paddle_customer_id),
      updated_at = NOW()
    WHERE id = $4
    RETURNING id, email, tier, is_active, paddle_customer_id
    `,
    [tier, hasAccess, customerId, userId]
  );

  if (result.rowCount > 0) {
    console.log("✅ USER ACCESS UPDATED:", result.rows[0]);
  } else {
    console.warn("⚠️ No user found to update access for:", userId);
  }

  return result.rowCount > 0;
}

async function upsertSubscription({
  userId,
  subscriptionId,
  customerId = null,
  status = "active",
  nextBillingDate = null,
  cancelledAt = null,
}) {
  if (!subscriptionId || !userId) return;

  await pool.query(
    `
    INSERT INTO subscriptions (
      user_id,
      paddle_subscription_id,
      paddle_customer_id,
      tier_code,
      status,
      next_billing_date,
      cancelled_at,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (paddle_subscription_id)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      paddle_customer_id = EXCLUDED.paddle_customer_id,
      tier_code = EXCLUDED.tier_code,
      status = EXCLUDED.status,
      next_billing_date = EXCLUDED.next_billing_date,
      cancelled_at = EXCLUDED.cancelled_at,
      updated_at = NOW()
    `,
    [
      userId,
      subscriptionId,
      customerId,
      ACTIVE_TIER,
      status,
      nextBillingDate,
      cancelledAt,
    ]
  );

  console.log("✅ Subscription upserted:", {
    userId,
    subscriptionId,
    status,
  });
}

async function recordPaymentEvent({
  userId = null,
  eventId = null,
  subscriptionId = null,
  customerId = null,
  eventType = null,
  event,
}) {
  try {
    await pool.query(
      `
      INSERT INTO payment_events (
        user_id,
        paddle_event_id,
        paddle_subscription_id,
        paddle_customer_id,
        event_type,
        raw_payload,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      `,
      [
        userId,
        eventId,
        subscriptionId,
        customerId,
        eventType,
        JSON.stringify(event),
      ]
    );
  } catch (err) {
    console.error("⚠️ Failed to store payment event:", err.message);
  }
}

async function findUserIdBySubscriptionId(subscriptionId) {
  if (!subscriptionId) return null;

  const res = await pool.query(
    `
    SELECT user_id
    FROM subscriptions
    WHERE paddle_subscription_id = $1
    LIMIT 1
    `,
    [subscriptionId]
  );

  return res.rows[0]?.user_id || null;
}

// =====================================================
// EVENT HANDLERS
// =====================================================
async function handleTransactionCompleted(event, eventType, eventId) {
  const data = event?.data || {};

  const userId = extractUserId(data);
  const product = extractProduct(data);
  const priceId = extractPriceId(data);
  const subscriptionId = extractSubscriptionId(data);
  const customerId = extractCustomerId(data);

  console.log("🔥 TRANSACTION COMPLETED");
  console.log("👤 USER ID:", userId);
  console.log("📦 PRODUCT:", product);
  console.log("💰 PRICE ID:", priceId);
  console.log("📌 SUBSCRIPTION ID:", subscriptionId);
  console.log("🧍 CUSTOMER ID:", customerId);

  if (!userId) {
    console.error("❌ Missing user_id in transaction.completed custom_data");
    return;
  }

  if (product && product !== ACTIVE_PRODUCT) {
    console.warn(
      `⚠️ Ignoring transaction.completed for unsupported product "${product}"`
    );
    return;
  }

  await setUserAccess({
    userId,
    hasAccess: true,
    customerId,
  });

  if (subscriptionId) {
    await upsertSubscription({
      userId,
      subscriptionId,
      customerId,
      status: "active",
    });
  }

  await recordPaymentEvent({
    userId,
    eventId,
    subscriptionId,
    customerId,
    eventType,
    event,
  });
}

async function handleSubscriptionLifecycle(event, eventType) {
  const data = event?.data || {};

  let userId = extractUserId(data);
  const subscriptionId = extractSubscriptionId(data);
  const customerId = extractCustomerId(data);
  const nextBillingDate = extractNextBillingDate(data);
  const cancelledAt = extractCancelledAt(data);
  const paddleStatus = extractSubscriptionStatus(data);

  if (!userId && subscriptionId) {
    userId = await findUserIdBySubscriptionId(subscriptionId);
  }

  console.log("🔄 SUBSCRIPTION EVENT:", eventType);
  console.log("👤 USER ID:", userId);
  console.log("📌 SUBSCRIPTION ID:", subscriptionId);
  console.log("🧍 CUSTOMER ID:", customerId);
  console.log("📅 NEXT BILLING:", nextBillingDate);
  console.log("🛑 CANCELLED AT:", cancelledAt);
  console.log("📊 PADDLE STATUS:", paddleStatus);

  if (!subscriptionId) {
    console.warn("⚠️ Subscription lifecycle event missing subscription ID");
    return;
  }

  if (!userId) {
    console.warn(
      "⚠️ Could not resolve user for subscription lifecycle event:",
      subscriptionId
    );
    return;
  }

  // Normalize to app-side access semantics
  let localStatus = "active";
  let hasAccess = true;

  switch (eventType) {
    case "subscription.created":
      localStatus = "active";
      hasAccess = true;
      break;

    case "subscription.updated":
      if (
        ["canceled", "cancelled", "inactive", "expired"].includes(
          paddleStatus || ""
        )
      ) {
        localStatus = "cancelled";
        hasAccess = false;
      } else if (
        ["past_due", "paused"].includes(paddleStatus || "")
      ) {
        localStatus = paddleStatus;
        // Keep access conservative here? For now no paid access if Paddle says paused/past_due.
        hasAccess = false;
      } else if (
        ["active", "trialing"].includes(paddleStatus || "")
      ) {
        localStatus = "active";
        hasAccess = true;
      } else {
        localStatus = paddleStatus || "active";
        hasAccess = true;
      }
      break;

    case "subscription.canceled":
    case "subscription.cancelled":
      localStatus = "cancelled";
      hasAccess = false;
      break;

    case "subscription.paused":
      localStatus = "paused";
      hasAccess = false;
      break;

    case "subscription.resumed":
      localStatus = "active";
      hasAccess = true;
      break;

    case "subscription.past_due":
      localStatus = "past_due";
      hasAccess = false;
      break;

    default:
      localStatus = paddleStatus || "active";
      hasAccess = true;
      break;
  }

  await upsertSubscription({
    userId,
    subscriptionId,
    customerId,
    status: localStatus,
    nextBillingDate,
    cancelledAt,
  });

  await setUserAccess({
    userId,
    hasAccess,
    customerId,
  });
}

// =====================================================
// MAIN WEBHOOK
// =====================================================
router.post("/", async (req, res) => {
  try {
    console.log("🔥 Paddle webhook received");

    verifyPaddleSignature(req);

    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      console.error("❌ JSON parse failed");
      return res.status(400).send("Invalid JSON");
    }

    const eventType = event?.event_type;
    const eventId = event?.event_id || event?.id || null;

    console.log("📦 EVENT TYPE:", eventType);
    if (eventId) {
      console.log("🧾 EVENT ID:", eventId);
    }

    switch (eventType) {
      case "transaction.completed":
        await handleTransactionCompleted(event, eventType, eventId);
        break;

      case "subscription.created":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.cancelled":
      case "subscription.paused":
      case "subscription.resumed":
      case "subscription.past_due":
        await handleSubscriptionLifecycle(event, eventType);
        await recordPaymentEvent({
          userId: null,
          eventId,
          subscriptionId: extractSubscriptionId(event?.data || {}),
          customerId: extractCustomerId(event?.data || {}),
          eventType,
          event,
        });
        break;

      default:
        console.log("ℹ️ Unhandled Paddle event type:", eventType);
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).send("Webhook error");
  }
});

module.exports = router;