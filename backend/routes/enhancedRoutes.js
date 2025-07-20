// Enhanced Routes with Real-time Distance and Fuel Pricing
const express = require('express');
const router = express.Router();
const transportationAPI = require('../services/freeTransportationAPI');
const SimpleFuelPriceService = require('../services/simpleFuelPriceService');
const EnhancedFuelPriceService = require('../services/enhancedFuelPriceService');

// Initialize fuel price services
const fuelPriceService = new SimpleFuelPriceService();
const enhancedFuelPriceService = new EnhancedFuelPriceService();

// Test endpoint for all transportation modes with real-time pricing
router.post('/calculate-comprehensive', async (req, res) => {
  try {
    console.log('🚚 Comprehensive calculation request:', req.body);
    
    const { 
      fuelType = 'diesel', 
      volume = 1000, 
      origin = 'Houston, TX', 
      destination = 'New York/NJ' 
    } = req.body;

    // Define origin and destination coordinates
    const originCoords = { coords: [29.7604, -95.3698] }; // Houston
    const destinationCoords = { coords: [40.6892, -74.0445] }; // New York

    // Get current fuel prices
    const currentFuelPrices = await fuelPriceService.getCurrentFuelPrices();
    const alternativeFuelPrices = await fuelPriceService.getAlternativeFuelPrices();

    // Calculate all transportation modes
    const results = {
      requestInfo: {
        fuelType,
        volume,
        origin,
        destination,
        timestamp: new Date()
      },
      fuelPrices: {
        current: currentFuelPrices,
        alternative: alternativeFuelPrices
      },
      transportation: {}
    };

    // TRUCK ROUTING
    try {
      const truckResult = await transportationAPI.getTruckRouting(
        originCoords, 
        destinationCoords, 
        fuelType, 
        volume
      );
      results.transportation.truck = truckResult;
    } catch (error) {
      results.transportation.truck = { error: error.message };
    }

    // SHIP ROUTING (using searoute)
    try {
      const shipResult = await transportationAPI.getShipRouting(
        originCoords, 
        destinationCoords, 
        fuelType, 
        volume
      );
      results.transportation.ship = shipResult;
    } catch (error) {
      results.transportation.ship = { error: error.message };
    }

    // RAIL ROUTING
    try {
      const railResult = await transportationAPI.getEnhancedRailRouting(
        originCoords, 
        destinationCoords, 
        fuelType, 
        volume
      );
      results.transportation.rail = railResult;
    } catch (error) {
      results.transportation.rail = { error: error.message };
    }

    // PIPELINE ROUTING
    try {
      const pipelineResult = await transportationAPI.getEnhancedPipelineRouting(
        originCoords, 
        destinationCoords, 
        fuelType, 
        volume
      );
      results.transportation.pipeline = pipelineResult;
    } catch (error) {
      results.transportation.pipeline = { error: error.message };
    }

    // Calculate best option
    const validModes = Object.keys(results.transportation).filter(
      mode => results.transportation[mode].success && results.transportation[mode].totalCost
    );

    if (validModes.length > 0) {
      const bestMode = validModes.reduce((best, current) => {
        const currentCost = results.transportation[current].totalCost?.totalCost || 
                           results.transportation[current].totalCost || 
                           Infinity;
        const bestCost = results.transportation[best].totalCost?.totalCost || 
                        results.transportation[best].totalCost || 
                        Infinity;
        return currentCost < bestCost ? current : best;
      });

      results.recommendation = {
        bestMode,
        reason: 'Lowest total cost',
        savings: validModes.map(mode => ({
          mode,
          cost: results.transportation[mode].totalCost?.totalCost || 
                results.transportation[mode].totalCost || 0
        }))
      };
    }

    res.json(results);
  } catch (error) {
    console.error('❌ Comprehensive calculation error:', error);
    res.status(500).json({ 
      error: 'Calculation failed', 
      details: error.message 
    });
  }
});

// Test endpoint for real-time fuel prices
router.get('/fuel-prices', async (req, res) => {
  try {
    const currentPrices = await fuelPriceService.getCurrentFuelPrices();
    const alternativePrices = await fuelPriceService.getAlternativeFuelPrices();
    
    res.json({
      timestamp: new Date(),
      conventional: currentPrices,
      alternative: alternativePrices,
      notes: {
        source: currentPrices.source,
        updateFrequency: '1 hour cache',
        currency: 'USD'
      }
    });
  } catch (error) {
    console.error('❌ Fuel price fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch fuel prices', 
      details: error.message 
    });
  }
});

// Enhanced fuel prices endpoint with better units and dynamic pricing
router.get('/enhanced-fuel-prices', async (req, res) => {
  try {
    const enhancedPrices = await enhancedFuelPriceService.getFuelPrices();
    
    res.json({
      success: true,
      data: enhancedPrices,
      notes: {
        updateFrequency: '30 minutes cache',
        currency: 'USD',
        features: [
          'Dynamic pricing based on market conditions',
          'Proper unit conversions ($/kg for alternative fuels)',
          'Seasonal and daily variations included',
          'Trend analysis included'
        ]
      }
    });
  } catch (error) {
    console.error('❌ Enhanced fuel price fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch enhanced fuel prices', 
      details: error.message 
    });
  }
});

// Get specific fuel price
router.get('/fuel-price/:fuelType', async (req, res) => {
  try {
    const { fuelType } = req.params;
    const fuelPrice = await enhancedFuelPriceService.getFuelPrice(fuelType);
    
    res.json({
      success: true,
      fuelType,
      price: fuelPrice,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`❌ Fuel price fetch error for ${req.params.fuelType}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch fuel price', 
      details: error.message 
    });
  }
});

// Test endpoint for individual transportation modes
router.post('/calculate/:mode', async (req, res) => {
  try {
    const { mode } = req.params;
    const { 
      fuelType = 'diesel', 
      volume = 1000, 
      origin = 'Houston, TX', 
      destination = 'New York/NJ' 
    } = req.body;

    const originCoords = { coords: [29.7604, -95.3698] };
    const destinationCoords = { coords: [40.6892, -74.0445] };

    let result;
    switch (mode) {
      case 'truck':
        result = await transportationAPI.getTruckRouting(
          originCoords, destinationCoords, fuelType, volume
        );
        break;
      case 'ship':
        result = await transportationAPI.getShipRouting(
          originCoords, destinationCoords, fuelType, volume
        );
        break;
      case 'rail':
        result = await transportationAPI.getEnhancedRailRouting(
          originCoords, destinationCoords, fuelType, volume
        );
        break;
      case 'pipeline':
        result = await transportationAPI.getEnhancedPipelineRouting(
          originCoords, destinationCoords, fuelType, volume
        );
        break;
      default:
        return res.status(400).json({ 
          error: 'Invalid transportation mode', 
          availableModes: ['truck', 'ship', 'rail', 'pipeline'] 
        });
    }

    res.json({
      mode,
      requestInfo: { fuelType, volume, origin, destination },
      result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`❌ ${mode} calculation error:`, error);
    res.status(500).json({ 
      error: `${mode} calculation failed`, 
      details: error.message 
    });
  }
});

// Test endpoint for maritime routing specifically
router.post('/maritime-test', async (req, res) => {
  try {
    const { 
      originLat = 29.7604, 
      originLon = -95.3698,
      destLat = 40.6892, 
      destLon = -74.0445,
      fuelType = 'diesel',
      volume = 1000
    } = req.body;

    const origin = { coords: [originLat, originLon] };
    const destination = { coords: [destLat, destLon] };

    console.log('🚢 Testing maritime routing with searoute...');
    const result = await transportationAPI.getShipRouting(origin, destination, fuelType, volume);

    res.json({
      test: 'maritime-routing',
      input: { origin, destination, fuelType, volume },
      result,
      notes: {
        searouteInstalled: !!require('searoute'),
        apiUsed: result.source
      }
    });
  } catch (error) {
    console.error('❌ Maritime test error:', error);
    res.status(500).json({ 
      error: 'Maritime test failed', 
      details: error.message 
    });
  }
});

module.exports = router;