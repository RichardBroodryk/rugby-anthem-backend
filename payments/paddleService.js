// =====================================================
// Paddle Payment Service
// =====================================================

const axios = require("axios");

// ENV
const PADDLE_API_KEY = (process.env.PADDLE_API_KEY || "").trim();
const PREMIUM_PRICE_ID = process.env.PADDLE_PRICE_PREMIUM;
const SUPER_PRICE_ID = process.env.PADDLE_PRICE_SUPER;
const FRONTEND_URL = process.env.FRONTEND_URL;



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
        },

        // where user returns after payment
        checkout: {
          success_url: `${FRONTEND_URL}/payment-success`,
          cancel_url: `${FRONTEND_URL}/payment-cancel`
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

      console.error(
        "❌ Paddle response missing transaction:",
        paddleRes?.data
      );

      throw new Error("Transaction data missing");

    }

    const checkoutUrl = transaction.checkout?.url;

    if (!checkoutUrl) {

      console.error(
        "❌ Paddle response missing checkout URL:",
        paddleRes?.data
      );

      throw new Error("Checkout URL missing");

    }

    console.log("✅ Paddle checkout URL:", checkoutUrl);

    return {
      checkoutUrl
    };

  } catch (err) {

    console.error("❌ PADDLE API ERROR");

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