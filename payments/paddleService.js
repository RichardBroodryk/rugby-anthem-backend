// =====================================================
// Paddle Payment Service — Rugby Anthem Zone
// One-tier paid access checkout
//
// Frontend sends:
// { product: "raz-premium" }
//
// Backend uses one Paddle price only:
// - PADDLE_PRICE_RAZ
// =====================================================

const axios = require("axios");

const PADDLE_API_KEY = (process.env.PADDLE_API_KEY || "").trim();
const RAZ_PRICE_ID = (process.env.PADDLE_PRICE_RAZ || "").trim();
const FRONTEND_URL = (
  process.env.FRONTEND_URL || "https://www.rugbyanthemzone.com"
).trim();

if (!PADDLE_API_KEY) {
  throw new Error("Missing PADDLE_API_KEY");
}

if (!RAZ_PRICE_ID) {
  throw new Error("Missing PADDLE_PRICE_RAZ");
}

if (!FRONTEND_URL) {
  console.warn("⚠️ FRONTEND_URL not set — using default");
}

async function createCheckout({ product, email, userId }) {
  console.log("🧾 Paddle checkout request:", { product, email, userId });

  const normalizedProduct = String(product || "").toLowerCase().trim();

  if (normalizedProduct !== "raz-premium") {
    throw new Error(`Invalid checkout product: ${product}`);
  }

  try {
    const payload = {
      items: [{ price_id: RAZ_PRICE_ID, quantity: 1 }],
      customer: { email },
      collection_mode: "automatic",
      checkout: {
        url: `${FRONTEND_URL}/checkout`,
      },
      custom_data: {
        product: "raz-premium",
        user_id: String(userId),
      },
    };

    const paddleRes = await axios.post(
      "https://api.paddle.com/transactions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📦 Paddle transaction created successfully");

    const transaction = paddleRes?.data?.data;
    if (!transaction) {
      throw new Error("No transaction data in response");
    }

    const checkoutUrl = transaction.checkout?.url;
    if (!checkoutUrl) {
      console.error("❌ Missing checkout URL in Paddle response");
      console.error(JSON.stringify(paddleRes.data, null, 2));
      throw new Error("Checkout URL missing");
    }

    console.log("✅ Paddle checkout URL:", checkoutUrl);

    return {
      checkoutUrl,
      provider: "paddle",
      transactionId: transaction.id,
    };
  } catch (err) {
    console.error("❌ Paddle API error:");
    if (err.response?.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }

    throw new Error(
      "Paddle transaction creation failed: " + (err.message || "Unknown error")
    );
  }
}

module.exports = { createCheckout };