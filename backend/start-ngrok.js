const ngrok = require('ngrok');
require('dotenv').config();

(async function() {
  try {
    // Make sure to set NGROK_AUTHTOKEN in your .env file
    if (!process.env.NGROK_AUTHTOKEN) {
      console.error('Error: NGROK_AUTHTOKEN is not set in your .env file.');
      console.log('Please get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken and add it to your .env file.');
      process.exit(1);
    }

    const url = await ngrok.connect({
      proto: 'http',
      addr: process.env.PORT || 5000,
      authtoken: process.env.NGROK_AUTHTOKEN,
    });
    console.log('ngrok tunnel is running at:', url);
  } catch (error) {
    console.error('Error starting ngrok:', error);
    process.exit(1);
  }
})();
