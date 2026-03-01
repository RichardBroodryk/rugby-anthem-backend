// =====================================================
// Paddle Checkout Creator (FINAL STABLE + SUBSCRIPTION FIX)
// =====================================================

const express = require('express');
const axios = require('axios');
const router = express.Router();

// 🔐 ENV
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PREMIUM_PRICE_ID = process.env.PADDLE_PRICE_PREMIUM;
const SUPER_PRICE_ID = process.env.PADDLE_PRICE_SUPER;
const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:3000';

if (!PADDLE_API_KEY) {
  console.error('❌ Missing PADDLE_API_KEY');
}

// =====================================================
router.post('/create-checkout', async (req, res) => {
  try {
    const { tier } = req.body;
    const email = req.userEmail;

    console.log('🧾 Checkout request:', { tier, email });

    if (!tier) {
      return res.status(400).json({ error: 'Tier required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'User email missing in token' });
    }

    // Map tier → price
    let priceId;

    if (tier === 'premium') {
      priceId = PREMIUM_PRICE_ID;
    } else if (tier === 'super') {
      priceId = SUPER_PRICE_ID;
    } else {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // =====================================================
    // 🧪 BUILD PADDLE PAYLOAD (FIXED FOR SUBSCRIPTIONS)
    // =====================================================

    const paddlePayload = {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],

      // ⭐ CRITICAL FOR SUBSCRIPTION PRICES
      collection_mode: 'automatic',

      customer: {
        email,
      },

      custom_data: {
        tier,
      },

      checkout: {
        success_url: `${FRONTEND_URL}/access-granted`,
        cancel_url: `${FRONTEND_URL}/pricing`,
      },
    };

    // 🧪 FORENSIC LOGS
    console.log('💳 Using priceId:', priceId);
    console.log('🔐 Paddle key present:', !!PADDLE_API_KEY);
    console.log(
      '🔑 Paddle key prefix:',
      PADDLE_API_KEY ? PADDLE_API_KEY.substring(0, 20) : 'NONE'
    );
    console.log('🌐 Frontend URL:', FRONTEND_URL);
    console.log('📦 Paddle payload:', JSON.stringify(paddlePayload, null, 2));

    console.log(
  '🔑 Paddle key length:',
  PADDLE_API_KEY ? PADDLE_API_KEY.length : 0
);

    // =====================================================
    // 🔥 Create Paddle transaction
    // =====================================================

    const paddleRes = await axios.post(
      'https://api.paddle.com/transactions',
      paddlePayload,
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const checkoutUrl = paddleRes.data?.data?.checkout?.url;

    if (!checkoutUrl) {
      return res.status(500).json({
        error: 'Checkout URL missing',
        debug: paddleRes.data,
      });
    }

    return res.json({ checkoutUrl });
  } catch (err) {
    console.error(
      '❌ Paddle checkout error:',
      err.response?.data || err.message
    );

    return res.status(500).json({
      error: 'Checkout creation failed',
      debug: err.response?.data || err.message,
    });
  }
});

module.exports = router;