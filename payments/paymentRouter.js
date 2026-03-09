// =====================================================
// Payment Router
// =====================================================

const paddleService = require("./paddleService");

async function createCheckout({ provider, tier, email }) {

  console.log("💳 Payment Router:", provider, tier);

  switch (provider) {

    case "paddle":
      return paddleService.createCheckout({ tier, email });

    case "ozow":

      const ozowService = require("./ozowService");
      return ozowService.createCheckout({ tier, email });

    default:
      throw new Error("Unsupported payment provider");

  }

}

module.exports = {
  createCheckout
};