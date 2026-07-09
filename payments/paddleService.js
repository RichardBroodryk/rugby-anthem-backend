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

async function createCheckout({ product, email, userId }) {
  console.log("🧾 Paddle checkout request:", { product, email, userId });

  const normalizedProduct = String(product || "").toLowerCase().trim();

  if (normalizedProduct !== "raz-premium") {
    throw new Error(`Invalid checkout product: ${product}`);
  }

  try {
    const payload = {
      items: [{ price_id: RAZ_PRICE_ID, quantity: 1 }],
      customer: {
        email,
      },
      collection_mode: "automatic",
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

    const transaction = paddleRes?.data?.data;

    if (!transaction) {
      console.error("❌ Paddle response missing transaction data");
      console.error(JSON.stringify(paddleRes.data, null, 2));
      throw new Error("No transaction data returned by Paddle");
    }

    // IMPORTANT:
    // For this flow we need the hosted Paddle checkout URL,
    // not our own frontend /checkout page.
    const checkoutUrl =
      transaction.checkout?.url ||
      transaction.checkout_url ||
      transaction.url ||
      null;

    if (!checkoutUrl) {
      console.error("❌ Missing hosted checkout URL in Paddle response");
      console.error(JSON.stringify(paddleRes.data, null, 2));
      throw new Error("Hosted checkout URL missing from Paddle response");
    }

    console.log("📦 Paddle transaction created successfully");
    console.log("✅ Hosted Paddle checkout URL:", checkoutUrl);

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