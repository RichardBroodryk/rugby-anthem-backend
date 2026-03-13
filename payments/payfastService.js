// =====================================================
// PayFast Payment Service (Placeholder)
// =====================================================

async function createCheckout({ tier, email, userId }) {

  console.log("🏦 PayFast checkout requested:", {
    tier,
    email,
    userId
  });

  return {
    message: "PayFast integration coming soon"
  };

}

module.exports = {
  createCheckout
};