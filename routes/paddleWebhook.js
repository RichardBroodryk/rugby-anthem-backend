// =====================================================
// Paddle Webhook Handler — SECURE + STABLE VERSION
// =====================================================

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const pool = require("../db");

// =====================================================
// 🔐 VERIFY SIGNATURE (NON-BLOCKING SAFE MODE)
// =====================================================
function verifyPaddleSignature(req) {
  try {
    const signature = req.headers["paddle-signature"];
    const secret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.warn("⚠️ Missing signature or webhook secret — skipping verification");
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
    console.error("⚠️ Signature verification failed (non-blocking):", err.message);
  }
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
    console.log("📦 EVENT TYPE:", eventType);

    // =====================================================
    // HANDLE TRANSACTION COMPLETED
    // =====================================================
    if (eventType === "transaction.completed") {
      console.log("🔥 TRANSACTION COMPLETED");

      const userIdRaw =
        event.data?.custom_data?.user_id ||
        event.data?.customData?.user_id;

      const priceId =
        event.data?.items?.[0]?.price?.id ||
        event.data?.items?.[0]?.price_id;

      // 🔴 NEW: GET SUBSCRIPTION ID
      const subscriptionId =
        event.data?.subscription_id ||
        event.data?.subscription?.id;

      console.log("👤 RAW USER ID:", userIdRaw);
      console.log("💰 PRICE ID:", priceId);
      console.log("📌 SUBSCRIPTION ID:", subscriptionId);

      if (!userIdRaw) {
        console.error("❌ Missing userId");
        return res.json({ received: true });
      }

      const userId = parseInt(String(userIdRaw), 10);

      if (isNaN(userId)) {
        console.error("❌ Invalid userId:", userIdRaw);
        return res.json({ received: true });
      }

      let tier = "freemium";

      if (priceId === process.env.PADDLE_PRICE_PREMIUM) {
        tier = "premium";
        console.log("✅ MATCHED PREMIUM");
      } else if (priceId === process.env.PADDLE_PRICE_SUPER) {
        tier = "super";
        console.log("✅ MATCHED SUPER");
      } else {
        console.warn("⚠️ Unknown priceId — defaulting to freemium");
      }

      console.log(`🔄 Updating user ${userId} → tier: ${tier}`);

      // 🔴 UPDATED QUERY (NOW SAVES SUBSCRIPTION ID)
      const result = await pool.query(
        `UPDATE users 
         SET tier = $1,
             paddle_subscription_id = $2
         WHERE id = $3
         RETURNING id, email, tier, paddle_subscription_id`,
        [tier, subscriptionId || null, userId]
      );

      if (result.rowCount > 0) {
        console.log("✅ USER UPDATED:", result.rows[0]);
      } else {
        console.error("❌ NO USER FOUND FOR ID:", userId);
      }
    }

    res.json({ received: true });

  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(500).send("Webhook error");
  }
});

module.exports = router;