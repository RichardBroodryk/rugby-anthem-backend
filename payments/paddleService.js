// =====================================================
// Paddle Payment Service
// =====================================================

require("dotenv").config();
const axios = require("axios");

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PREMIUM_PRICE_ID = process.env.PADDLE_PRICE_PREMIUM;
const SUPER_PRICE_ID = process.env.PADDLE_PRICE_SUPER;

async function createCheckout({ tier, email }) {

  console.log("----- CREATE CHECKOUT -----");
  console.log("Tier:", tier);
  console.log("Email:", email);
  console.log("Premium Price:", PREMIUM_PRICE_ID);
  console.log("---------------------------");

  let priceId;

  if (tier === "premium") {
    priceId = PREMIUM_PRICE_ID;
  } 
  else if (tier === "super") {
    priceId = SUPER_PRICE_ID;
  } 
  else {
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
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const transaction = response.data?.data;

    if (!transaction || !transaction.id) {
      console.error("Invalid Paddle response:", response.data);
      throw new Error("Transaction creation failed");
    }

    console.log("Paddle transaction created:", transaction.id);

    return {
      checkoutUrl: transaction.checkout.url
    };

  } catch (err) {

    console.error("PADDLE API ERROR");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Response:", err.response.data);
    } else {
      console.error(err.message);
    }

    throw new Error("Paddle transaction creation failed");
  }
}

module.exports = {
  createCheckout
};