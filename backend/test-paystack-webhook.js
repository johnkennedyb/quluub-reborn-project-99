const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const testUserId = '68037547f134db4f0d0c7ee8';
const testUserEmail = 'test.user@example.com';

const payload = {
  event: 'charge.success',
  data: {
    id: 123456789,
    domain: 'test',
    status: 'success',
    reference: `test-ref-${Date.now()}`,
    amount: 500000,
    message: null,
    gateway_response: 'Successful',
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    channel: 'card',
    currency: 'NGN',
    ip_address: '127.0.0.1',
    metadata: {
      user_id: testUserId,
      plan: 'premium',
    },
    log: {},
    fees: 500,
    customer: {
      id: 98765,
      first_name: 'Test',
      last_name: 'User',
      email: testUserEmail,
      customer_code: 'CUS_xxxxxxxxxxxxxxx',
      phone: '',
      metadata: {},
    },
    authorization: {
      authorization_code: 'AUTH_xxxxxxxx',
    },
    plan: {},
  },
};

const secret = process.env.PAYSTACK_SECRET_API_KEY;

if (!secret || secret.includes('YOUR_PAYSTACK_SECRET_KEY')) {
  console.error('Error: PAYSTACK_SECRET_API_KEY is not set correctly in your .env file.');
  process.exit(1);
}

const hash = crypto
  .createHmac('sha512', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

const webhookUrl = 'http://localhost:5000/api/payments/paystack-webhook';

console.log('Simulating Paystack webhook call to:', webhookUrl);

axios.post(webhookUrl, payload, {
  headers: {
    'x-paystack-signature': hash,
    'Content-Type': 'application/json',
  },
})
.then(response => {
  console.log('\n--- Webhook Simulation Successful ---');
  console.log('Status:', response.status);
  console.log('Response Data:', response.data);
  console.log('\nCheck the backend server logs for detailed processing information.');
})
.catch(error => {
  console.error('\n--- Webhook Simulation Failed ---');
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Response Data:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
  console.log('\nEnsure the backend server is running.');
});
