// =====================================================
// Paddle Payment Service
// =====================================================

require("dotenv").config();
const axios = require("axios");

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PREMIUM_PRICE_ID = process.env.PADDLE_PRICE_PREMIUM;
const SUPER_PRICE_ID = process.env.PADDLE_PRICE_SUPER;

async function createCheckout({ tier, email }) {

  console.log("----- PADDLE REQUEST -----");
  console.log("Tier:", tier);
  console.log("Email:", email);
  console.log("Price Premium:", PREMIUM_PRICE_ID);
  console.log("--------------------------");

  let priceId;

  if (tier === "premium") {
    priceId = PREMIUM_PRICE_ID;
  } else if (tier === "super") {
    priceId = SUPER_PRICE_ID;
  } else {
    throw new Error("Invalid tier");
  }

  try {

    const response = await axios.post(
      "https://api.paddle.com/transactions",
      {
        items: [
          {
            price_id: priceId,
            quantity: 1
          }
        ],

        customer_email: email

      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const transactionId = response.data?.data?.id;

    if (!transactionId) {
      throw new Error("Transaction ID missing");
    }

    console.log("✅ Paddle transaction:", transactionId);

    const checkoutUrl = response.data.data.checkout.url;

    return {
      checkoutUrl
    };

  } catch (err) {

    console.error("❌ PADDLE ERROR");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }

    throw new Error("Paddle transaction creation failed");

  }

}

module.exports = {
  createCheckout
};