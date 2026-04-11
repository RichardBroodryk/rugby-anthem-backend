// =====================================================
// Verify Payment (Paddle Return Handler)
// =====================================================

const express = require("express");
const router = express.Router();

const db = require("../db"); // adjust to your DB import
const fetch = require("node-fetch");

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;

router.post("/", async (req, res) => {
  try {
    const { txn } = req.body;

    if (!txn) {
      return res.status(400).json({ error: "Transaction ID required" });
    }

    console.log("🔍 Verifying transaction:", txn);

    // 🔴 Call Paddle API
    const paddleRes = await fetch("https://api.paddle.com/transactions/" + txn, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await paddleRes.json();

    if (!data || !data.data) {
      throw new Error("Invalid Paddle response");
    }

    const transaction = data.data;

    // ✅ Extract info
    const email = transaction.customer.email;
    const priceId = transaction.items[0].price.id;

    console.log("✅ Paddle verified:", { email, priceId });

    // 🔴 Map price → tier
    let tier = "freemium";

    if (priceId === process.env.PADDLE_PRICE_PREMIUM) {
      tier = "premium";
    }

    if (priceId === process.env.PADDLE_PRICE_SUPER) {
      tier = "super";
    }

    // 🔴 Update DB
    await db.query(
      `UPDATE users SET tier = $1 WHERE email = $2`,
      [tier, email]
    );

    console.log("🔥 User upgraded:", email, tier);

    return res.json({ success: true, tier });

  } catch (err) {
    console.error("❌ Verify payment error:", err.message);

    return res.status(500).json({
      error: "Verification failed",
      debug: err.message,
    });
  }
});

module.exports = router;