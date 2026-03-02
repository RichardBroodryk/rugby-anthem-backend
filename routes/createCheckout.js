// =====================================================
// Paddle Checkout Creator (OVERLAY MODE — FINAL)
// =====================================================

const express = require("express");
const axios = require("axios");
const router = express.Router();

// 🔐 ENV
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PREMIUM_PRICE_ID = process.env.PADDLE_PRICE_PREMIUM;
const SUPER_PRICE_ID = process.env.PADDLE_PRICE_SUPER;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!PADDLE_API_KEY) {
  console.error("❌ Missing PADDLE_API_KEY");
}

// =====================================================
router.post("/create-checkout", async (req, res) => {
  try {
    const { tier } = req.body;
    const email = req.userEmail;

    console.log("🧾 Checkout request:", { tier, email });

    if (!tier) {
      return res.status(400).json({ error: "Tier required" });
    }

    if (!email) {
      return res.status(400).json({ error: "User email missing in token" });
    }

    // 🎯 Map tier → price
    let priceId;

    if (tier === "premium") {
      priceId = PREMIUM_PRICE_ID;
    } else if (tier === "super") {
      priceId = SUPER_PRICE_ID;
    } else {
      return res.status(400).json({ error: "Invalid tier" });
    }

    console.log("💳 Using priceId:", priceId);

    // 🔥 Create Paddle transaction
    const paddleRes = await axios.post(
      "https://api.paddle.com/transactions",
      {
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer: {
          email,
        },
        custom_data: {
          tier,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const transactionId = paddleRes.data?.data?.id;

    if (!transactionId) {
      return res.status(500).json({
        error: "Transaction ID missing",
        debug: paddleRes.data,
      });
    }

    console.log("✅ Created transaction:", transactionId);

    // ✅ RETURN CHECKOUT URL (PRODUCTION PATH)
    const checkoutUrl = `${FRONTEND_URL}/terms?_ptxn=${transactionId}`;

    return res.json({ checkoutUrl });
  } catch (err) {
    console.error(
      "❌ Paddle checkout error:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      error: "Checkout creation failed",
      debug: err.response?.data || err.message,
    });
  }
});

module.exports = router;