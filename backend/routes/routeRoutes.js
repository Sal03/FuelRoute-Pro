// Enhanced backend/routes/routeRoutes.js with all API integrations

const express = require('express');
const axios = require('axios');
const router = express.Router();
const dynamicPricing = require('../utils/dynamicPricing');
const { calculateCost, getRouteHistory, getMarketData, getTransportRates, suggestOptimalHub } = require('../controllers/routeController');

// POST /api/calculate-cost - Enhanced calculation with commodity pricing
router.post('/calculate-cost', calculateCost);

// GET /api/routes - Route history
router.get('/routes', getRouteHistory);

// GET /api/market-data - Current market conditions
router.get('/market-data', getMarketData);

// GET /api/transport-rates - Real-time transportation rates
router.get('/transport-rates', getTransportRates);

// GET /api/fuel-price-prediction/:fuelType/:days? - Get price predictions for a specific fuel
router.get('/fuel-price-prediction/:fuelType/:days?', (req, res) => {
  try {
    const { fuelType } = req.params;
    const days = parseInt(req.params.days) || 30;
    
    if (!['hydrogen', 'methanol', 'ammonia'].includes(fuelType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fuel type. Must be hydrogen, methanol, or ammonia.'
      });
    }
    
    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        error: 'Days parameter must be between 1 and 365.'
      });
    }
    
    const prediction = dynamicPricing.predictFuelPrice(fuelType, days);
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error(`Error predicting ${req.params.fuelType} prices:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict fuel prices'
    });
  }
});

// POST /api/suggest-hub - Suggest optimal hub for routing
router.post('/suggest-hub', suggestOptimalHub);

// GET /api/fuel-types - Available fuel types with current prices
router.get('/fuel-types', async (req, res) => {
  try {
    // Get real-time fuel prices
    const fuelPrices = await dynamicPricing.getFuelPrices();
    
    res.json({
      success: true,
      data: [
        {
          type: 'hydrogen',
          name: 'Hydrogen (H₂)',
          currentPrice: fuelPrices.hydrogen.price,
          unit: 'kg',
          trend: 'stable',
          states: ['gas', 'liquid'],
          confidence: fuelPrices.hydrogen.confidence,
          lastUpdated: fuelPrices.hydrogen.lastUpdated
        },
        {
          type: 'methanol',
          name: 'Methanol (CH₃OH)',
          currentPrice: fuelPrices.methanol.price,
          unit: 'kg',
          trend: 'rising',
          states: ['liquid'],
          confidence: fuelPrices.methanol.confidence,
          lastUpdated: fuelPrices.methanol.lastUpdated
        },
        {
          type: 'ammonia',
          name: 'Ammonia (NH₃)',
          currentPrice: fuelPrices.ammonia.price,
          unit: 'kg',
          trend: 'falling',
          states: ['gas', 'liquid'],
          confidence: fuelPrices.ammonia.confidence,
          lastUpdated: fuelPrices.ammonia.lastUpdated
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    // Fallback to static data
    res.json({
      success: true,
      data: [
        {
          type: 'hydrogen',
          name: 'Hydrogen (H₂)',
          currentPrice: 4.25,
          unit: 'kg',
          trend: 'stable',
          states: ['gas', 'liquid']
        },
        {
          type: 'methanol',
          name: 'Methanol (CH₃OH)',
          currentPrice: 0.45,
          unit: 'kg',
          trend: 'rising',
          states: ['liquid']
        },
        {
          type: 'ammonia',
          name: 'Ammonia (NH₃)',
          currentPrice: 0.65,
          unit: 'kg',
          trend: 'falling',
          states: ['gas', 'liquid']
        }
      ]
    });
  }
});

// GET /api/transport-modes - Available transport modes with rates
router.get('/transport-modes', async (req, res) => {
  try {
    // Get real-time transport rates
    const transportRates = await dynamicPricing.getTransportRates();
    
    res.json({
      success: true,
      data: {
        truck: { 
          name: 'Truck Transport',
          rate: transportRates.truck.baseRate + transportRates.truck.fuelSurcharge, 
          baseRate: transportRates.truck.baseRate,
          fuelSurcharge: transportRates.truck.fuelSurcharge,
          unit: '$/ton-mile',
          speed: 60,
          icon: '🚛',
          description: 'Flexible door-to-door delivery',
          confidence: transportRates.truck.confidence,
          lastUpdated: transportRates.truck.lastUpdated
        },
        rail: { 
          name: 'Rail Transport',
          rate: transportRates.rail.baseRate + transportRates.rail.fuelSurcharge, 
          baseRate: transportRates.rail.baseRate,
          fuelSurcharge: transportRates.rail.fuelSurcharge,
          unit: '$/ton-mile',
          speed: 45,
          icon: '🚂',
          description: 'Cost-effective for long distances',
          confidence: transportRates.rail.confidence,
          lastUpdated: transportRates.rail.lastUpdated
        },
        ship: { 
          name: 'Ship Transport',
          rate: transportRates.ship.baseRate + transportRates.ship.fuelSurcharge, 
          baseRate: transportRates.ship.baseRate,
          fuelSurcharge: transportRates.ship.fuelSurcharge,
          unit: '$/ton-mile',
          speed: 25,
          icon: '🚢',
          description: 'Most economical for international',
          confidence: transportRates.ship.confidence,
          lastUpdated: transportRates.ship.lastUpdated
        },
        pipeline: { 
          name: 'Pipeline Transport',
          rate: transportRates.pipeline.baseRate + transportRates.pipeline.fuelSurcharge, 
          baseRate: transportRates.pipeline.baseRate,
          fuelSurcharge: transportRates.pipeline.fuelSurcharge,
          unit: '$/ton-mile',
          speed: 15,
          icon: '🔧',
          description: 'Lowest cost for compatible fuels',
          confidence: transportRates.pipeline.confidence,
          lastUpdated: transportRates.pipeline.lastUpdated
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transport modes:', error);
    // Fallback to static data
    res.json({
      success: true,
      data: {
        truck: { 
          name: 'Truck Transport',
          rate: 2.80, 
          unit: '$/ton-mile',
          speed: 60,
          icon: '🚛',
          description: 'Flexible door-to-door delivery'
        },
        rail: { 
          name: 'Rail Transport',
          rate: 1.10, 
          unit: '$/ton-mile',
          speed: 45,
          icon: '🚂',
          description: 'Cost-effective for long distances'
        },
        ship: { 
          name: 'Ship Transport',
          rate: 0.65, 
          unit: '$/ton-mile',
          speed: 25,
          icon: '🚢',
          description: 'Most economical for international'
        },
        pipeline: { 
          name: 'Pipeline Transport',
          rate: 0.40, 
          unit: '$/ton-mile',
          speed: 15,
          icon: '🔧',
          description: 'Lowest cost for compatible fuels'
        }
      }
    });
  }
});

// GET /api/cities - Available US ports and hubs with infrastructure
router.get('/cities', (req, res) => {
  const cities = [
    // Gulf Coast Ports
    {
      name: 'Houston, TX',
      coordinates: [29.7604, -95.3698],
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      type: 'port',
      region: 'US Gulf Coast',
      portCode: 'USTXH',
      facilities: ['petrochemical', 'container', 'bulk', 'energy']
    },
    {
      name: 'New Orleans, LA',
      coordinates: [29.9511, -90.0715],
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      type: 'port',
      region: 'US Gulf Coast',
      portCode: 'USLNO',
      facilities: ['bulk', 'container', 'energy', 'grain']
    },
    {
      name: 'Mobile, AL',
      coordinates: [30.6954, -88.0399],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US Gulf Coast',
      portCode: 'USMOB',
      facilities: ['container', 'bulk', 'automotive']
    },
    {
      name: 'Tampa Bay, FL',
      coordinates: [27.9506, -82.4572],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US Gulf Coast',
      portCode: 'USTPA',
      facilities: ['bulk', 'container', 'energy', 'phosphate']
    },
    
    // East Coast Ports
    {
      name: 'Savannah, GA',
      coordinates: [32.0835, -81.0998],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US East Coast',
      portCode: 'USSAV',
      facilities: ['container', 'bulk', 'automotive']
    },
    {
      name: 'Jacksonville, FL',
      coordinates: [30.3322, -81.6557],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US East Coast',
      portCode: 'USJAX',
      facilities: ['container', 'automotive', 'bulk']
    },
    {
      name: 'New York/NJ',
      coordinates: [40.6892, -74.0445],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US East Coast',
      portCode: 'USNYC',
      facilities: ['container', 'bulk', 'energy', 'automotive']
    },
    {
      name: 'Philadelphia, PA',
      coordinates: [39.9526, -75.1652],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US East Coast',
      portCode: 'USPHL',
      facilities: ['bulk', 'container', 'energy', 'steel']
    },
    {
      name: 'Norfolk, VA',
      coordinates: [36.8508, -76.2859],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US East Coast',
      portCode: 'USNFK',
      facilities: ['container', 'bulk', 'coal', 'military']
    },
    {
      name: 'Miami, FL',
      coordinates: [25.7617, -80.1918],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US East Coast',
      portCode: 'USMIA',
      facilities: ['container', 'cruise', 'cargo']
    },
    {
      name: 'Boston, MA',
      coordinates: [42.3601, -71.0589],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US East Coast',
      portCode: 'USBOS',
      facilities: ['container', 'bulk', 'energy', 'fish']
    },
    
    // West Coast Ports
    {
      name: 'Long Beach, CA',
      coordinates: [33.7701, -118.1937],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast',
      portCode: 'USLGB',
      facilities: ['container', 'bulk', 'automotive', 'energy']
    },
    {
      name: 'Los Angeles, CA',
      coordinates: [34.0522, -118.2437],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast',
      portCode: 'USLAX',
      facilities: ['container', 'bulk', 'automotive', 'energy']
    },
    {
      name: 'Seattle, WA',
      coordinates: [47.6062, -122.3321],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast',
      portCode: 'USSEA',
      facilities: ['container', 'bulk', 'energy', 'fish']
    },
    {
      name: 'Portland, OR',
      coordinates: [45.5152, -122.6784],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast',
      portCode: 'USPOR',
      facilities: ['bulk', 'container', 'automotive', 'grain']
    },
    {
      name: 'San Francisco/Oakland, CA',
      coordinates: [37.8044, -122.2712],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast',
      portCode: 'USFRO',
      facilities: ['container', 'bulk', 'automotive']
    },
    
    // Inland Hubs
    {
      name: 'Chicago, IL',
      coordinates: [41.8781, -87.6298],
      infrastructure: ['truck', 'rail', 'pipeline'],
      type: 'rail_hub',
      region: 'US Midwest',
      portCode: 'USCHI',
      facilities: ['rail_yard', 'distribution', 'commodity_exchange']
    },
    {
      name: 'St. Louis, MO',
      coordinates: [38.6270, -90.1994],
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      type: 'inland_hub',
      region: 'US Midwest',
      portCode: 'USSTL',
      facilities: ['river_port', 'rail_yard', 'distribution']
    },
    {
      name: 'Memphis, TN',
      coordinates: [35.1495, -90.0490],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'inland_hub',
      region: 'US Southeast',
      portCode: 'USMEM',
      facilities: ['distribution', 'rail_yard', 'river_port']
    },
    {
      name: 'Duluth-Superior, MN/WI',
      coordinates: [46.7867, -92.1005],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'inland_hub',
      region: 'US Great Lakes',
      portCode: 'USDLH',
      facilities: ['bulk', 'grain', 'iron_ore', 'coal']
    }
  ];

  res.json({
    success: true,
    data: cities
  });
});

// GET /api/optimization-recommendations
router.get('/optimization-recommendations', (req, res) => {
  const { origin, destination, fuelType, volume } = req.query;
  
  // Simple recommendation logic
  let recommendations = [];
  
  if (parseFloat(volume) > 100) {
    recommendations.push({
      type: 'volume',
      message: 'Large volume detected - consider rail or ship transport for cost efficiency',
      priority: 'high'
    });
  }
  
  if (fuelType === 'hydrogen') {
    recommendations.push({
      type: 'fuel',
      message: 'Hydrogen requires specialized handling - ensure proper safety protocols',
      priority: 'medium'
    });
  }
  
  if (origin && destination) {
    recommendations.push({
      type: 'route',
      message: 'Multi-modal transport available - check hub optimization',
      priority: 'low'
    });
  }
  
  res.json({
    success: true,
    data: recommendations
  });
});

// Yahoo Finance API integration (optional - requires API key)
router.get('/yahoo-finance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Yahoo Finance API endpoint (requires RapidAPI key)
    const options = {
      method: 'GET',
      url: `https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/${symbol}`,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const price = response.data.regularMarketPrice || response.data.price;
    
    res.json({
      success: true,
      symbol,
      price,
      timestamp: new Date(),
      source: 'yahoo-finance'
    });
  } catch (error) {
    console.error('Yahoo Finance API error:', error.message);
    
    // Fallback prices
    const fallbackPrices = {
      'H2-USD': 4.25,
      'MEOH-USD': 0.45,
      'NH3-USD': 0.65
    };
    
    res.json({
      success: true,
      symbol: req.params.symbol,
      price: fallbackPrices[req.params.symbol] || 1.0,
      timestamp: new Date(),
      source: 'fallback'
    });
  }
});

// Google Directions API for truck routing (optional - requires API key)
router.post('/routing/google-directions', async (req, res) => {
  try {
    const { origin, destination, mode } = req.body;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin[0]},${origin[1]}`,
        destination: `${destination[0]},${destination[1]}`,
        mode: mode === 'truck' ? 'driving' : 'transit',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distance = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
      const distanceInMiles = Math.round(distance * 0.000621371);
      
      res.json({
        success: true,
        distance: distanceInMiles,
        duration: route.legs.reduce((total, leg) => total + leg.duration.value, 0),
        source: 'google-directions'
      });
    } else {
      throw new Error('No route found');
    }
  } catch (error) {
    console.error('Google Directions API error:', error.message);
    
    // Fallback calculation
    const fallbackDistance = calculateFallbackDistance(req.body.origin, req.body.destination, 1.25);
    res.json({
      success: true,
      distance: fallbackDistance,
      source: 'fallback'
    });
  }
});

// Rail network routing (optional - requires API key)
router.post('/routing/rail-network', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    // Mock rail network API - in production, use services like OpenRailwayMap
    const response = await axios.post('https://api.openrailwaymap.org/route', {
      from: { lat: origin[0], lon: origin[1] },
      to: { lat: destination[0], lon: destination[1] },
      transport: 'rail'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RAILWAY_API_KEY}`
      }
    });

    res.json({
      success: true,
      distance: response.data.distance,
      source: 'rail-network'
    });
  } catch (error) {
    console.error('Rail network API error:', error.message);
    
    // Fallback calculation
    const fallbackDistance = calculateFallbackDistance(req.body.origin, req.body.destination, 1.15);
    res.json({
      success: true,
      distance: fallbackDistance,
      source: 'fallback'
    });
  }
});

// Maritime routing (optional - requires API key)
router.post('/routing/maritime', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    // Use OpenSeaMap or similar maritime routing service
    const response = await axios.post('https://api.openseamap.org/route', {
      from: { lat: origin[0], lon: origin[1] },
      to: { lat: destination[0], lon: destination[1] },
      transport: 'ship'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MARITIME_API_KEY}`
      }
    });

    res.json({
      success: true,
      distance: response.data.distance,
      source: 'maritime'
    });
  } catch (error) {
    console.error('Maritime routing API error:', error.message);
    
    // Fallback calculation
    const fallbackDistance = calculateFallbackDistance(req.body.origin, req.body.destination, 1.35);
    res.json({
      success: true,
      distance: fallbackDistance,
      source: 'fallback'
    });
  }
});

// Pipeline network routing (optional - requires API key)
router.post('/routing/pipeline', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    // Mock pipeline network API
    const pipelineNetworks = {
      'natural-gas': 'https://api.eia.gov/pipeline/natural-gas',
      'crude-oil': 'https://api.eia.gov/pipeline/crude-oil'
    };
    
    const response = await axios.get(pipelineNetworks['natural-gas'], {
      params: {
        origin: `${origin[0]},${origin[1]}`,
        destination: `${destination[0]},${destination[1]}`,
        api_key: process.env.EIA_API_KEY
      }
    });

    res.json({
      success: true,
      distance: response.data.distance,
      source: 'pipeline-network'
    });
  } catch (error) {
    console.error('Pipeline network API error:', error.message);
    
    // Fallback calculation
    const fallbackDistance = calculateFallbackDistance(req.body.origin, req.body.destination, 1.10);
    res.json({
      success: true,
      distance: fallbackDistance,
      source: 'fallback'
    });
  }
});

// Ollama AI integration (optional - requires local Ollama installation)
router.post('/ollama/analyze', async (req, res) => {
  try {
    const { model, prompt } = req.body;
    
    const response = await axios.post(`http://localhost:11434/api/generate`, {
      model: model || 'llama3.1',
      prompt: prompt,
      stream: false
    });

    res.json({
      success: true,
      response: response.data.response,
      model: model,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Ollama API error:', error.message);
    
    // Fallback AI insights
    const fallbackInsights = {
      recommendations: [
        "Consider rail transport for volumes >50 tonnes for cost efficiency",
        "Pipeline transport offers lowest cost where infrastructure permits",
        "Current fuel prices suggest favorable timing for transport"
      ],
      risks: [
        "Fuel price volatility in current market conditions",
        "Weather-related delays possible for maritime routes",
        "Infrastructure capacity constraints during peak seasons"
      ],
      alternatives: [
        "Direct routing may reduce total cost by 15-20%",
        "Consider hub optimization for multi-modal efficiency",
        "Bulk transport discounts available for large volumes"
      ],
      timing: "Current market conditions show stable fuel prices with slight upward trend"
    };
    
    res.json({
      success: true,
      response: JSON.stringify(fallbackInsights),
      model: 'fallback',
      timestamp: new Date()
    });
  }
});

// Helper function for fallback distance calculation
function calculateFallbackDistance(origin, destination, factor) {
  const [lat1, lon1] = origin;
  const [lat2, lon2] = destination;
  
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const baseDistance = R * c;
  
  return Math.round(baseDistance * factor);
}

module.exports = router;