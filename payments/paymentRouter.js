// =====================================================
// Payment Dispatcher — Rugby Anthem Zone
// One-tier paid access model
// =====================================================

const paddleService = require("./paddleService");

async function createCheckout({ provider, product, email, userId }) {
  console.log("💳 Payment Dispatcher called:", {
    provider,
    product,
    email,
    userId,
  });

  if (!provider || !product || !email || !userId) {
    throw new Error("Missing required fields for checkout");
  }

  switch (provider.toLowerCase()) {
    case "paddle":
      return paddleService.createCheckout({ product, email, userId });

    case "payfast":
    case "fastspring":
    case "ozow":
      throw new Error(
        `Payment provider "${provider}" is not enabled for the current Rugby Anthem Zone one-tier checkout flow`
      );

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

module.exports = {
  createCheckout,
};