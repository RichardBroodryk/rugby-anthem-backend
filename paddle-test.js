// =====================================================
// Paddle Transaction Test
// This bypasses your app and tests Paddle directly
// =====================================================

require("dotenv").config();
const axios = require("axios");

// ENV VARIABLES
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PRICE_ID = "pri_01khxjt428mgbphxfv3j1748rf";

async function run() {

  console.log("------------ ENV CHECK ------------");

  console.log("KEY LENGTH:", PADDLE_API_KEY ? PADDLE_API_KEY.length : "undefined");
  console.log("PRICE ID:", PRICE_ID);

  console.log("-----------------------------------");

  try {

    const res = await axios.post(
      "https://api.paddle.com/transactions",
      {
        items: [
          {
            price_id: PRICE_ID,
            quantity: 1
          }
        ],
        customer_email: "raz.test.buyer+debug@gmail.com"
      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("SUCCESS");
    console.log(res.data);

  } catch (err) {

    console.log("ERROR STATUS:", err.response?.status);

    console.log("ERROR DATA:");
    console.log(err.response?.data);

  }

}

run();