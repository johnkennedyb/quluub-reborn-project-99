const welcomeEmail = (recipientName) => {
  const subject = 'Welcome to Quluub - Your Journey Begins!';
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
          Welcome to Quluub! We are delighted to have you join our community.
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          Your subscription opens the door to a platform dedicated to helping you find a compatible partner while upholding our shared values. Start exploring profiles, connect with like-minded individuals, and take the next step towards a fulfilling marriage.
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          If you have any questions or need assistance, our support team is here to help.
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
          May Allaah bless you on this journey.
        </p>
        <p style="color: #333; line-height: 1.6; font-size: 16px; margin-top: 30px;">
          JazaakumuLlahu khairan,<br>
          The Quluub Team
        </p>
      </div>
    </div>
  `;

  return { subject, html };
};

module.exports = welcomeEmail;
