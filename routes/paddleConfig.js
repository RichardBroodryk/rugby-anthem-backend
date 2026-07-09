// =====================================================
// Paddle Frontend Config — Rugby Anthem Zone
// Public config endpoint for Paddle.js initialization
//
// Returns only safe frontend config:
// - client token
// - environment
// =====================================================

const express = require("express");
const router = express.Router();

router.get("/", (_req, res) => {
  const clientToken = (process.env.PADDLE_CLIENT_TOKEN || "").trim();
  const environment = (
    process.env.PADDLE_ENVIRONMENT || "production"
  ).trim().toLowerCase();

  if (!clientToken) {
    return res.status(500).json({
      error: "PADDLE_CLIENT_TOKEN is not configured",
    });
  }

  return res.json({
    clientToken,
    environment,
  });
});

module.exports = router;