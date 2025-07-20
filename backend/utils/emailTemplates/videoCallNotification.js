const footer = require('./footer');

const videoCallNotificationEmail = (waliName, wardName, brotherName, callDetails, reportLink) => {
  const callTime = new Date(callDetails.timestamp).toLocaleString();
  const subject = 'Video Call Activity Report - Quluub';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://res.cloudinary.com/dn82ie7wt/image/upload/v1752017813/WhatsApp_Image_2025-07-08_at_17.57.16_40b9a289_v3d7iy.jpg" alt="Quluub Welcome" style="max-width: 100%; height: auto;" />
          <h1 style="color: #075e54; margin-top: 10px;">📹 Video Call Recording & Report</h1>
        </div>
        <p style="color: #333; font-size: 16px;">Assalamu Alaikum ${waliName},</p>
        <p style="color: #666; line-height: 1.6;">
          This is to inform you that your ward, <strong>${wardName}</strong>, has had a video call with <strong>${brotherName}</strong> on our platform. The call has been recorded for your review and oversight.
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #075e54;">
          <h3 style="color: #075e54; margin-top: 0;">📋 Call Details:</h3>
          <p style="margin: 5px 0; color: #333;"><strong>Caller:</strong> ${callDetails.callerName}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Recipient:</strong> ${callDetails.recipientName}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Call Time:</strong> ${callTime}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Call ID:</strong> ${callDetails.callId}</p>
          ${callDetails.recordingUrl ? `<p style="margin: 5px 0; color: #333;"><strong>📹 Recording:</strong> <a href="${callDetails.recordingUrl}" style="color: #075e54;">View Recording</a></p>` : '<p style="margin: 5px 0; color: #666;"><em>Recording will be available shortly</em></p>'}
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          As part of our Islamic compliance and Wali oversight system, all video calls are automatically recorded and sent to guardians to ensure proper supervision and maintain Islamic values. You can review the recording using the link above.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reportLink}" style="background-color: #075e54; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">📊 View Full Report</a>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #2d5a2d; margin: 0; font-size: 14px;">
            <strong>🛡️ Islamic Compliance:</strong> All interactions on Quluub are monitored to ensure they align with Islamic values and provide proper supervision for our community members.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          If you have any concerns or questions about this video call activity, please contact our support team immediately.
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          If the button doesn't work, copy and paste this link in your browser:<br>
          <a href="${reportLink}" style="color: #075e54; word-break: break-all;">${reportLink}</a>
        </p>
        ${footer}
      </div>
    </div>
  `;
  return { subject, html };
};

module.exports = videoCallNotificationEmail;
