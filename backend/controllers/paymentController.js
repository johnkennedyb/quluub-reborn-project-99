
const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private (Admin only)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('user', 'username fname lname email')
      .sort({ createdAt: -1 });

    // Format the payments data consistently
    const formattedPayments = payments.map(payment => ({
      _id: payment._id,
      user: {
        _id: payment.user._id,
        username: payment.user.username,
        fname: payment.user.fname,
        lname: payment.user.lname,
        email: payment.user.email,
        fullName: `${payment.user.fname} ${payment.user.lname}`
      },
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transactionId: payment.transactionId,
      paymentGateway: payment.paymentGateway,
      plan: payment.plan,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }));

    res.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Process refund
// @route   POST /api/admin/payments/:id/refund
// @access  Private (Admin only)
exports.processRefund = async (req, res) => {
  try {
    const paymentId = req.params.id;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({ message: 'Payment already refunded' });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ message: 'Can only refund successful payments' });
    }

    // Update payment status to refunded
    payment.status = 'refunded';
    payment.updatedAt = new Date();
    await payment.save();

    // TODO: Integrate with actual payment gateway for real refund processing
    console.log(`Refund processed for payment ${paymentId}`);

    res.json({ 
      message: 'Refund processed successfully', 
      payment: {
        _id: payment._id,
        status: payment.status,
        transactionId: payment.transactionId,
        amount: payment.amount
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create Paystack Payment
// @route   POST /api/payments/create-paystack-payment
// @access  Private
exports.createPaystackPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Create a new payment record
    const payment = new Payment({
      user: userId,
      amount: 4999, // $49.99 in cents
      currency: 'USD',
      status: 'pending',
      transactionId: `paystack_${Date.now()}_${userId}`,
      paymentGateway: 'Paystack',
      plan: 'premium'
    });

    await payment.save();

    // TODO: Integrate with actual Paystack API
    console.log('Paystack payment created:', payment._id);

    res.json({
      success: true,
      paymentId: payment._id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency
    });
  } catch (error) {
    console.error('Error creating Paystack payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Handle Paystack Webhook
// @route   POST /api/payments/paystack-webhook
// @access  Public (Webhook)
exports.paystackWebhook = async (req, res) => {
  try {
    const event = req.body;
    
    console.log('Paystack webhook received:', event);

    if (event.event === 'charge.success') {
      const transactionId = event.data.reference;
      
      // Find and update the payment
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        payment.status = 'succeeded';
        await payment.save();
        
        // Update user plan to premium
        await User.findByIdAndUpdate(payment.user, { plan: 'premium' });
        console.log(`Payment ${payment._id} marked as succeeded`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};
