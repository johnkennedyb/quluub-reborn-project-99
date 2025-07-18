const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Starting SMTP test...');
console.log('Environment variables:');
console.log(`- SMTP_HOST: ${process.env.SMTP_HOST || 'not set'}`);
console.log(`- SMTP_PORT: ${process.env.SMTP_PORT || 'not set'}`);
console.log(`- MAIL_USER: ${process.env.MAIL_USER ? 'set' : 'not set'}`);
console.log(`- MAIL_PASSWORD: ${process.env.MAIL_PASSWORD ? 'set' : 'not set'}`);

async function testSMTP() {
  try {
    console.log('\nCreating transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.quluub.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER || 'admin@quluub.com',
        pass: process.env.MAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true // Log to console
    });

    console.log('\nSending test email...');
    const testEmail = 'johnkennedynnawuihe61@gmail.com';
    console.log(`From: ${process.env.MAIL_USER || 'admin@quluub.com'}`);
    console.log(`To: ${testEmail}`);

    const info = await transporter.sendMail({
      from: `"Quluub Test" <${process.env.MAIL_USER || 'admin@quluub.com'}>`,
      to: testEmail,
      subject: 'SMTP Test from Quluub',
      text: 'This is a test email sent from your Quluub backend.',
      html: '<b>This is a test email sent from your Quluub backend.</b>'
    });

    console.log('\nEmail sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('\nError sending email:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    
    if (error.response) {
      console.error('Server response:');
      console.error('- Code:', error.response.code);
      console.error('- Response:', error.response.response);
    }
    
    return false;
  }
}

// Run the test
console.log('\n--- Starting SMTP Test ---');
testSMTP()
  .then(success => {
    console.log('\n--- Test Completed ---');
    console.log(`Status: ${success ? 'SUCCESS' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
