
const express = require('express');
const { createPaystackPayment, paystackWebhook } = require('../controllers/paymentController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// @route   POST /api/payments/create-paystack-payment
// @access  Private
router.post('/create-paystack-payment', auth, createPaystackPayment);

// @route   POST /api/payments/paystack-webhook
// @access  Public (Webhook)
router.post('/paystack-webhook', paystackWebhook);

module.exports = router;
