// Use absolute require path to avoid confusion
const path = require('path');
const Route = require(path.join(__dirname, '..', 'models', 'Route'));

const cityDatabase = {
  'LAX (Los Angeles International Airport), CA': [33.9425, -118.4081],
  'Port of Long Beach, CA': [33.7701, -118.1937],
  'Taipei, Taiwan': [25.0330, 121.5654],
  'Seattle, WA': [47.6062, -122.3321],
  'Houston, TX': [29.7604, -95.3698],
  'New York, NY': [40.7128, -74.0060],
  'Chicago, IL': [41.8781, -87.6298]
};

const transportRates = {
  truck: 2.80,
  rail: 1.10,
  ship: 0.65,
  pipeline: 0.40
};

function calculateDistance(origin, destination) {
  const originCoords = cityDatabase[origin];
  const destCoords = cityDatabase[destination];
  
  if (!originCoords || !destCoords) {
    return Math.floor(Math.random() * 2000) + 500;
  }

  const [lat1, lon1] = originCoords;
  const [lat2, lon2] = destCoords;
  
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round(R * c);
}

const calculateCost = async (req, res) => {
  try {
    console.log('📝 Received calculation request:', req.body);
    
    const { fuelType, volume, origin, destination, intermediateHub, transportMode1, transportMode2 } = req.body;
    
    if (!fuelType || !volume || !origin || !destination) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fuelType', 'volume', 'origin', 'destination']
      });
    }

    let totalDistance;
    let legs = null;
    
    if (intermediateHub) {
      const leg1 = calculateDistance(origin, intermediateHub);
      const leg2 = calculateDistance(intermediateHub, destination);
      totalDistance = leg1 + leg2;
      
      legs = {
        leg1: { distance: leg1, mode: transportMode1 },
        leg2: { distance: leg2, mode: transportMode2 }
      };
    } else {
      totalDistance = calculateDistance(origin, destination);
    }

    const volumeInTonnes = parseFloat(volume);
    const rate1 = transportRates[transportMode1] || 2.5;
    const rate2 = transportRates[transportMode2] || 2.5;
    
    let baseCost;
    if (legs) {
      baseCost = (legs.leg1.distance * rate1 + legs.leg2.distance * rate2) * volumeInTonnes;
      legs.leg1.cost = legs.leg1.distance * rate1 * volumeInTonnes;
      legs.leg2.cost = legs.leg2.distance * rate2 * volumeInTonnes;
    } else {
      baseCost = totalDistance * rate1 * volumeInTonnes;
    }

    const fuelHandlingFee = volumeInTonnes * 75;
    const terminalFees = legs ? 650 : 400;
    const hubTransferFee = legs ? volumeInTonnes * 45 : 0;
    const insuranceCost = baseCost * 0.03;
    const carbonOffset = volumeInTonnes * 12;
    
    const totalCost = baseCost + fuelHandlingFee + terminalFees + hubTransferFee + insuranceCost + carbonOffset;

    const route = new Route({
      ...req.body,
      calculatedCost: totalCost,
      baseCost,
      distance: totalDistance,
      confidence: 85
    });

    const savedRoute = await route.save();
    console.log('✅ Route saved to database:', savedRoute._id);

    res.json({
      success: true,
      routeId: savedRoute._id,
      data: {
        totalCost: Math.round(totalCost * 100) / 100,
        baseCost: Math.round(baseCost * 100) / 100,
        distance: totalDistance,
        legs,
        costBreakdown: {
          fuelHandlingFee: Math.round(fuelHandlingFee * 100) / 100,
          terminalFees,
          hubTransferFee: Math.round(hubTransferFee * 100) / 100,
          insuranceCost: Math.round(insuranceCost * 100) / 100,
          carbonOffset: Math.round(carbonOffset * 100) / 100
        },
        confidence: 85,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Calculation error:', error);
    res.status(500).json({
      error: 'Calculation failed',
      message: error.message
    });
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
  getRouteHistory
};