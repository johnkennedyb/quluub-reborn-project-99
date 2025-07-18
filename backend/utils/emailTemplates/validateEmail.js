const footer = require('./footer');

const validateEmail = (recipientName, validationLink, verificationCode) => {
  const subject = 'Your Quluub Verification Code';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://res.cloudinary.com/dn82ie7wt/image/upload/v1752017813/WhatsApp_Image_2025-07-08_at_17.57.16_40b9a289_v3d7iy.jpg" alt="Quluub Welcome" style="max-width: 100%; height: auto;" />
        </div>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Salaamun alaekum ${recipientName},
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Thank you for registering with Quluub! To complete your registration, please use the following verification code:
        </p>
        
        <div style="text-align: center; margin: 30px 0; background-color: #f0f0f0; padding: 20px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${verificationCode}
        </div>
        
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Or click the button below to verify your email:
        </p>
        
        <p style="color: #333; line-height: 1.6; font-size: 16px; text-align: center; margin: 20px 0;">
          <a href="${validationLink}" style="background-color: #075e54; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Verify Email</a>
        </p>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <strong>Note:</strong> This verification code will expire in 10 minutes. If you didn't request this, please ignore this email.
        </p>
        
        ${footer}
      </div>
    </div>
  `;

  return { subject, html };
};

module.exports = validateEmail;
