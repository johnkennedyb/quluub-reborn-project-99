const footer = require('./footer');

const waliViewChatEmail = (waliName, wardName, brotherName, chatLink) => {
  const subject = 'Notification: Your Ward is Chatting on Quluub';
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
          We wanted to inform you that your ward, ${wardName}, is currently chatting with ${brotherName} on Quluub. As her guardian, you can view the conversation through the following link:
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px; text-align: center; margin: 30px 0;">
          <a href="${chatLink}" style="background-color: #075e54; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">View Chat</a>
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Thank you for your attention to this matter.
        </p>
        ${footer}
      </div>
    </div>
  `;

  return { subject, html };
};

module.exports = waliViewChatEmail;
