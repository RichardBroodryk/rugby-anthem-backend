// =====================================================
// Payment Router
// =====================================================

const paddleService = require("./paddleService");
const ozowService = require("./ozowService");

async function createCheckout({ provider, tier, email }) {

  console.log("💳 Payment Router:", provider, tier);

  switch (provider) {

    case "paddle":
      return paddleService.createCheckout({ tier, email });

    case "ozow":
      return ozowService.createCheckout({ tier, email });

    default:
      throw new Error("Unsupported payment provider");

  }

}

module.exports = {
  createCheckout
};