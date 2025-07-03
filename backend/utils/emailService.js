
const nodemailer = require('nodemailer');

// Configure nodemailer with Whogohost settings
const transporter = nodemailer.createTransport({
  host: 'mail.quluub.com',
  port: 465, // Use 465 for SSL or 587 for TLS
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter verified successfully');
  }
});

const sendValidationEmail = async (email, validationToken) => {
  const validationUrl = `${process.env.FRONTEND_URL}/validate-email?token=${validationToken}`;
  
  const mailOptions = {
    from: '"Quluub" <admin@quluub.com>',
    to: email,
    subject: 'Validate Your Email - Quluub',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #075e54; margin: 0;">Welcome to Quluub!</h1>
            <p style="color: #666; font-size: 16px; margin-top: 10px;">Your Islamic marriage platform</p>
          </div>
          
          <p style="color: #333; line-height: 1.6; font-size: 16px;">
            Assalamu Alaikum and welcome to our community! 🌙
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining Quluub. Please click the button below to validate your email address and complete your registration:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${validationUrl}" 
               style="background-color: #25d366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              Validate My Email
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link in your browser:<br>
            <a href="${validationUrl}" style="color: #075e54; word-break: break-all;">${validationUrl}</a>
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't create this account, please ignore this email.<br>
              May Allah bless your journey to find your perfect match.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Validation email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending validation email:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: '"Quluub" <admin@quluub.com>',
    to: email,
    subject: 'Reset Your Password - Quluub',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #075e54; margin: 0;">Password Reset Request</h1>
            <p style="color: #666; font-size: 16px; margin-top: 10px;">Quluub</p>
          </div>
          
          <p style="color: #333; line-height: 1.6; font-size: 16px;">
            Assalamu Alaikum,
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            You requested to reset your password. Click the button below to set a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link in your browser:<br>
            <a href="${resetUrl}" style="color: #075e54; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.<br>
              For security, please contact us if you continue to have issues.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

const sendVideoCallNotificationEmail = async (parentEmail, userDetails, partnerDetails, callUrl) => {
  const mailOptions = {
    from: '"Quluub" <admin@quluub.com>',
    to: parentEmail,
    subject: 'Video Call Notification - Quluub',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #075e54; margin: 0;">Video Call Notification</h1>
            <p style="color: #666; font-size: 16px; margin-top: 10px;">Quluub - Islamic Marriage Platform</p>
          </div>
          
          <p style="color: #333; line-height: 1.6; font-size: 16px;">
            Assalamu Alaikum,
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            This is to inform you that <strong>${userDetails.fname} ${userDetails.lname}</strong> is about to have a video call with <strong>${partnerDetails.fname} ${partnerDetails.lname}</strong> on our platform.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #075e54; margin-top: 0;">Call Details:</h3>
            <p style="margin: 5px 0;"><strong>Your ward:</strong> ${userDetails.fname} ${userDetails.lname}</p>
            <p style="margin: 5px 0;"><strong>Speaking with:</strong> ${partnerDetails.fname} ${partnerDetails.lname}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${partnerDetails.country || 'Not specified'}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If you wish to monitor or join this conversation, you can use the link below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${callUrl}" 
               style="background-color: #25d366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              Join Call
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This notification is sent as part of our commitment to transparency and family involvement.<br>
              May Allah guide both families toward what is best.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Video call notification email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending video call notification email:', error);
    return false;
  }
};

const sendMatchChatReportEmail = async (parentEmail, userDetails, partnerDetails, messages) => {
  // Format messages for email display
  const messagesHtml = messages.map(msg => `
    <div style="margin: 10px 0; padding: 10px; border-left: 3px solid ${msg.senderId.toString() === userDetails._id.toString() ? '#25d366' : '#075e54'}; background-color: #f8f9fa;">
      <p style="margin: 0; font-weight: bold; color: #333;">
        ${msg.senderId.toString() === userDetails._id.toString() ? userDetails.fname : partnerDetails.fname}:
      </p>
      <p style="margin: 5px 0 0 0; color: #666;">${msg.message}</p>
      <small style="color: #999;">${new Date(msg.created).toLocaleString()}</small>
    </div>
  `).join('');

  const mailOptions = {
    from: '"Quluub" <admin@quluub.com>',
    to: parentEmail,
    subject: 'Match Chat Report - Quluub',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #075e54; margin: 0;">Match Chat Report</h1>
            <p style="color: #666; font-size: 16px; margin-top: 10px;">Quluub - Islamic Marriage Platform</p>
          </div>
          
          <p style="color: #333; line-height: 1.6; font-size: 16px;">
            Assalamu Alaikum,
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            This is a chat report between <strong>${userDetails.fname} ${userDetails.lname}</strong> and <strong>${partnerDetails.fname} ${partnerDetails.lname}</strong>.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #075e54; margin-top: 0;">Conversation Details:</h3>
            <p style="margin: 5px 0;"><strong>Your ward:</strong> ${userDetails.fname} ${userDetails.lname}</p>
            <p style="margin: 5px 0;"><strong>Matched with:</strong> ${partnerDetails.fname} ${partnerDetails.lname}</p>
            <p style="margin: 5px 0;"><strong>Total messages:</strong> ${messages.length}</p>
            <p style="margin: 5px 0;"><strong>Report generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #075e54;">Chat Messages:</h3>
            ${messagesHtml || '<p style="color: #666; font-style: italic;">No messages exchanged yet.</p>'}
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This report is sent as part of our commitment to transparency and family involvement.<br>
              May Allah guide both families toward what is best.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Match chat report email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending match chat report email:', error);
    return false;
  }
};

module.exports = {
  sendValidationEmail,
  sendPasswordResetEmail,
  sendVideoCallNotificationEmail,
  sendMatchChatReportEmail
};
