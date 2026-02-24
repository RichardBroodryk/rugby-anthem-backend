// =====================================================
// Paddle Checkout Creator (Paddle Billing v2)
// Rugby Anthem Zone
// =====================================================

const express = require('express');
const axios = require('axios');
const router = express.Router();
const pool = require('../db');

// 🔐 ENV
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PREMIUM_PRICE_ID = process.env.PADDLE_PRICE_PREMIUM;
const SUPER_PRICE_ID = process.env.PADDLE_PRICE_SUPER;
const FRONTEND_URL =
  process.env.FRONTEND_URL || 'https://rugbyanthemzone.com';

// 🔍 ENV sanity check (startup visibility)
if (!PADDLE_API_KEY) {
  console.error('❌ Missing PADDLE_API_KEY');
}
if (!PREMIUM_PRICE_ID || !SUPER_PRICE_ID) {
  console.error('❌ Missing Paddle price IDs');
}

// =====================================================
// POST /api/payments/create-checkout
// =====================================================
router.post('/create-checkout', async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.userId;

    console.log('🧾 Checkout request:', { tier, userId });

    if (!tier) {
      return res.status(400).json({ error: 'Tier required' });
    }

    // -------------------------------------------------
    // Get user email
    // -------------------------------------------------
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const email = userResult.rows[0].email;

    // -------------------------------------------------
    // Map tier → price_id
    // -------------------------------------------------
    let priceId;

    if (tier === 'premium') {
      priceId = PREMIUM_PRICE_ID;
    } else if (tier === 'super') {
      priceId = SUPER_PRICE_ID;
    } else {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    console.log('💳 Using priceId:', priceId);

    // -------------------------------------------------
    // 🔥 CREATE PADDLE TRANSACTION (FIXED)
    // -------------------------------------------------
    const paddleRes = await axios.post(
      'https://api.paddle.com/transactions',
      {
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer: {
          email,
        },
        custom_data: {
          user_id: userId,
          tier,
        },

        // ✅ CRITICAL: forces hosted checkout session
        checkout: {
          success_url: `${FRONTEND_URL}/access-granted`,
          cancel_url: `${FRONTEND_URL}/pricing`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const checkoutUrl = paddleRes.data?.data?.checkout?.url;

    console.log('✅ Paddle response received');
    console.log('🔗 Checkout URL:', checkoutUrl);

    if (!checkoutUrl) {
      console.error('❌ Checkout URL missing from Paddle response');
      return res.status(500).json({ error: 'Checkout URL missing' });
    }

    return res.json({ checkoutUrl });
  } catch (err) {
    console.error(
      '❌ Paddle checkout error FULL:',
      err.response?.data || err.message
    );

    return res.status(500).json({
      error: 'Checkout creation failed',
      paddle: err.response?.data || err.message,
    });
  }
});

module.exports = router;