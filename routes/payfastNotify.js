// =====================================================
// PayFast Notify Endpoint
// =====================================================

const express = require("express");

const router = express.Router();

router.post("/payfast/notify", async (req, res) => {

  try {

    console.log("🔔 PayFast Notify Received");

    const data = req.body;

    console.log("PayFast payload:", data);

    // =====================================================
    // Basic Validation
    // =====================================================

    if (!data || !data.payment_status) {
      console.log("❌ Invalid PayFast payload");
      return res.status(400).send("Invalid payload");
    }

    // =====================================================
    // Payment Completed
    // =====================================================

    if (data.payment_status === "COMPLETE") {

      const userId = data.m_payment_id;

      console.log("✅ PayFast payment completed for user:", userId);

      // TODO
      // Here we will later activate the user's subscription
      // Example:
      // await activateSubscription(userId);

    }

    res.status(200).send("OK");

  } catch (err) {

    console.error("❌ PayFast notify error:", err);

    res.status(500).send("Server error");

  }

});

module.exports = router;