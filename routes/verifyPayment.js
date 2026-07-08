// =====================================================
// Legacy Verify Payment Route — Rugby Anthem Zone
// DISABLED DURING ONE-TIER PAYMENT RESET
//
// This file previously contained an older checkout/payment path
// that used tier-based premium/super logic.
// It is intentionally disabled so it cannot conflict with the
// live one-tier checkout flow now handled by:
//
// - routes/createCheckout.js
// - payments/paymentRouter.js
// - payments/paddleService.js
//
// If a frontend/backend path still tries to call this route,
// it should be updated to use /api/payments instead.
// =====================================================

const express = require("express");
const router = express.Router();

router.all("*", async (_req, res) => {
  return res.status(410).json({
    error: "Legacy payment verification route disabled",
    message:
      "Use the one-tier /api/payments checkout flow instead.",
  });
});

module.exports = router;