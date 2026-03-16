// =====================================================
// PayFast Payment Service
// =====================================================

const crypto = require("crypto");

const PAYFAST_HOST = (process.env.PAYFAST_HOST || "").trim();
const PAYFAST_MERCHANT_ID = (process.env.PAYFAST_MERCHANT_ID || "").trim();
const PAYFAST_MERCHANT_KEY = (process.env.PAYFAST_MERCHANT_KEY || "").trim();
const PAYFAST_PASSPHRASE = (process.env.PAYFAST_PASSPHRASE || "").trim();

const PAYFAST_RETURN_URL = (process.env.PAYFAST_RETURN_URL || "").trim();
const PAYFAST_CANCEL_URL = (process.env.PAYFAST_CANCEL_URL || "").trim();
const PAYFAST_NOTIFY_URL = (process.env.PAYFAST_NOTIFY_URL || "").trim();

if (!PAYFAST_HOST) throw new Error("Missing PAYFAST_HOST");
if (!PAYFAST_MERCHANT_ID) throw new Error("Missing PAYFAST_MERCHANT_ID");
if (!PAYFAST_MERCHANT_KEY) throw new Error("Missing PAYFAST_MERCHANT_KEY");

// =====================================================
// Create PayFast Signature
// =====================================================

function generateSignature(data) {

  let pfOutput = "";

  for (let key in data) {

    if (data[key] !== "") {

      pfOutput +=
        key +
        "=" +
        encodeURIComponent(data[key]).replace(/%20/g, "+") +
        "&";
    }
  }

  pfOutput = pfOutput.slice(0, -1);

  if (PAYFAST_PASSPHRASE) {
    pfOutput += `&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE)}`;
  }

  return crypto
    .createHash("md5")
    .update(pfOutput)
    .digest("hex");
}

// =====================================================
// Create PayFast Checkout
// =====================================================

async function createCheckout({ tier, email, userId }) {

  console.log("🏦 PayFast checkout request:", {
    tier,
    email,
    userId
  });

  let amount;
  let itemName;

  if (tier === "premium") {
    amount = "2.00";
    itemName = "RAZ Premium";
  } else if (tier === "super") {
    amount = "3.00";
    itemName = "RAZ Super";
  } else {
    throw new Error("Invalid subscription tier");
  }

  const paymentData = {

    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,

    return_url: PAYFAST_RETURN_URL,
    cancel_url: PAYFAST_CANCEL_URL,
    notify_url: PAYFAST_NOTIFY_URL,

    name_first: "RAZ",
    name_last: "User",
    email_address: email,

    m_payment_id: userId,

    amount: amount,
    item_name: itemName
  };

  const signature = generateSignature(paymentData);

  const query = new URLSearchParams({
    ...paymentData,
    signature
  }).toString();

  const checkoutUrl = `${PAYFAST_HOST}?${query}`;

  console.log("✅ PayFast checkout URL:", checkoutUrl);

  return {
    checkoutUrl
  };
}

module.exports = {
  createCheckout
};