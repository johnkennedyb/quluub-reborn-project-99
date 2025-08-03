/**
 * Email Header Component
 * A simple, clean header for Quluub emails.
 */

const createEmailHeader = (subject = 'Quluub Notification') => {
  return `
    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
      <h1 style="color: #333; font-family: Arial, sans-serif; font-size: 24px; margin: 0;">
        Quluub
      </h1>
       <p style="color: #555; font-size: 16px; margin-top: 10px;">${subject}</p>
    </div>
  `;
};

module.exports = createEmailHeader;
