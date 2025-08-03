const createEmailHeader = require('./components/emailHeader');
const createEmailFooter = require('./components/emailFooter');

const validateEmail = (recipientName, validationLink, verificationCode) => {
  const subject = 'Your Quluub Verification Code';
  
  const content = `
    <div style="
      background: white;
      padding: 40px 30px;
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #374151;
    ">
      <div style="margin-bottom: 30px;">
        <p style="
          color: #374151;
          font-size: 16px;
          margin: 0 0 15px 0;
        ">
          Dear ${recipientName},
        </p>
        <p style="
          color: #374151;
          font-size: 16px;
          margin: 0 0 20px 0;
        ">
          Salaamun alaekum
        </p>
      </div>
      
      <div style="margin: 20px 0;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
          Thank you for registering with Quluub! To complete your registration and start your journey to finding your perfect match, please use the verification code below:
        </p>
      </div>
      
      <div style="
        text-align: center;
        margin: 30px 0;
        background: linear-gradient(135deg, #14b8a6, #0f766e);
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(20, 184, 166, 0.3);
      ">
        <p style="
          color: white;
          font-size: 18px;
          margin: 0 0 15px 0;
          font-weight: 600;
        ">
          Your Verification Code
        </p>
        <div style="
          background: rgba(255, 255, 255, 0.95);
          color: #14b8a6;
          padding: 15px 20px;
          border-radius: 10px;
          font-size: 28px;
          letter-spacing: 8px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        ">
          ${verificationCode}
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
          Or click the button below to verify your email:
        </p>
        <a href="${validationLink}" style="
          background: linear-gradient(135deg, #14b8a6, #0f766e);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: 600;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(20, 184, 166, 0.3);
          transition: transform 0.2s;
        ">
          ✅ Verify My Email
        </a>
      </div>
      
      <div style="
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 15px;
        margin: 25px 0;
        border-radius: 0 8px 8px 0;
      ">
        <p style="
          margin: 0;
          font-size: 14px;
          color: #92400e;
          font-weight: 500;
        ">
          ⏰ <strong>Important:</strong> This verification code will expire in 10 minutes. If you didn't request this, please ignore this email.
        </p>
      </div>
      
      <div style="margin-top: 30px;">
        <p style="color: #374151; font-size: 16px; margin: 0;">
          Barakallahu feekum,<br>
          <strong style="color: #14b8a6;">The Quluub Team</strong>
        </p>
      </div>
    </div>
  `;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
      font-family: 'Arial', sans-serif;
    ">
      <div style="
        max-width: 600px;
        margin: 0 auto;
        background: white;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        border-radius: 10px;
        overflow: hidden;
      ">
        ${createEmailHeader(subject)}
        ${content}
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};

module.exports = validateEmail;
