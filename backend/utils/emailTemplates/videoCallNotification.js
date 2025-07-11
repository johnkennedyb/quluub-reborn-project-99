const footer = require('./footer');

const videoCallNotificationEmail = (waliName, wardName, brotherName, callUrl) => {
  const subject = 'Video Call Notification - Quluub';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://res.cloudinary.com/dn82ie7wt/image/upload/v1752017813/WhatsApp_Image_2025-07-08_at_17.57.16_40b9a289_v3d7iy.jpg" alt="Quluub Welcome" style="max-width: 100%; height: auto;" />
          <h1 style="color: #075e54; margin-top: 10px;">Video Call Notification</h1>
        </div>
        <p style="color: #333; font-size: 16px;">Assalamu Alaikum ${waliName},</p>
        <p style="color: #666; line-height: 1.6;">
          This is to inform you that your ward, <strong>${wardName}</strong>, is about to have a video call with <strong>${brotherName}</strong> on our platform.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${callUrl}" style="background-color: #25d366; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Join Call</a>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          If the button doesn't work, copy and paste this link in your browser:<br>
          <a href="${callUrl}" style="color: #075e54; word-break: break-all;">${callUrl}</a>
        </p>
        ${footer}
      </div>
    </div>
  `;
  return { subject, html };
};

module.exports = videoCallNotificationEmail;
