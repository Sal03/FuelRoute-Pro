// Test script to verify routing fixes
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test cases based on the screenshot issue
const testCases = [
  {
    name: 'Miami to Boston Direct (Single-leg)',
    data: {
      fuelType: 'hydrogen',
      fuelState: 'gas',
      volume: 8,
      volumeUnit: 'tonnes',
      origin: 'Miami, FL',
      destination: 'Boston, MA',
      transportMode1: 'truck',
      optimizationMode: 'manual'
    }
  },
  {
    name: 'Miami to Boston via Inefficient Hub (Should be rejected)',
    data: {
      fuelType: 'hydrogen',
      fuelState: 'gas',
      volume: 8,
      volumeUnit: 'tonnes',
      origin: 'Miami, FL',
      intermediateHub: 'Port of Long Beach, CA',
      destination: 'Boston, MA',
      transportMode1: 'ship',
      transportMode2: 'truck',
      optimizationMode: 'manual'
    }
  },
  {
    name: 'Test Hub Suggestion for Miami to Boston',
    data: {
      origin: 'Miami, FL',
      destination: 'Boston, MA',
      transportMode1: 'truck',
      transportMode2: 'truck'
    }
  }
];

async function runTests() {
  console.log('🧪 Testing routing fixes...\n');
  
  for (const testCase of testCases) {
    console.log(`📊 Testing: ${testCase.name}`);
    
    try {
      let response;
      
      if (testCase.name.includes('Hub Suggestion')) {
        // Test hub suggestion endpoint
        response = await axios.post(`${BASE_URL}/suggest-hub`, testCase.data);
        console.log(`✅ Hub suggestion result:`);
        console.log(`   - Optimal Hub: ${response.data.optimalHub}`);
        console.log(`   - Direct Distance: ${response.data.routeAnalysis.directDistance} miles`);
        console.log(`   - Via Hub Distance: ${response.data.routeAnalysis.viaHubDistance} miles`);
        console.log(`   - Efficiency Impact: ${response.data.routeAnalysis.efficiencyImpact}`);
        console.log(`   - Recommendation: ${response.data.recommendation}`);
      } else {
        // Test cost calculation endpoint
        response = await axios.post(`${BASE_URL}/calculate-cost`, testCase.data);
        
        if (response.data.success) {
          console.log(`✅ Calculation successful:`);
          console.log(`   - Total Cost: $${response.data.data.allInCost.toLocaleString()}`);
          console.log(`   - Commodity Cost: $${response.data.data.commodityCost.toLocaleString()}`);
          console.log(`   - Transport Cost: $${response.data.data.transportationCost.toLocaleString()}`);
          console.log(`   - Distance: ${response.data.data.distance} miles`);
          console.log(`   - Confidence: ${response.data.data.confidence}%`);
          
          if (response.data.data.legs) {
            console.log(`   - Leg 1: ${response.data.data.legs.leg1.distance} miles via ${response.data.data.legs.leg1.mode}`);
            console.log(`   - Leg 2: ${response.data.data.legs.leg2.distance} miles via ${response.data.data.legs.leg2.mode}`);
          }
        } else {
          console.log(`❌ Calculation failed: ${response.data.message}`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Test failed: ${error.response.data.message || error.response.data.error}`);
        if (error.response.data.suggestedHub) {
          console.log(`   💡 Suggested Hub: ${error.response.data.suggestedHub}`);
        }
        if (error.response.data.directDistance) {
          console.log(`   📏 Direct Distance: ${error.response.data.directDistance} miles`);
          console.log(`   📏 Via Hub Distance: ${error.response.data.viaHubDistance} miles`);
        }
      } else {
        console.log(`❌ Network error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
}

// Additional test to verify the specific issue from the screenshot
async function testSpecificIssue() {
  console.log('🔍 Testing specific issue from screenshot...\n');
  
  const screenshotData = {
    fuelType: 'hydrogen',
    fuelState: 'gas',
    volume: 8,
    volumeUnit: 'tonnes',
    origin: 'Miami, FL',
    intermediateHub: 'Port of Long Beach, CA',
    destination: 'Boston, MA',
    transportMode1: 'ship',
    transportMode2: 'ship',
    optimizationMode: 'manual'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/calculate-cost`, screenshotData);
    
    if (response.data.success) {
      const data = response.data.data;
      console.log('🚨 WARNING: System allowed inefficient routing!');
      console.log(`   - Total Distance: ${data.distance} miles`);
      console.log(`   - This should have been rejected as inefficient`);
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ System correctly rejected inefficient routing!');
      console.log(`   - Error: ${error.response.data.message}`);
      if (error.response.data.suggestedHub) {
        console.log(`   - Suggested Hub: ${error.response.data.suggestedHub}`);
      }
    } else {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
  }
}

// Run tests
if (require.main === module) {
  runTests()
    .then(() => testSpecificIssue())
    .then(() => console.log('🏁 All tests completed!'))
    .catch(console.error);
}

module.exports = { runTests, testSpecificIssue };