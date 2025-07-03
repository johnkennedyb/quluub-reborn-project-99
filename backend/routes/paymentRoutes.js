
const express = require('express');
const { createPaystackPayment, paystackWebhook } = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/create-paystack-payment', protect, createPaystackPayment);
router.post('/paystack-webhook', paystackWebhook);

module.exports = router;
