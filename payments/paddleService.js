// =====================================================
// Paddle Payment Service
// =====================================================

const axios = require("axios");

// ENV
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PREMIUM_PRICE_ID = process.env.PADDLE_PRICE_PREMIUM;
const SUPER_PRICE_ID = process.env.PADDLE_PRICE_SUPER;
const FRONTEND_URL = process.env.FRONTEND_URL;

async function createCheckout({ tier, email }) {

  console.log("🧾 Paddle checkout request:", {
    tier,
    email
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
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const transactionId = paddleRes?.data?.data?.id;

    if (!transactionId) {
      console.error("❌ Paddle response missing transaction ID:", paddleRes?.data);
      throw new Error("Transaction ID missing");
    }

    console.log("✅ Paddle transaction created:", transactionId);

    const checkoutUrl = `${FRONTEND_URL}/terms?_ptxn=${transactionId}`;

    return {
      checkoutUrl
    };

  } catch (err) {

    console.error("❌ PADDLE API ERROR FULL:");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Message:", err.message);
    }

    throw new Error("Paddle transaction creation failed");
  }
}

module.exports = {
  createCheckout
};