// =====================================================
// Ozow Payment Service (Placeholder)
// =====================================================

async function createCheckout({ tier, email }) {

  console.log("🏦 Ozow checkout requested:", tier, email);

  return {
    message: "Ozow integration coming soon"
  };

}

module.exports = {
  createCheckout
};