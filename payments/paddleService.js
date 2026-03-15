// =====================================================
// Paddle Payment Service
// =====================================================

const axios = require("axios");

const PADDLE_API_KEY = (process.env.PADDLE_API_KEY || "").trim();
const PREMIUM_PRICE_ID = process.env.PADDLE_PRICE_PREMIUM;
const SUPER_PRICE_ID = process.env.PADDLE_PRICE_SUPER;

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
    throw new Error("Invalid tier");
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

    const transaction = paddleRes?.data?.data;

    if (!transaction) {
      throw new Error("Transaction data missing");
    }

    const checkoutUrl = transaction?.checkout?.url;

    if (!checkoutUrl) {
      console.error("Paddle response:", paddleRes.data);
      throw new Error("Checkout URL missing from Paddle response");
    }

    console.log("✅ Paddle checkout URL:", checkoutUrl);

    return {
      checkoutUrl
    };

  } catch (err) {

    console.error("❌ Paddle API error");

    if (err.response) {
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }

    throw new Error("Paddle transaction creation failed");
  }
}

module.exports = {
  createCheckout
};