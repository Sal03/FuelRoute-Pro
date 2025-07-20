/**
 * Google Maps API Proxy Routes
 * Handles Google Maps API calls to avoid CORS issues
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_MAPS_API_KEY = 'AIzaSyDEO_rKNxyCnLgkTCO34byVqYHFNr59jsU';

/**
 * Proxy for Google Maps Directions API
 */
router.get('/directions', async (req, res) => {
  try {
    console.log('Google Maps Directions API request:', req.query);
    
    // Forward the request to Google Maps API
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        ...req.query,
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });

    console.log('Google Maps API response status:', response.data.status);
    
    // Return the response to the frontend
    res.json(response.data);
    
  } catch (error) {
    console.error('Google Maps API error:', error.message);
    
    if (error.response) {
      // Google Maps API returned an error
      res.status(error.response.status).json({
        error: 'Google Maps API error',
        message: error.response.data?.error_message || error.message,
        status: error.response.data?.status || 'UNKNOWN_ERROR'
      });
    } else {
      // Network or other error
      res.status(500).json({
        error: 'Failed to connect to Google Maps API',
        message: error.message,
        status: 'REQUEST_FAILED'
      });
    }
  }
});

/**
 * Proxy for Google Maps Geocoding API (if needed)
 */
router.get('/geocode', async (req, res) => {
  try {
    console.log('Google Maps Geocoding API request:', req.query);
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        ...req.query,
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });

    console.log('Google Maps Geocoding API response status:', response.data.status);
    res.json(response.data);
    
  } catch (error) {
    console.error('Google Maps Geocoding API error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Google Maps Geocoding API error',
        message: error.response.data?.error_message || error.message,
        status: error.response.data?.status || 'UNKNOWN_ERROR'
      });
    } else {
      res.status(500).json({
        error: 'Failed to connect to Google Maps Geocoding API',
        message: error.message,
        status: 'REQUEST_FAILED'
      });
    }
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Google Maps API Proxy',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!GOOGLE_MAPS_API_KEY
  });
});

module.exports = router;