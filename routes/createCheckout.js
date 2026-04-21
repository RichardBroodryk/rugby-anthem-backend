// =====================================================
// Payment Route Handler (Express Router)
// =====================================================

const express = require("express");
const router = express.Router();

// Import the dispatcher (the file with the switch)
const paymentDispatcher = require("../payments/paymentRouter");

router.post("/", async (req, res) => {
  try {

    console.log("🧠 AUTH DEBUG:", {
  userId: req.userId,
  userEmail: req.userEmail,
  headers: req.headers.authorization
});
    const { tier } = req.body;

    const email = req.userEmail;
    const userId = req.userId;

    console.log("🧾 Checkout request received:", { 
      tier, 
      email, 
      userId,
      provider: "paddle" 
    });

    if (!tier) {
      return res.status(400).json({ error: "Tier is required" });
    }

    if (!email) {
      return res.status(400).json({ error: "User email missing in token" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID missing in token" });
    }

    // Delegate to the dispatcher
    const result = await paymentDispatcher.createCheckout({
      provider: "paddle",
      tier,
      email,
      userId,
    });

    console.log("✅ Checkout created successfully, URL received");

    return res.json(result);

  } catch (err) {
    console.error("❌ Checkout error:", err.message);
    return res.status(500).json({
      error: "Checkout failed",
      debug: err.message,
    });
  }
});

module.exports = router;