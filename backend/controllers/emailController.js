
const User = require('../models/User');
const crypto = require('crypto');
const { sendValidationEmail, sendResetPasswordEmail } = require('../utils/emailService');

// @desc    Send email validation
// @route   POST /api/email/send-validation
// @access  Public
exports.sendEmailValidation = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log('Sending email validation for:', email);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    // Check if email is already validated
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already validated' });
    }
    
    // Generate validation token
    const validationToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to user
    user.validationToken = validationToken;
    user.validationTokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();
    
    // Send validation email
    const emailSent = await sendValidationEmail(email, validationToken);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send validation email' });
    }
    
    console.log('Validation email sent successfully to:', email);
    res.json({ 
      message: 'Validation email sent successfully',
      email: email
    });
    
  } catch (error) {
    console.error('Error sending email validation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify email with token
// @route   POST /api/email/verify
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Validation token is required' });
    }
    
    console.log('Verifying email with token:', token.substring(0, 8) + '...');
    
    // Find user with this validation token
    const user = await User.findOne({
      validationToken: token,
      validationTokenExpiration: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired validation token' 
      });
    }
    
    // Mark email as verified
    user.emailVerified = true;
    user.validationToken = '';
    user.validationTokenExpiration = null;
    user.status = 'active'; // Activate account if it was pending
    await user.save();
    
    console.log('Email verified successfully for user:', user.email);
    res.json({ 
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        emailVerified: user.emailVerified,
        status: user.status
      }
    });
    
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Resend email validation
// @route   POST /api/email/resend-validation
// @access  Private
exports.resendEmailValidation = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is already validated
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already validated' });
    }
    
    console.log('Resending email validation for user:', user.email);
    
    // Generate new validation token
    const validationToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to user
    user.validationToken = validationToken;
    user.validationTokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();
    
    // Send validation email
    const emailSent = await sendValidationEmail(user.email, validationToken);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send validation email' });
    }
    
    console.log('Validation email resent successfully to:', user.email);
    res.json({ 
      message: 'Validation email sent successfully',
      email: user.email
    });
    
  } catch (error) {
    console.error('Error resending email validation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check email verification status
// @route   GET /api/email/status
// @access  Private
exports.getEmailVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('email emailVerified validationTokenExpiration');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      email: user.email,
      emailVerified: user.emailVerified || false,
      hasValidationToken: !!user.validationTokenExpiration && user.validationTokenExpiration > Date.now()
    });
    
  } catch (error) {
    console.error('Error getting email verification status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send password reset email
// @route   POST /api/email/forgot-password
// @access  Public
exports.sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log('Sending password reset email for:', email);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    
    // Send password reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailSent = await sendResetPasswordEmail(user.email, user.fname, resetLink);
    
    if (!emailSent) {
      console.error('Failed to send password reset email to:', email);
    } else {
      console.log('Password reset email sent successfully to:', email);
    }
    
    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/email/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    console.log('Resetting password with token:', token.substring(0, 8) + '...');
    
    // Find user with this reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiration: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }
    
    // Update password
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.resetPasswordToken = '';
    user.resetPasswordTokenExpiration = null;
    await user.save();
    
    console.log('Password reset successfully for user:', user.email);
    res.json({ 
      message: 'Password reset successfully'
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
