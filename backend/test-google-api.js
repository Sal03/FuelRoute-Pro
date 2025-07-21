// backend/test-google-api.js - Test Google Maps API
const axios = require('axios');

async function testGoogleMapsAPI() {
  const API_KEY = 'AIzaSyDEO_rKNxyCnLgkTCO34byVqYHFNr59jsU';
  
  // Test coordinates: Los Angeles to Seattle
  const origin = '34.0522,-118.2437'; // Los Angeles
  const destination = '47.6062,-122.3321'; // Seattle
  
  const url = 'https://maps.googleapis.com/maps/api/directions/json';
  
  try {
    console.log('🧪 Testing Google Maps API...');
    console.log(`📍 Route: Los Angeles → Seattle`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
    
    const response = await axios.get(url, {
      params: {
        origin: origin,
        destination: destination,
        mode: 'driving',
        key: API_KEY
      },
      timeout: 10000
    });
    
    console.log(`📊 Response Status: ${response.data.status}`);
    
    if (response.data.status === 'OK') {
      const route = response.data.routes[0];
      const distanceInMeters = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
      const distanceInMiles = Math.round(distanceInMeters * 0.000621371);
      const durationText = route.legs[0].duration.text;
      
      console.log('✅ Google Maps API is working!');
      console.log(`📏 Distance: ${distanceInMiles} miles`);
      console.log(`⏱️  Duration: ${durationText}`);
      console.log(`🛣️  Route: ${route.summary}`);
      
      return true;
    } else {
      console.error('❌ Google Maps API Error:');
      console.error(`Status: ${response.data.status}`);
      console.error(`Error: ${response.data.error_message || 'Unknown error'}`);
      
      if (response.data.status === 'REQUEST_DENIED') {
        console.error('🔑 API Key issue - check if:');
        console.error('   1. API key is valid');
        console.error('   2. Directions API is enabled');
        console.error('   3. Billing is set up');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Network/Request Error:', error.message);
    return false;
  }
}

// Run the test
testGoogleMapsAPI().then(success => {
  if (success) {
    console.log('\n🎉 Google Maps API test passed!');
  } else {
    console.log('\n💥 Google Maps API test failed!');
  }
  process.exit(success ? 0 : 1);
});