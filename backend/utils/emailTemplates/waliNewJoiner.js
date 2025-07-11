const footer = require('./footer');

const waliNewJoinerEmail = (waliName, sisterName) => {
  const subject = 'Notification: Your Ward Has Joined Quluub';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://res.cloudinary.com/dn82ie7wt/image/upload/v1752017813/WhatsApp_Image_2025-07-08_at_17.57.16_40b9a289_v3d7iy.jpg" alt="Quluub Welcome" style="max-width: 100%; height: auto;" />
        </div>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Salaamun alaekum ${waliName},
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          We hope this message finds you in the best of health and iman. We are writing to inform you that your ward, ${sisterName}, has recently joined Quluub, our comprehensive platform designed to assist with marriage and family-related services.
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          As a valued guardian, we understand the importance of your role in her journey. Rest assured that Quluub is committed to providing a secure and supportive environment that upholds Islamic values.
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          If you have any questions or need further information, please do not hesitate to contact us. We are here to support you and your ward throughout this process.
        </p>
        ${footer}
      </div>
    </div>
  `;

  return { subject, html };
};

module.exports = waliNewJoinerEmail;
