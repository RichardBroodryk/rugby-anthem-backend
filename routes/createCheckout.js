// =====================================================
// Checkout Route (Payment Router)
// =====================================================

const express = require("express");
const router = express.Router();

const paymentRouter = require("../payments/paymentRouter");

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

    // Current provider
    const provider = "paddle";

    const result = await paymentRouter.createCheckout({
      provider,
      tier,
      email
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