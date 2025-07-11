const nodemailer = require('nodemailer');

// Import email templates
const welcomeEmail = require('./emailTemplates/welcome');
const resetPasswordEmail = require('./emailTemplates/resetPassword');
const waliNewJoinerEmail = require('./emailTemplates/waliNewJoiner');
const connectionRequestEmail = require('./emailTemplates/connectionRequest');
const connectionRejectedEmail = require('./emailTemplates/connectionRejected');
const requestWithdrawnEmail = require('./emailTemplates/requestWithdrawn');
const profileViewEmail = require('./emailTemplates/profileView');
const pendingRequestsEmail = require('./emailTemplates/pendingRequests');
const purchasePlanEmail = require('./emailTemplates/purchasePlan');
const planPurchasedEmail = require('./emailTemplates/planPurchased');
const planExpiringEmail = require('./emailTemplates/planExpiring');
const planExpiredEmail = require('./emailTemplates/planExpired');
const encourageUnhideEmail = require('./emailTemplates/encourageUnhide');
const suggestedAccountsEmail = require('./emailTemplates/suggestedAccounts');
const contactWaliEmail = require('./emailTemplates/contactWali');
const waliViewChatEmail = require('./emailTemplates/waliViewChat');
const validateEmailTemplate = require('./emailTemplates/validateEmail');
const videoCallNotificationEmail = require('./emailTemplates/videoCallNotification');
const testEmailTemplate = require('./emailTemplates/testEmail');

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
let transporter = nodemailer.createTransport(emailConfig);

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

// Generic email sending function
const sendEmail = async (to, templateFunction, ...args) => {
  try {
    const { subject, html } = templateFunction(...args);
    const mailOptions = {
      from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
      to,
      subject,
      html,
      replyTo: emailSettings.replyTo,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} with subject: ${subject}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};

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
    transporter = nodemailer.createTransport(emailConfig);
    
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
    console.error('Error updating email-service configuration:', error);
    return false;
  }
};

// Specific email functions
const sendWelcomeEmail = (email, recipientName) => sendEmail(email, welcomeEmail, recipientName);
const sendResetPasswordEmail = (email, recipientName, resetLink) => sendEmail(email, resetPasswordEmail, recipientName, resetLink);
const sendWaliNewJoinerEmail = (email, waliName, sisterName) => sendEmail(email, waliNewJoinerEmail, waliName, sisterName);
const sendConnectionRequestEmail = (email, recipientName, requesterUsername) => sendEmail(email, connectionRequestEmail, recipientName, requesterUsername);
const sendConnectionRejectedEmail = (email, recipientName) => sendEmail(email, connectionRejectedEmail, recipientName);
const sendRequestWithdrawnEmail = (email, recipientName, withdrawerName) => sendEmail(email, requestWithdrawnEmail, recipientName, withdrawerName);
const sendProfileViewEmail = (email, recipientName, viewCount) => sendEmail(email, profileViewEmail, recipientName, viewCount);
const sendPendingRequestsEmail = (email, recipientName, requestCount) => sendEmail(email, pendingRequestsEmail, recipientName, requestCount);
const sendPurchasePlanEmail = (email, recipientName) => sendEmail(email, purchasePlanEmail, recipientName);
const sendPlanPurchasedEmail = (email, recipientName) => sendEmail(email, planPurchasedEmail, recipientName);
const sendPlanExpiringEmail = (email, recipientName) => sendEmail(email, planExpiringEmail, recipientName);
const sendPlanExpiredEmail = (email, recipientName) => sendEmail(email, planExpiredEmail, recipientName);
const sendEncourageUnhideEmail = (email, recipientName) => sendEmail(email, encourageUnhideEmail, recipientName);
const sendSuggestedAccountsEmail = (email, recipientName) => sendEmail(email, suggestedAccountsEmail, recipientName);
const sendContactWaliEmail = (email, brotherName) => sendEmail(email, contactWaliEmail, brotherName);
const sendWaliViewChatEmail = (email, waliName, wardName, brotherName, chatLink) => sendEmail(email, waliViewChatEmail, waliName, wardName, brotherName, chatLink);
const sendVideoCallNotificationEmail = (parentEmail, waliName, wardName, brotherName, callUrl) => sendEmail(parentEmail, videoCallNotificationEmail, waliName, wardName, brotherName, callUrl);

const sendValidationEmail = (email, recipientName, validationToken) => {
  const validationUrl = `${process.env.FRONTEND_URL}/validate-email?token=${validationToken}`;
  sendEmail(email, validateEmailTemplate, recipientName, validationUrl);
};

// New function to send bulk emails
const sendBulkEmail = async (users, subject, message, attachments = []) => {
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
      `,
      attachments: attachments
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

  if (failedCount > 0) {
    throw new Error(`${failedCount} out of ${successCount + failedCount} emails failed to send.`);
  }

  return { successCount, failedCount };
};

// New function to send test emails
const sendTestEmail = async (testEmail) => {
  const mailOptions = {
    from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
    to: testEmail,
    subject: 'Test Email - Quluub Configuration',
    html: `<h1>Test Email</h1><p>This is a test email to verify your email configuration.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

// Function to get the current email configuration
const getEmailConfigService = () => {
  return { ...emailConfig, ...emailSettings };
};

// Function to get email metrics (placeholder)
const getEmailMetricsService = async () => {
  return {
    sentLast24Hours: 0,
    sentLast7Days: 0,
    failedLast24Hours: 0,
    totalSent: 0,
    totalFailed: 0,
  };
};

module.exports = {
  updateEmailConfig,
  sendValidationEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendWaliNewJoinerEmail,
  sendConnectionRequestEmail,
  sendConnectionRejectedEmail,
  sendRequestWithdrawnEmail,
  sendProfileViewEmail,
  sendPendingRequestsEmail,
  sendPurchasePlanEmail,
  sendPlanPurchasedEmail,
  sendPlanExpiringEmail,
  sendPlanExpiredEmail,
  sendEncourageUnhideEmail,
  sendSuggestedAccountsEmail,
  sendContactWaliEmail,
  sendWaliViewChatEmail,
  sendVideoCallNotificationEmail,
  sendBulkEmail,
  sendTestEmail,
  getEmailConfigService,
  getEmailMetricsService
};
