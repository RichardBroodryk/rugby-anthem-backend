// =====================================================
// Paddle Payment Service — FIXED & ROBUST
// =====================================================

const axios = require("axios");

const PADDLE_API_KEY = (process.env.PADDLE_API_KEY || "").trim();
const PREMIUM_PRICE_ID = (process.env.PADDLE_PRICE_PREMIUM || "").trim();
const SUPER_PRICE_ID = (process.env.PADDLE_PRICE_SUPER || "").trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://rugbyanthemzone.com").trim();

if (!PADDLE_API_KEY) throw new Error("Missing PADDLE_API_KEY");
if (!PREMIUM_PRICE_ID || !SUPER_PRICE_ID) throw new Error("Missing PADDLE_PRICE_PREMIUM or PADDLE_PRICE_SUPER");
if (!FRONTEND_URL) console.warn("⚠️ FRONTEND_URL not set — using default");

async function createCheckout({ tier, email, userId }) {
  console.log("🧾 Paddle checkout request:", { tier, email, userId });

  // 🔥 Support both string and number from frontend
  let priceId;
  const normalizedTier = String(tier).toLowerCase().trim();

  if (normalizedTier === "premium" || normalizedTier === "8") {
    priceId = PREMIUM_PRICE_ID;
    console.log("✅ Selected PREMIUM price");
  } else if (normalizedTier === "super" || normalizedTier === "9") {
    priceId = SUPER_PRICE_ID;
    console.log("✅ Selected SUPER price");
  } else {
    throw new Error(`Invalid subscription tier: ${tier}`);
  }

  try {
    const payload = {
      items: [{ price_id: priceId, quantity: 1 }],
      customer: { email },
      collection_mode: "automatic",
      checkout: {
        url: "https://rugbyanthemzone.com/checkout"
      },
      custom_data: {
        tier: normalizedTier,
        user_id: String(userId) // Force string
      }
    };

    const paddleRes = await axios.post(
      "https://api.paddle.com/transactions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📦 Paddle transaction created successfully");

    const transaction = paddleRes?.data?.data;
    if (!transaction) throw new Error("No transaction data in response");

    const checkoutUrl = transaction.checkout?.url;
    if (!checkoutUrl) {
      console.error("❌ Missing checkout URL in Paddle response");
      console.error(JSON.stringify(paddleRes.data, null, 2));
      throw new Error("Checkout URL missing");
    }

    console.log("✅ Paddle checkout URL:", checkoutUrl);

    return { checkoutUrl, transactionId: transaction.id };
  } catch (err) {
    console.error("❌ Paddle API error:");
    if (err.response?.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    throw new Error("Paddle transaction creation failed: " + (err.message || "Unknown error"));
  }
}

module.exports = { createCheckout };