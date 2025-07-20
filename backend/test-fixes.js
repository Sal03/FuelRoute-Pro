// Test script for comprehensive fixes
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testFixes() {
  console.log('🧪 Testing comprehensive fixes...\n');
  
  // Test 1: Enhanced Fuel Prices
  console.log('1. Testing Enhanced Fuel Prices:');
  try {
    const response = await axios.get(`${BASE_URL}/api/enhanced/enhanced-fuel-prices`);
    console.log('   ✅ Enhanced fuel prices endpoint working');
    console.log('   📊 Methanol price:', response.data.data.alternative.methanol);
    console.log('   📊 Hydrogen price:', response.data.data.alternative.hydrogen);
    console.log('   📊 Ammonia price:', response.data.data.alternative.ammonia);
  } catch (error) {
    console.log('   ❌ Enhanced fuel prices failed:', error.message);
  }

  // Test 2: Specific Fuel Price
  console.log('\n2. Testing Specific Fuel Price (Methanol):');
  try {
    const response = await axios.get(`${BASE_URL}/api/enhanced/fuel-price/methanol`);
    console.log('   ✅ Specific methanol price endpoint working');
    console.log('   📊 Methanol price data:', response.data.price);
  } catch (error) {
    console.log('   ❌ Specific methanol price failed:', error.message);
  }

  // Test 3: Route Calculation with Fixed Cities
  console.log('\n3. Testing Route Calculation with Fixed Cities:');
  try {
    const requestData = {
      fuelType: 'methanol',
      volume: 8,
      volumeUnit: 'tonnes',
      origin: 'Los Angeles, CA',
      intermediateHub: 'Port of Long Beach, CA',
      destination: 'Portland, OR',
      transportMode1: 'truck',
      transportMode2: 'rail'
    };
    
    const response = await axios.post(`${BASE_URL}/api/calculate-cost`, requestData);
    console.log('   ✅ Route calculation working');
    console.log('   📊 Total distance:', response.data.data.distance, 'miles');
    console.log('   📊 All-in cost:', response.data.data.allInCost);
    console.log('   📊 Commodity cost:', response.data.data.commodityCost);
    console.log('   📊 Transportation cost:', response.data.data.transportationCost);
    
    if (response.data.data.legs) {
      console.log('   📊 Leg 1 distance:', response.data.data.legs.leg1.distance, 'miles');
      console.log('   📊 Leg 1 cost:', response.data.data.legs.leg1.cost);
      console.log('   📊 Leg 2 distance:', response.data.data.legs.leg2.distance, 'miles');
      console.log('   📊 Leg 2 cost:', response.data.data.legs.leg2.cost);
    }
  } catch (error) {
    console.log('   ❌ Route calculation failed:', error.message);
  }

  // Test 4: Different Route (Single Leg)
  console.log('\n4. Testing Single Leg Route:');
  try {
    const requestData = {
      fuelType: 'methanol',
      volume: 8,
      volumeUnit: 'tonnes',
      origin: 'Houston, TX',
      destination: 'New York/NJ',
      transportMode1: 'truck'
    };
    
    const response = await axios.post(`${BASE_URL}/api/calculate-cost`, requestData);
    console.log('   ✅ Single leg route calculation working');
    console.log('   📊 Total distance:', response.data.data.distance, 'miles');
    console.log('   📊 All-in cost:', response.data.data.allInCost);
    console.log('   📊 Transportation cost:', response.data.data.transportationCost);
  } catch (error) {
    console.log('   ❌ Single leg route failed:', error.message);
  }

  // Test 5: Distance Calculation Test
  console.log('\n5. Testing Distance Calculation Logic:');
  try {
    const requestData = {
      fuelType: 'hydrogen',
      volume: 5,
      volumeUnit: 'tonnes',
      origin: 'Los Angeles, CA',
      destination: 'Seattle, WA',
      transportMode1: 'truck'
    };
    
    const response = await axios.post(`${BASE_URL}/api/calculate-cost`, requestData);
    console.log('   ✅ LA to Seattle distance calculation working');
    console.log('   📊 Distance:', response.data.data.distance, 'miles');
    console.log('   📊 Should be around 1,150 miles (actual air distance ~960 miles + 20% routing factor)');
  } catch (error) {
    console.log('   ❌ Distance calculation test failed:', error.message);
  }

  // Test 6: Enhanced Transportation Test
  console.log('\n6. Testing Enhanced Transportation API:');
  try {
    const requestData = {
      fuelType: 'methanol',
      volume: 1000,
      origin: 'Houston, TX',
      destination: 'New York/NJ'
    };
    
    const response = await axios.post(`${BASE_URL}/api/enhanced/calculate-comprehensive`, requestData);
    console.log('   ✅ Enhanced transportation test working');
    console.log('   📊 Available modes:', Object.keys(response.data.transportation));
    
    if (response.data.recommendation) {
      console.log('   📊 Recommended mode:', response.data.recommendation.bestMode);
    }
  } catch (error) {
    console.log('   ❌ Enhanced transportation test failed:', error.message);
  }

  console.log('\n🎉 Testing complete!\n');
}

// Run the tests
testFixes().catch(console.error);