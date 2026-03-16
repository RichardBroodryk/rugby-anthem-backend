// =====================================================
// Paddle Payment Service
// =====================================================

const axios = require("axios");

const PADDLE_API_KEY = (process.env.PADDLE_API_KEY || "").trim();
const PREMIUM_PRICE_ID = (process.env.PADDLE_PRICE_PREMIUM || "").trim();
const SUPER_PRICE_ID = (process.env.PADDLE_PRICE_SUPER || "").trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || "").trim();

if (!PADDLE_API_KEY) {
  throw new Error("Missing PADDLE_API_KEY in environment variables");
}

if (!PREMIUM_PRICE_ID || !SUPER_PRICE_ID) {
  throw new Error("Missing Paddle price IDs in environment variables");
}

if (!FRONTEND_URL) {
  throw new Error("Missing FRONTEND_URL in environment variables");
}

// =====================================================
// Create Paddle Checkout
// =====================================================

async function createCheckout({ tier, email, userId }) {

  console.log("🧾 Paddle checkout request:", {
    tier,
    email,
    userId
  });

  let priceId;

  if (tier === "premium") {
    priceId = PREMIUM_PRICE_ID;
  } else if (tier === "super") {
    priceId = SUPER_PRICE_ID;
  } else {
    throw new Error("Invalid subscription tier");
  }

  try {

    const paddleRes = await axios.post(
      "https://api.paddle.com/transactions",
      {
        items: [
          {
            price_id: priceId,
            quantity: 1
          }
        ],

        customer: {
          email: email
        },

        collection_mode: "automatic",

        // Important: define checkout context
        checkout: {
          url: `${FRONTEND_URL}/checkout`
        },

        custom_data: {
          tier: tier,
          user_id: userId
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(
      "📦 PADDLE FULL RESPONSE:",
      JSON.stringify(paddleRes.data, null, 2)
    );

    const transaction = paddleRes?.data?.data;

    if (!transaction) {
      throw new Error("Transaction data missing from Paddle response");
    }

    const checkoutUrl = transaction?.checkout?.url;

    if (!checkoutUrl) {
      console.error("❌ Paddle response missing checkout URL");
      console.error(JSON.stringify(paddleRes.data, null, 2));
      throw new Error("Checkout URL missing from Paddle response");
    }

    console.log("✅ Paddle checkout URL:", checkoutUrl);

    return {
      checkoutUrl
    };

  } catch (err) {

    console.error("❌ Paddle API error");

    if (err.response) {
      console.error("Paddle response error:", err.response.data);
    } else {
      console.error(err.message);
    }

    throw new Error("Paddle transaction creation failed");
  }
}

module.exports = {
  createCheckout
};