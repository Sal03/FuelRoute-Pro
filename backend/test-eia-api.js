// Test EIA API Connection
const axios = require('axios');
require('dotenv').config();

async function testEIAAPI() {
  console.log('🧪 Testing EIA API Connection');
  console.log('================================');
  
  const apiKey = process.env.EIA_API_KEY;
  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  
  if (!apiKey) {
    console.error('❌ EIA API key not found in .env file');
    return;
  }

  try {
    console.log('🔄 Testing EIA API (short timeout)...');
    const response = await axios.get('https://api.eia.gov/v2/petroleum/pri/gnd/data/', {
      params: {
        'api_key': apiKey,
        'frequency': 'weekly',
        'data[0]': 'value',
        'facets[product][]': 'EPD2D',
        'sort[0][column]': 'period',
        'sort[0][direction]': 'desc',
        'offset': 0,
        'length': 2
      },
      timeout: 15000
    });

    if (response.data.response && response.data.response.data.length > 0) {
      const latestData = response.data.response.data[0];
      console.log('✅ EIA API working successfully!');
      console.log('📅 Latest data period:', latestData.period);
      console.log('💰 Latest price:', latestData.value);
      console.log('📊 Total records:', response.data.response.data.length);
    } else {
      console.log('⚠️  EIA API responded but no data found');
    }
  } catch (error) {
    console.error('❌ EIA API test failed:');
    if (error.code === 'ECONNABORTED') {
      console.error('   ⏱️  Timeout - EIA API is slow or unavailable');
    } else if (error.response) {
      console.error('   🔴 Status:', error.response.status);
      console.error('   📄 Response:', error.response.data);
    } else {
      console.error('   🔗 Connection error:', error.message);
    }
  }

  // Test a simpler EIA endpoint
  try {
    console.log('\n🔄 Testing simpler EIA endpoint...');
    const response = await axios.get('https://api.eia.gov/v2/petroleum/pri/gnd/data/', {
      params: {
        'api_key': apiKey,
        'frequency': 'weekly',
        'data[0]': 'value',
        'offset': 0,
        'length': 1
      },
      timeout: 10000
    });

    if (response.data.response) {
      console.log('✅ Simple EIA endpoint working!');
      console.log('📊 Response structure:', Object.keys(response.data.response));
    }
  } catch (error) {
    console.error('❌ Simple EIA endpoint also failed:', error.message);
  }

  console.log('\n🎉 EIA API test complete!');
}

if (require.main === module) {
  testEIAAPI().catch(console.error);
}

module.exports = testEIAAPI;