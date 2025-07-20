// Test script for Enhanced API with Real-time Distance and Fuel Pricing
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api/enhanced';

// Test data
const testData = {
  fuelType: 'diesel',
  volume: 1000,
  origin: 'Houston, TX',
  destination: 'New York/NJ'
};

async function testEnhancedAPI() {
  console.log('🧪 Testing Enhanced FuelRoute Pro API');
  console.log('=====================================');

  // Test 1: Get current fuel prices
  console.log('\n📊 Test 1: Current Fuel Prices');
  try {
    const response = await axios.get(`${API_BASE}/fuel-prices`);
    console.log('✅ Fuel prices retrieved successfully:');
    console.log('   💰 Conventional fuels:', response.data.conventional);
    console.log('   ⚡ Alternative fuels:', response.data.alternative);
    console.log('   📅 Last updated:', response.data.timestamp);
  } catch (error) {
    console.error('❌ Fuel price test failed:', error.response?.data || error.message);
  }

  // Test 2: Comprehensive calculation (all modes)
  console.log('\n🚚 Test 2: Comprehensive Transportation Calculation');
  try {
    const response = await axios.post(`${API_BASE}/calculate-comprehensive`, testData);
    console.log('✅ Comprehensive calculation successful:');
    
    Object.keys(response.data.transportation).forEach(mode => {
      const result = response.data.transportation[mode];
      if (result.success) {
        console.log(`   📦 ${mode.toUpperCase()}:`);
        console.log(`      Distance: ${result.distance} miles`);
        console.log(`      Fuel Cost: $${result.fuelCost?.toFixed(2) || 'N/A'}`);
        console.log(`      Total Cost: $${result.totalCost?.totalCost?.toFixed(2) || 'N/A'}`);
        console.log(`      Data Source: ${result.source}`);
      } else {
        console.log(`   ❌ ${mode.toUpperCase()}: ${result.error || 'Failed'}`);
      }
    });

    if (response.data.recommendation) {
      console.log(`\n🏆 Recommendation: ${response.data.recommendation.bestMode.toUpperCase()}`);
    }
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.response?.data || error.message);
  }

  // Test 3: Individual mode tests
  const modes = ['truck', 'ship', 'rail', 'pipeline'];
  for (const mode of modes) {
    console.log(`\n🚛 Test 3.${modes.indexOf(mode) + 1}: ${mode.toUpperCase()} Routing`);
    try {
      const response = await axios.post(`${API_BASE}/calculate/${mode}`, testData);
      const result = response.data.result;
      
      if (result.success) {
        console.log(`   ✅ ${mode} calculation successful:`);
        console.log(`      Distance: ${result.distance} miles`);
        console.log(`      Duration: ${result.duration || result.transitTime || 'N/A'} minutes`);
        console.log(`      Fuel Cost: $${result.fuelCost?.toFixed(2) || 'N/A'}`);
        console.log(`      Fuel Price: $${result.fuelPrice?.toFixed(2) || 'N/A'}/gallon`);
        console.log(`      Fuel Needed: ${result.fuelNeeded?.toFixed(2) || 'N/A'} gallons`);
        console.log(`      Data Source: ${result.source}`);
      } else {
        console.log(`   ❌ ${mode} failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`   ❌ ${mode} test failed:`, error.response?.data || error.message);
    }
  }

  // Test 4: Maritime routing with searoute
  console.log('\n🚢 Test 4: Maritime Routing with Searoute');
  try {
    const response = await axios.post(`${API_BASE}/maritime-test`, {
      originLat: 29.7604,
      originLon: -95.3698,
      destLat: 25.7617,
      destLon: -80.1918,
      fuelType: 'diesel',
      volume: 1000
    });
    
    console.log('✅ Maritime test successful:');
    console.log(`   Distance: ${response.data.result.distance} miles`);
    console.log(`   Transit Time: ${response.data.result.transitTime} hours`);
    console.log(`   Searoute Available: ${response.data.notes.searouteInstalled ? '✅' : '❌'}`);
    console.log(`   API Used: ${response.data.notes.apiUsed}`);
  } catch (error) {
    console.error('❌ Maritime test failed:', error.response?.data || error.message);
  }

  console.log('\n🎉 API Testing Complete!');
  console.log('=====================================');
}

// Run the tests
if (require.main === module) {
  testEnhancedAPI().catch(console.error);
}

module.exports = testEnhancedAPI;