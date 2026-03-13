// =====================================================
// Payment Router
// =====================================================

const paddleService = require("./paddleService");

async function createCheckout({ provider, tier, email, userId }) {

  console.log("💳 Payment Router:", provider, tier, email, userId);

  switch (provider) {

    // ================= PADDLE =================
    case "paddle":
      return paddleService.createCheckout({
        tier,
        email,
        userId
      });

    // ================= 2CHECKOUT =================
    case "2checkout":

      const twoCheckoutService = require("./twoCheckoutService");

      return twoCheckoutService.createCheckout({
        tier,
        email,
        userId
      });

    // ================= PAYFAST =================
    case "payfast":

      const payfastService = require("./payfastService");

      return payfastService.createCheckout({
        tier,
        email,
        userId
      });

    // ================= OZOW =================
    case "ozow":

      const ozowService = require("./ozowService");

      return ozowService.createCheckout({
        tier,
        email,
        userId
      });

    default:
      throw new Error("Unsupported payment provider");

  }

}

module.exports = {
  createCheckout
};