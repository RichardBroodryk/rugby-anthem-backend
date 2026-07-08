// =====================================================
// Payment Route Handler — Rugby Anthem Zone
// One-tier paid access checkout entry
// Frontend contract:
// POST /api/payments
// { product: "raz-premium" }
// =====================================================

const express = require("express");
const router = express.Router();
const paymentDispatcher = require("../payments/paymentRouter");

router.post("/", async (req, res) => {
  try {
    console.log("🧠 AUTH DEBUG:", {
      userId: req.userId,
      userEmail: req.userEmail,
      headers: req.headers.authorization,
    });

    const { product } = req.body || {};
    const email = req.userEmail;
    const userId = req.userId;

    console.log("🧾 Checkout request received:", {
      product,
      email,
      userId,
      provider: "paddle",
    });

    if (!product) {
      return res.status(400).json({ error: "Product is required" });
    }

    if (product !== "raz-premium") {
      return res.status(400).json({ error: "Invalid product" });
    }

    if (!email) {
      return res.status(400).json({ error: "User email missing in token" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID missing in token" });
    }

    const result = await paymentDispatcher.createCheckout({
      provider: "paddle",
      product,
      email,
      userId,
    });

    console.log("✅ Checkout created successfully");

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