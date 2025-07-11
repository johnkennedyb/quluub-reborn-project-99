const footer = require('./footer');

const planExpiredEmail = (recipientName) => {
  const subject = 'Action Required: Your Quluub Premium Plan Has Expired';
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
          We hope this message finds you well. We wanted to inform you that your Quluub Premium Plan has expired. To continue enjoying our premium features, including sending up to 5 connection requests per month and an ad-free experience, please consider renewing your plan.
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Renew your plan now to stay connected effortlessly!
        </p>
        ${footer}
      </div>
    </div>
  `;

  return { subject, html };
};

module.exports = planExpiredEmail;
