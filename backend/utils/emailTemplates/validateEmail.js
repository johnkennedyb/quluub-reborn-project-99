const footer = require('./footer');

const validateEmail = (recipientName, validationLink) => {
  const subject = 'Action Required: Validate Your Email Address';
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
          To ensure the security of your Quluub account and receive important updates, please validate your email address by clicking the link below:
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px; text-align: center; margin: 30px 0;">
          <a href="${validationLink}" style="background-color: #075e54; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Validate Your Email</a>
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Validating your email address helps us keep your account secure and ensures you receive notifications about matches, messages, and more.
        </p>
        ${footer}
      </div>
    </div>
  `;

  return { subject, html };
};

module.exports = validateEmail;
