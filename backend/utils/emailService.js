const nodemailer = require('nodemailer');

// Default configuration - can be updated dynamically
let emailConfig = {
  host: process.env.SMTP_HOST || 'mail.quluub.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER || 'mail@quluub.com',
    pass: process.env.MAIL_PASSWORD || 'Z}!QLm__(e8p?I8J'
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Email settings
let emailSettings = {
  fromName: process.env.FROM_NAME || 'Quluub Team',
  fromEmail: process.env.FROM_EMAIL || 'mail@quluub.com',
  replyTo: process.env.REPLY_TO || 'support@quluub.com'
};

// Create transporter with current configuration
let transporter = nodemailer.createTransporter(emailConfig);

// Verify transporter configuration
const verifyTransporter = () => {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter verification failed:', error);
    } else {
      console.log('Email transporter verified successfully');
    }
  });
};

// Initial verification
verifyTransporter();

// Function to update email configuration
const updateEmailConfig = async (newConfig) => {
  try {
    emailConfig = {
      host: newConfig.smtpHost,
      port: parseInt(newConfig.smtpPort),
      secure: parseInt(newConfig.smtpPort) === 465,
      auth: {
        user: newConfig.smtpUser,
        pass: newConfig.smtpPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    emailSettings = {
      fromName: newConfig.fromName,
      fromEmail: newConfig.fromEmail,
      replyTo: newConfig.replyTo
    };

    // Create new transporter with updated config
    transporter = nodemailer.createTransporter(emailConfig);
    
    // Verify new configuration
    return new Promise((resolve) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('Updated email transporter verification failed:', error);
          resolve(false);
        } else {
          console.log('Updated email transporter verified successfully');
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Error updating email configuration:', error);
    return false;
  }
};

const sendValidationEmail = async (email, validationToken) => {
  const validationUrl = `${process.env.FRONTEND_URL}/validate-email?token=${validationToken}`;
  
  const mailOptions = {
    from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
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
    from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
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

// New function to send bulk emails
const sendBulkEmail = async (users, subject, message) => {
  let successCount = 0;
  let failedCount = 0;

  for (const user of users) {
    const mailOptions = {
      from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
      to: user.email,
      subject: subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #075e54; margin: 0;">Quluub</h1>
              <p style="color: #666; font-size: 16px; margin-top: 10px;">Islamic Marriage Platform</p>
            </div>
            
            <p style="color: #333; line-height: 1.6; font-size: 16px;">
              Assalamu Alaikum ${user.fname || 'Dear Member'},
            </p>
            
            <div style="color: #666; line-height: 1.6; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                Best regards,<br>
                The Quluub Team<br>
                <a href="${process.env.FRONTEND_URL}" style="color: #075e54;">quluub.com</a>
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      successCount++;
      console.log(`Bulk email sent to: ${user.email}`);
    } catch (error) {
      failedCount++;
      console.error(`Failed to send bulk email to ${user.email}:`, error);
    }
  }

  return { successCount, failedCount };
};

// New function to send test emails
const sendTestEmail = async (testEmail) => {
  const mailOptions = {
    from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
    to: testEmail,
    subject: 'Test Email - Quluub Configuration',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #075e54; margin: 0;">Email Configuration Test</h1>
            <p style="color: #666; font-size: 16px; margin-top: 10px;">Quluub</p>
          </div>
          
          <p style="color: #333; line-height: 1.6; font-size: 16px;">
            This is a test email to verify your email configuration is working correctly.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #075e54; margin-top: 0;">Configuration Details:</h3>
            <p style="margin: 5px 0;"><strong>SMTP Host:</strong> ${emailConfig.host}</p>
            <p style="margin: 5px 0;"><strong>SMTP Port:</strong> ${emailConfig.port}</p>
            <p style="margin: 5px 0;"><strong>From Email:</strong> ${emailSettings.fromEmail}</p>
            <p style="margin: 5px 0;"><strong>From Name:</strong> ${emailSettings.fromName}</p>
            <p style="margin: 5px 0;"><strong>Reply To:</strong> ${emailSettings.replyTo}</p>
          </div>
          
          <p style="color: #25d366; font-weight: bold; text-align: center;">
            ✅ Email configuration is working correctly!
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Test email sent at: ${new Date().toLocaleString()}<br>
              Quluub Admin Panel
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
};

module.exports = {
  sendValidationEmail,
  sendPasswordResetEmail,
  sendVideoCallNotificationEmail,
  sendMatchChatReportEmail,
  sendBulkEmail,
  sendTestEmail,
  updateEmailConfig
};
