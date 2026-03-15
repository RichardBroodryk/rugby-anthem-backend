// =====================================================
// Checkout Route (Payment Router)
// =====================================================

const express = require("express");
const router = express.Router();

const paymentRouter = require("../payments/paymentRouter");

router.post("/", async (req, res) => {

  try {

    const { tier } = req.body;

    const email = req.userEmail;
    const userId = req.userId;

    console.log("🧾 Checkout request:", { tier, email, userId });

    if (!tier) {
      return res.status(400).json({ error: "Tier required" });
    }

    if (!email) {
      return res.status(400).json({ error: "User email missing in token" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID missing in token" });
    }

    const provider = "paddle";

    const result = await paymentRouter.createCheckout({
      provider,
      tier,
      email,
      userId
    });

    return res.json(result);

  } catch (err) {

    console.error("❌ Checkout error:", err.message);

    return res.status(500).json({
      error: "Checkout failed",
      debug: err.message
    });

  }

});

module.exports = router;