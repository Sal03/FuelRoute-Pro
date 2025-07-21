/**
 * Test Hugging Face Pricing Service
 * Tests the new Hugging Face-powered fuel pricing system
 */

require('dotenv').config();
const huggingFacePricingService = require('./services/huggingFacePricingService');

async function testHuggingFaceService() {
  console.log('🤗 Testing Hugging Face Pricing Service\n');
  
  try {
    // Test 1: Get real-time fuel prices
    console.log('1️⃣ Testing real-time fuel prices...');
    const prices = await huggingFacePricingService.getRealTimeFuelPrices();
    
    if (prices && prices.prices) {
      console.log('✅ Fuel prices retrieved successfully:');
      console.log(`   Source: ${prices.source}`);
      console.log(`   Confidence: ${prices.confidence}%`);
      console.log(`   Market Trend: ${prices.marketTrend}`);
      console.log(`   Hydrogen (liquid): $${prices.prices.hydrogen.liquid}/kg`);
      console.log(`   Hydrogen (gas): $${prices.prices.hydrogen.gas}/kg`);
      console.log(`   Methanol (liquid): $${prices.prices.methanol.liquid}/kg`);
      console.log(`   Ammonia (liquid): $${prices.prices.ammonia.liquid}/kg`);
      console.log(`   Ammonia (gas): $${prices.prices.ammonia.gas}/kg`);
      console.log(`   Next Update: ${prices.nextUpdate}\n`);
    } else {
      console.log('❌ No price data received\n');
    }
    
    // Test 2: Get specific fuel price
    console.log('2️⃣ Testing specific fuel price lookup...');
    const hydrogenPrice = await huggingFacePricingService.getFuelPrice('hydrogen', 'liquid');
    const methanolPrice = await huggingFacePricingService.getFuelPrice('methanol', 'liquid');
    const ammoniaPrice = await huggingFacePricingService.getFuelPrice('ammonia', 'gas');
    
    console.log(`✅ Specific prices:`);
    console.log(`   Hydrogen (liquid): $${hydrogenPrice}/kg`);
    console.log(`   Methanol (liquid): $${methanolPrice}/kg`);
    console.log(`   Ammonia (gas): $${ammoniaPrice}/kg\n`);
    
    // Test 3: Get market analysis
    console.log('3️⃣ Testing market analysis...');
    const routeData = {
      origin: 'Houston, TX',
      destination: 'Los Angeles, CA',
      fuelType: 'hydrogen',
      volume: '25',
      volumeUnit: 'tonnes',
      transportMode1: 'truck'
    };
    
    const analysis = await huggingFacePricingService.getMarketAnalysis(routeData);
    console.log(`✅ Market analysis received:`);
    console.log(`   ${analysis.substring(0, 200)}...\n`);
    
    // Test 4: Get market status
    console.log('4️⃣ Testing market status...');
    const status = huggingFacePricingService.getMarketStatus();
    console.log(`✅ Market status:`);
    console.log(`   Status: ${status.status}`);
    console.log(`   Source: ${status.source}`);
    console.log(`   Confidence: ${status.confidence}%`);
    console.log(`   Trend: ${status.trend}`);
    console.log(`   Last Update: ${status.lastUpdate}\n`);
    
    console.log('🎉 All Hugging Face tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting Hugging Face Service Tests...\n');
testHuggingFaceService().then(() => {
  console.log('\n✅ Testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Testing failed:', error);
  process.exit(1);
});