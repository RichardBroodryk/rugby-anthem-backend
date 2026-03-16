// =====================================================
// FastSpring Payment Service
// =====================================================

const FASTSPRING_STORE_URL = (process.env.FASTSPRING_STORE_URL || "").trim();
const FASTSPRING_PRODUCT_PREMIUM = (process.env.FASTSPRING_PRODUCT_PREMIUM || "").trim();
const FASTSPRING_PRODUCT_SUPER = (process.env.FASTSPRING_PRODUCT_SUPER || "").trim();

if (!FASTSPRING_STORE_URL) {
  throw new Error("Missing FASTSPRING_STORE_URL in environment variables");
}

if (!FASTSPRING_PRODUCT_PREMIUM || !FASTSPRING_PRODUCT_SUPER) {
  throw new Error("Missing FastSpring product paths in environment variables");
}

// =====================================================
// Create FastSpring Checkout
// =====================================================

async function createCheckout({ tier, email, userId }) {

  console.log("🧾 FastSpring checkout request:", {
    tier,
    email,
    userId
  });

  let productPath;

  if (tier === "premium") {
    productPath = FASTSPRING_PRODUCT_PREMIUM;
  } else if (tier === "super") {
    productPath = FASTSPRING_PRODUCT_SUPER;
  } else {
    throw new Error("Invalid subscription tier");
  }

  try {

    const checkoutUrl =
      `${FASTSPRING_STORE_URL}/${productPath}` +
      `?contact.email=${encodeURIComponent(email)}` +
      `&referrer=${encodeURIComponent(userId)}`;

    console.log("✅ FastSpring checkout URL:", checkoutUrl);

    return {
      checkoutUrl
    };

  } catch (err) {

    console.error("❌ FastSpring checkout creation failed");
    console.error(err.message);

    throw new Error("FastSpring checkout creation failed");
  }

}

module.exports = {
  createCheckout
};