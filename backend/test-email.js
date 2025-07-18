require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email configuration...');
console.log('SMTP Host:', process.env.SMTP_HOST);
console.log('SMTP Port:', process.env.SMTP_PORT);
console.log('Mail User:', process.env.MAIL_USER);

// Create a test transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.quluub.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER || 'admin@quluub.com',
        pass: process.env.MAIL_PASSWORD || 'Q!mok@JX1?1GProd'
    },
    tls: {
        rejectUnauthorized: false
    },
    debug: true,
    logger: true
});

// Test email configuration
async function testEmail() {
    try {
        // Verify connection configuration
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ Server is ready to take our messages');

        // Send test email
        console.log('\nSending test email...');
        const info = await transporter.sendMail({
            from: `"Quluub Test" <${process.env.MAIL_USER || 'admin@quluub.com'}>`,
            to: 'test@example.com',
            subject: 'Test Email from Quluub',
            text: 'This is a test email from Quluub',
            html: '<b>This is a test email from Quluub</b>'
        });

        console.log('✅ Test email sent successfully');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        
    } catch (error) {
        console.error('❌ Error sending test email:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.response) {
            console.error('SMTP Error Code:', error.responseCode);
            console.error('SMTP Response:', error.response);
        }
        
        if (error.command) {
            console.error('Failed command:', error.command);
        }
        
        console.error('Full error object:', error);
    }
}

// Run the test
testEmail();
