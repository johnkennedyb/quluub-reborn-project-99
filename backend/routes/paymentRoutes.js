const express = require('express');
const router = express.Router();
const { createCheckoutSession, handleStripeWebhook, createPaystackPayment, handlePaystackWebhook } = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');

// @route   POST /api/payments/create-checkout-session
// @desc    Create a Stripe checkout session
// @access  Private
router.post('/create-checkout-session', protect, createCheckoutSession);

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// @route   POST /api/payments/create-paystack-payment
// @desc    Create a Paystack payment
// @access  Private
router.post('/create-paystack-payment', protect, createPaystackPayment);

// @route   POST /api/payments/paystack-webhook
// @desc    Handle Paystack webhooks
// @access  Public
router.post('/paystack-webhook', handlePaystackWebhook);

module.exports = router;
