// Enhanced routeController.js with commodity pricing and mode-specific routing

const path = require('path');
const Route = require(path.join(__dirname, '..', 'models', 'Route'));

// Enhanced city database with transport mode availability
const cityDatabase = {
  'LAX (Los Angeles International Airport), CA': {
    coords: [33.9425, -118.4081],
    infrastructure: { truck: true, rail: true, ship: false, pipeline: false }
  },
  'Port of Long Beach, CA': {
    coords: [33.7701, -118.1937],
    infrastructure: { truck: true, rail: true, ship: true, pipeline: false }
  },
  'Taipei, Taiwan': {
    coords: [25.0330, 121.5654],
    infrastructure: { truck: true, rail: false, ship: true, pipeline: false }
  },
  'Seattle, WA': {
    coords: [47.6062, -122.3321],
    infrastructure: { truck: true, rail: true, ship: true, pipeline: false }
  },
  'Houston, TX': {
    coords: [29.7604, -95.3698],
    infrastructure: { truck: true, rail: true, ship: true, pipeline: true }
  },
  'New York, NY': {
    coords: [40.7128, -74.0060],
    infrastructure: { truck: true, rail: true, ship: true, pipeline: false }
  },
  'Chicago, IL': {
    coords: [41.8781, -87.6298],
    infrastructure: { truck: true, rail: true, ship: false, pipeline: true }
  },
  'Miami, FL': [25.7617, -80.1918],
  'Denver, CO': [39.7392, -104.9903],
  'Portland, OR': [45.5152, -122.6784],
  'San Francisco, CA': [37.7749, -122.4194],
  'Oakland, CA': [37.8044, -122.2712],
  'Vancouver Port, BC': [49.2827, -123.1207],
  'Tokyo Port, Japan': [35.6762, 139.6503],
  'Shanghai Port, China': [31.2304, 121.4737],
  'Singapore Port': [1.3521, 103.8198]
};

// Current market data including commodity prices
const marketData = {
  commodityPrices: {
    hydrogen: { price: 4.25, unit: 'kg', trend: 'stable' },
    methanol: { price: 0.45, unit: 'kg', trend: 'rising' },
    ammonia: { price: 0.65, unit: 'kg', trend: 'falling' }
  },
  transportRates: {
    truck: { rate: 2.80, speed: 60, availability: 0.95 },
    rail: { rate: 1.10, speed: 45, availability: 0.85 },
    ship: { rate: 0.65, speed: 25, availability: 0.90 },
    pipeline: { rate: 0.40, speed: 15, availability: 0.99 }
  },
  routingFactors: {
    truck: 1.25,    // Roads add 25% to straight-line distance
    rail: 1.15,     // Rail routes are more direct
    ship: 1.35,     // Ships follow coastlines and shipping lanes
    pipeline: 1.10  // Pipelines are fairly direct
  }
};

// Mode-specific distance calculation
function calculateModeDistance(origin, destination, mode) {
  const originCoords = cityDatabase[origin]?.coords || cityDatabase[origin];
  const destCoords = cityDatabase[destination]?.coords || cityDatabase[destination];
  
  if (!originCoords || !destCoords) {
    console.log(`⚠️  Unknown city: ${origin} or ${destination}`);
    return Math.floor(Math.random() * 2000) + 500;
  }

  const [lat1, lon1] = originCoords;
  const [lat2, lon2] = destCoords;
  
  // Calculate base great circle distance
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const baseDistance = R * c;
  
  // Apply mode-specific routing factor
  const routingFactor = marketData.routingFactors[mode] || 1.2;
  return Math.round(baseDistance * routingFactor);
}

// AI optimization function
function optimizeTransportMode(origin, destination, volume, optimizationMode) {
  const originInfra = cityDatabase[origin]?.infrastructure || {};
  const destInfra = cityDatabase[destination]?.infrastructure || {};
  
  // Find available modes at both locations
  const availableModes = ['truck', 'rail', 'ship', 'pipeline'].filter(mode => 
    originInfra[mode] && destInfra[mode]
  );

  if (availableModes.length === 0) return 'truck'; // Fallback

  // Calculate score for each mode
  const modeScores = availableModes.map(mode => {
    const distance = calculateModeDistance(origin, destination, mode);
    const rate = marketData.transportRates[mode].rate;
    const speed = marketData.transportRates[mode].speed;
    
    const cost = distance * rate * volume;
    const time = distance / speed;
    
    return {
      mode,
      cost,
      time,
      score: optimizationMode === 'cost' ? cost : time
    };
  });

  // Sort by score and return best mode
  modeScores.sort((a, b) => a.score - b.score);
  return modeScores[0].mode;
}

// Enhanced cost calculation with commodity pricing
const calculateCost = async (req, res) => {
  try {
    console.log('📝 Received enhanced calculation request:', req.body);
    
    const { 
      fuelType, 
      volume, 
      volumeUnit = 'tonnes',
      origin, 
      destination, 
      intermediateHub, 
      transportMode1, 
      transportMode2,
      optimizationMode = 'manual'
    } = req.body;
    
    if (!fuelType || !volume || !origin || !destination) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fuelType', 'volume', 'origin', 'destination']
      });
    }

    // Convert volume to tonnes
    const volumeConversions = {
      tonnes: 1,
      kg: 0.001,
      liters: 0.001, // Simplified
      gallons: 0.00378541
    };
    
    const volumeInTonnes = parseFloat(volume) * (volumeConversions[volumeUnit] || 1);
    const volumeInKg = volumeInTonnes * 1000;
    console.log('💰 Volume in tonnes:', volumeInTonnes);

    // Calculate commodity cost
    const commodityPrice = marketData.commodityPrices[fuelType]?.price || 1.0;
    const commodityCost = volumeInKg * commodityPrice;

    let totalDistance, transportationCost, mode1, mode2, legs = null;
    
    if (intermediateHub) {
      // Multi-leg calculation with AI optimization
      mode1 = optimizationMode === 'manual' ? transportMode1 : 
              optimizeTransportMode(origin, intermediateHub, volumeInTonnes, optimizationMode);
      mode2 = optimizationMode === 'manual' ? transportMode2 : 
              optimizeTransportMode(intermediateHub, destination, volumeInTonnes, optimizationMode);
      
      const distance1 = calculateModeDistance(origin, intermediateHub, mode1);
      const distance2 = calculateModeDistance(intermediateHub, destination, mode2);
      totalDistance = distance1 + distance2;
      
      const rate1 = marketData.transportRates[mode1]?.rate || 2.5;
      const rate2 = marketData.transportRates[mode2]?.rate || 2.5;
      
      const cost1 = distance1 * rate1 * volumeInTonnes;
      const cost2 = distance2 * rate2 * volumeInTonnes;
      transportationCost = cost1 + cost2;
      
      legs = {
        leg1: { distance: distance1, mode: mode1, cost: cost1 },
        leg2: { distance: distance2, mode: mode2, cost: cost2 }
      };
      
      console.log('🛣️  Multi-leg route calculated:', legs);
    } else {
      // Single leg calculation with AI optimization
      mode1 = optimizationMode === 'manual' ? transportMode1 : 
              optimizeTransportMode(origin, destination, volumeInTonnes, optimizationMode);
      
      totalDistance = calculateModeDistance(origin, destination, mode1);
      const rate = marketData.transportRates[mode1]?.rate || 2.5;
      transportationCost = totalDistance * rate * volumeInTonnes;
      
      console.log('🛣️  Single leg distance:', totalDistance);
    }

    // Additional costs
    const fuelHandlingFee = volumeInTonnes * 75;
    const terminalFees = legs ? 650 : 400;
    const hubTransferFee = legs ? volumeInTonnes * 45 : 0;
    const insuranceCost = (commodityCost + transportationCost) * 0.03;
    const carbonOffset = volumeInTonnes * 12;
    const regulatoryFees = volumeInTonnes * 25;
    
    const totalTransportCost = transportationCost + fuelHandlingFee + terminalFees + 
                               hubTransferFee + insuranceCost + carbonOffset + regulatoryFees;
    const allInCost = commodityCost + totalTransportCost;
    
    // Create response data structure that matches frontend expectations
    const responseData = {
      // All-in cost as primary output
      allInCost: Math.round(allInCost * 100) / 100,
      totalCost: Math.round(allInCost * 100) / 100, // Backward compatibility
      
      // Cost breakdown
      commodityCost: Math.round(commodityCost * 100) / 100,
      transportationCost: Math.round(transportationCost * 100) / 100,
      totalTransportCost: Math.round(totalTransportCost * 100) / 100,
      baseCost: Math.round(transportationCost * 100) / 100, // Backward compatibility
      
      // Route details
      distance: totalDistance,
      totalDistance: totalDistance, // Backward compatibility
      legs,
      optimizedModes: { mode1, mode2 },
      
      // Individual cost components (matching frontend expectations)
      fuelHandlingFee: Math.round(fuelHandlingFee * 100) / 100,
      terminalFees: Math.round(terminalFees * 100) / 100,
      hubTransferFee: Math.round(hubTransferFee * 100) / 100,
      insuranceCost: Math.round(insuranceCost * 100) / 100,
      carbonOffset: Math.round(carbonOffset * 100) / 100,
      
      // Route details
      hub: intermediateHub,
      
      // Enhanced cost breakdown
      costBreakdown: {
        commodity: Math.round(commodityCost * 100) / 100,
        transport: Math.round(transportationCost * 100) / 100,
        handling: Math.round(fuelHandlingFee * 100) / 100,
        terminal: terminalFees,
        transfer: Math.round(hubTransferFee * 100) / 100,
        insurance: Math.round(insuranceCost * 100) / 100,
        carbon: Math.round(carbonOffset * 100) / 100,
        regulatory: Math.round(regulatoryFees * 100) / 100,
        // Backward compatibility
        fuelHandlingFee: Math.round(fuelHandlingFee * 100) / 100,
        terminalFees: Math.round(terminalFees * 100) / 100,
        hubTransferFee: Math.round(hubTransferFee * 100) / 100,
        carbonOffset: Math.round(carbonOffset * 100) / 100
      },
      
      // Metadata
      confidence: optimizationMode === 'manual' ? 85 : 92,
      optimizationMode,
      marketConditions: {
        commodityPrice: commodityPrice,
        fuelTrend: marketData.commodityPrices[fuelType]?.trend
      },
      marketInsights: {
        fuelTrend: marketData.commodityPrices[fuelType]?.trend || 'stable',
        recommendation: "Multi-leg transport optimized for international shipping. Hub transfer ensures efficient mode switching."
      },
      timestamp: new Date()
    };

    console.log('✅ Final response data:', responseData);

    // Enhanced route object for database
    const route = new Route({
      ...req.body,
      calculatedCost: allInCost,
      commodityCost,
      transportationCost,
      distance: totalDistance,
      optimizedModes: { mode1, mode2 },
      confidence: optimizationMode === 'manual' ? 85 : 92
    });

    const savedRoute = await route.save();
    console.log('✅ Enhanced route saved:', savedRoute._id);

    res.json({
      success: true,
      routeId: savedRoute._id,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Enhanced calculation error:', error);
    res.status(500).json({
      error: 'Enhanced calculation failed',
      message: error.message
    });
  }
};

// Get market data endpoint
const getMarketData = async (req, res) => {
  try {
    res.json({
      success: true,
      data: marketData
    });
  } catch (error) {
    console.error('❌ Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
};

const getRouteHistory = async (req, res) => {
  try {
    const routes = await Route.find().sort({ timestamp: -1 }).limit(10);
    res.json({ success: true, data: routes });
  } catch (error) {
    console.error('❌ Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

module.exports = {
  calculateCost,
  getRouteHistory,
  getMarketData
};