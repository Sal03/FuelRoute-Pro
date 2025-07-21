// backend/test-all-apis.js - Test All Integrations
require('dotenv').config();
const axios = require('axios');

async function testAllAPIs() {
  console.log('🧪 Testing All API Integrations...\n');

  // Test 1: Google Maps API
  console.log('1️⃣ Testing Google Maps API...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: '34.0522,-118.2437', // Los Angeles
        destination: '47.4502,-122.3088', // Seattle-Tacoma Airport
        mode: 'driving',
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });

    if (response.data.status === 'OK') {
      const distance = Math.round(response.data.routes[0].legs[0].distance.value * 0.000621371);
      console.log(`✅ Google Maps API: ${distance} miles\n`);
    } else {
      console.log(`❌ Google Maps API Error: ${response.data.status}\n`);
    }
  } catch (error) {
    console.log(`❌ Google Maps API Failed: ${error.message}\n`);
  }

  // Test 2: Hugging Face API (if available)
  console.log('2️⃣ Testing Hugging Face API...');
  if (process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== 'hf_your_token_here') {
    try {
      const huggingFacePricingService = require('./services/huggingFacePricingService');
      const prices = await huggingFacePricingService.getRealTimeFuelPrices();
      
      if (prices && prices.prices) {
        console.log(`✅ Hugging Face API: Fuel prices retrieved successfully`);
        console.log(`   Hydrogen: $${prices.prices.hydrogen.liquid}/kg`);
        console.log(`   Methanol: $${prices.prices.methanol.liquid}/kg`);
        console.log(`   Ammonia: $${prices.prices.ammonia.liquid}/kg\n`);
      } else {
        console.log(`⚠️ Hugging Face API: No price data\n`);
      }
    } catch (error) {
      console.log(`❌ Hugging Face API Failed: ${error.message}\n`);
    }
  } else {
    console.log(`⚠️ Hugging Face API: No API key configured\n`);
  }



  // Test 3: MongoDB Connection
  console.log('3️⃣ Testing MongoDB Connection...');
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fuelroute');
    console.log(`✅ MongoDB: Connected successfully\n`);
    await mongoose.disconnect();
  } catch (error) {
    console.log(`❌ MongoDB Failed: ${error.message}\n`);
  }

  // Test 5: Backend Server Health
  console.log('5️⃣ Testing Backend Server...');
  try {
    const response = await axios.get('http://localhost:5001/api/health', { timeout: 5000 });
    if (response.data && response.data.status === 'healthy') {
      console.log(`✅ Backend Server: Healthy\n`);
    } else {
      console.log(`⚠️ Backend Server: Unexpected response\n`);
    }
  } catch (error) {
    console.log(`❌ Backend Server: ${error.message}\n`);
  }

  console.log('🎯 API Testing Complete!');
  console.log('\n📋 Summary:');
  console.log('- Google Maps API: Required for accurate routing');
  console.log('- Hugging Face API: Optional for AI-powered fuel pricing');
  console.log('- MongoDB: Required for data storage');
  console.log('- Backend Server: Required for frontend connection');
  
  console.log('\n🔧 Setup Instructions:');
  if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'hf_your_token_here') {
    console.log('1. Get Hugging Face API key: https://huggingface.co/settings/tokens');
  }
  console.log('2. Start MongoDB: brew services start mongodb/brew/mongodb-community');
  console.log('3. Start backend: cd backend && npm run dev');
  console.log('4. Start frontend: cd frontend && npm start');
}

// Run the test
testAllAPIs().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Testing failed:', error);
  process.exit(1);
});