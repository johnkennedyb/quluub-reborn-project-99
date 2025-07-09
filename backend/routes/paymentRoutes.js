const express = require('express');
const router = express.Router();
const { createCheckoutSession, handleStripeWebhook } = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');

// @route   POST /api/payments/create-checkout-session
// @desc    Create a Stripe checkout session
// @access  Private
router.post('/create-checkout-session', protect, createCheckoutSession);

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
