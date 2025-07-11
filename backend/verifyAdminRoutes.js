const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const adminCredentials = {
  username: 'admin@test.com',
  password: 'password123',
};

let authToken = '';

const loginAdmin = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, adminCredentials);
    authToken = response.data.token;
    console.log('Admin logged in successfully.');
  } catch (error) {
    console.error('Error logging in admin:', error.response ? error.response.data : error.message);
  }
};

const testAdminRoutes = async () => {
  if (!authToken) {
    console.log('Authentication token not found. Skipping tests.');
    return;
  }

  const headers = { Authorization: `Bearer ${authToken}` };

  try {
    console.log('--- Testing Admin Routes ---');

    // Test GET /api/admin/stats
    await axios.get(`${API_URL}/admin/stats`, { headers });
    console.log('GET /api/admin/stats - PASSED');

    // Test GET /api/admin/users
    await axios.get(`${API_URL}/admin/users`, { headers });
    console.log('GET /api/admin/users - PASSED');

    // Test GET /api/admin/reports
    await axios.get(`${API_URL}/admin/reports`, { headers });
    console.log('GET /api/admin/reports - PASSED');

    console.log('--- All Admin Routes Tested Successfully ---');
  } catch (error) {
    console.error('Error testing admin routes:', error.response ? error.response.data : error.message);
  }
};

const runTests = async () => {
  await loginAdmin();
  await testAdminRoutes();
};

runTests();
