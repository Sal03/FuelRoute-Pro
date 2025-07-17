// Enhanced backend/routes/routeRoutes.js with all API integrations

const express = require('express');
const axios = require('axios');
const router = express.Router();
const { calculateCost, getRouteHistory, getMarketData } = require('../controllers/routeController');

// POST /api/calculate-cost - Enhanced calculation with commodity pricing
router.post('/calculate-cost', calculateCost);

// GET /api/routes - Route history
router.get('/routes', getRouteHistory);

// GET /api/market-data - Current market conditions
router.get('/market-data', getMarketData);

// GET /api/fuel-types - Available fuel types with current prices
router.get('/fuel-types', (req, res) => {
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
});

// GET /api/transport-modes - Available transport modes with rates
router.get('/transport-modes', (req, res) => {
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
});

// GET /api/cities - Available cities with infrastructure
router.get('/cities', (req, res) => {
  const cities = [
    {
      name: 'LAX (Los Angeles International Airport), CA',
      coordinates: [33.9425, -118.4081],
      infrastructure: ['truck', 'rail'],
      type: 'airport',
      region: 'US West Coast'
    },
    {
      name: 'Port of Long Beach, CA',
      coordinates: [33.7701, -118.1937],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast'
    },
    {
      name: 'Houston, TX',
      coordinates: [29.7604, -95.3698],
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      type: 'port',
      region: 'US Gulf Coast'
    },
    {
      name: 'Seattle, WA',
      coordinates: [47.6062, -122.3321],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast'
    },
    {
      name: 'New York, NY',
      coordinates: [40.7128, -74.0060],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US East Coast'
    },
    {
      name: 'Chicago, IL',
      coordinates: [41.8781, -87.6298],
      infrastructure: ['truck', 'rail', 'pipeline'],
      type: 'rail_hub',
      region: 'US Midwest'
    },
    {
      name: 'Taipei, Taiwan',
      coordinates: [25.0330, 121.5654],
      infrastructure: ['truck', 'ship'],
      type: 'port',
      region: 'Asia Pacific'
    },
    {
      name: 'Miami, FL',
      coordinates: [25.7617, -80.1918],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US Southeast'
    },
    {
      name: 'Denver, CO',
      coordinates: [39.7392, -104.9903],
      infrastructure: ['truck', 'rail', 'pipeline'],
      type: 'inland_hub',
      region: 'US Mountain'
    },
    {
      name: 'Portland, OR',
      coordinates: [45.5152, -122.6784],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US Pacific Northwest'
    },
    {
      name: 'San Francisco, CA',
      coordinates: [37.7749, -122.4194],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast'
    },
    {
      name: 'Oakland, CA',
      coordinates: [37.8044, -122.2712],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'US West Coast'
    },
    {
      name: 'Vancouver Port, BC',
      coordinates: [49.2827, -123.1207],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'Canada West'
    },
    {
      name: 'Tokyo Port, Japan',
      coordinates: [35.6762, 139.6503],
      infrastructure: ['truck', 'ship'],
      type: 'port',
      region: 'Asia Pacific'
    },
    {
      name: 'Shanghai Port, China',
      coordinates: [31.2304, 121.4737],
      infrastructure: ['truck', 'rail', 'ship'],
      type: 'port',
      region: 'Asia Pacific'
    },
    {
      name: 'Singapore Port',
      coordinates: [1.3521, 103.8198],
      infrastructure: ['truck', 'ship'],
      type: 'port',
      region: 'Asia Pacific'
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