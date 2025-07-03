
const User = require('../models/User');

// @desc    Create Paystack payment
// @route   POST /api/payments/create-paystack-payment
// @access  Private
exports.createPaystackPayment = async (req, res) => {
  try {
    const userInfo = req.user;
    
    // Paystack payment initialization
    const paystackData = {
      email: userInfo.email,
      amount: 500000, // 5000 NGN in kobo (£5 equivalent)
      currency: 'NGN',
      callback_url: `${process.env.WEB_DOMAIN}/settings?payment=success`,
      metadata: {
        user_id: userInfo._id,
        user_email: userInfo.email,
        plan: 'premium'
      }
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer sk_live_92f26ac052547db6826c7f7a471c5ea72e4004b6`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackData)
    });

    const paymentData = await response.json();

    if (!paymentData.status) {
      throw new Error(paymentData.message || 'Failed to create payment');
    }

    res.json({ 
      authorization_url: paymentData.data.authorization_url,
      reference: paymentData.data.reference 
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Handle Paystack webhook
// @route   POST /api/payments/paystack-webhook
// @access  Public
exports.paystackWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.event === 'charge.success') {
      const userEmail = event.data.metadata?.user_email;
      
      if (userEmail) {
        const user = await User.findOne({ email: userEmail });
        if (user) {
          user.plan = 'premium';
          await user.save();
          console.log(`User ${userEmail} upgraded to premium`);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};
