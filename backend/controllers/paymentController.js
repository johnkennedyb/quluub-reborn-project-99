
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
