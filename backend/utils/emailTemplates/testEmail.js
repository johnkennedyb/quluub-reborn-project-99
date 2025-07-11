const footer = require('./footer');

const testEmail = (recipientEmail) => ({
  subject: 'Quluub Email Service Test',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #075e54;">Test Email</h2>
      <p>Hello,</p>
      <p>This is a test email from the Quluub email service.</p>
      <p>If you have received this email, it means your email configuration is working correctly.</p>
      <p>This email was sent to: <strong>${recipientEmail}</strong></p>
      <br>
      ${footer}
    </div>
  `
});

module.exports = testEmail;
