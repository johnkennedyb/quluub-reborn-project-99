// Initialize Stripe only if API key is available
let stripe;
try {
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_API_KEY;
  if (stripeKey) {
    stripe = require('stripe')(stripeKey);
  } else {
    console.log('⚠️ Stripe not configured - payment features will be disabled');
  }
} catch (error) {
  console.log('⚠️ Stripe initialization failed:', error.message);
}

const User = require('../models/User');
const { sendPlanPurchasedEmail, sendPlanExpiringEmail, sendPlanExpiredEmail } = require('../utils/emailService');

// @desc    Create a Stripe checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Private
const createCheckoutSession = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      message: 'Payment service not configured. Please contact administrator.' 
    });
  }

  const { priceId } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: userId,
      success_url: `${process.env.CLIENT_URL}/profile?payment_success=true`,
      cancel_url: `${process.env.CLIENT_URL}/profile?payment_canceled=true`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Handle Stripe webhooks
// @route   POST /api/payments/webhook
// @access  Public
const handleStripeWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      message: 'Payment service not configured' 
    });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription;

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const user = await User.findById(userId);
      if (user) {
        user.subscription.status = 'active';
        user.subscription.plan = subscription.items.data[0].plan.nickname;
        user.subscription.stripeSubscriptionId = subscriptionId;
        user.subscription.stripeCustomerId = session.customer;
        user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        await user.save();
        console.log(`Successfully updated subscription for user ${userId}`);
        sendPlanPurchasedEmail(user.email, user.fname);
      }
    } catch (error) {
      console.error('Error in checkout.session.completed:', error);
    }
  } else if (event.type === 'invoice.upcoming') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    try {
      const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
      if (user) {
        console.log(`Sending plan expiring email to ${user.email}`);
        sendPlanExpiringEmail(user.email, user.fname);
      }
    } catch (error) {
      console.error('Error in invoice.upcoming:', error);
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    try {
      const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
      if (user) {
        user.subscription.status = 'expired';
        await user.save();
        console.log(`Subscription expired for user ${user.email}`);
        sendPlanExpiredEmail(user.email, user.fname);
      }
    } catch (error) {
      console.error('Error in customer.subscription.deleted:', error);
    }
  }

  res.json({ received: true });
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAllPayments = async (req, res) => {
  try {
    // This is a placeholder. In a real application, you would fetch payments from your database.
    res.json({ message: 'Function not implemented. This will show all payments.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Process a refund
// @route   POST /api/admin/payments/:id/refund
// @access  Private/Admin
const processRefund = async (req, res) => {
  try {
    // This is a placeholder. In a real application, you would integrate with Stripe's refund API.
    const { id } = req.params;
    console.log(`Refunding payment ${id}`);
    res.json({ message: `Refund for payment ${id} processed successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  createCheckoutSession, 
  handleStripeWebhook, 
  getAllPayments, 
  processRefund 
};
