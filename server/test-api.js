import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  const tests = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'API Status',
      url: `${BASE_URL}/api/status`,
      method: 'GET'
    },
    {
      name: 'Get Markets',
      url: `${BASE_URL}/api/markets`,
      method: 'GET'
    },
    {
      name: 'Get Movements',
      url: `${BASE_URL}/api/markets/movements`,
      method: 'GET'
    },
    {
      name: 'Get Categories',
      url: `${BASE_URL}/api/markets/categories`,
      method: 'GET'
    },
    {
      name: 'Get API Stats',
      url: `${BASE_URL}/api/markets/stats`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000
      });
      
      console.log(`✅ ${test.name}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'ERROR'} - ${error.message}`);
    }
    console.log('');
  }
}

testAPI().catch(console.error);
