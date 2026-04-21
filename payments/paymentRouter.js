// =====================================================
// Payment Dispatcher (Switch between providers)
// =====================================================

const paddleService = require("./paddleService");

async function createCheckout({ provider, tier, email, userId }) {
  console.log("💳 Payment Dispatcher called:", { provider, tier, email, userId });

  if (!provider || !tier || !email || !userId) {
    throw new Error("Missing required fields for checkout");
  }

  switch (provider.toLowerCase()) {
    case "paddle":
      return paddleService.createCheckout({ tier, email, userId });

    case "payfast":
      const payfastService = require("./payfastService");
      return payfastService.createCheckout({ tier, email, userId });

    case "fastspring":
      const fastspringService = require("./fastspringService");
      return fastspringService.createCheckout({ tier, email, userId });

    case "ozow":
      const ozowService = require("./ozowService");
      return ozowService.createCheckout({ tier, email, userId });

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

module.exports = {
  createCheckout
};