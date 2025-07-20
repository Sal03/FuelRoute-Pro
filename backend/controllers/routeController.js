// Enhanced routeController.js with real-time transportation APIs

const path = require('path');
const Route = require(path.join(__dirname, '..', 'models', 'Route'));
const SimpleTransportationAPI = require('../services/simpleTransportationAPI');
const dynamicPricing = require('../utils/dynamicPricing');
const transportationAPI = new SimpleTransportationAPI();

// Truck capacity limits by fuel type (in tonnes)
const truckCapacities = {
  hydrogen: {
    liquid: 4.5,    // Liquid hydrogen truck capacity
    gas: 0.35,      // Compressed hydrogen gas capacity
    solid: 8.0      // Metal hydride storage capacity
  },
  methanol: {
    liquid: 26.0,   // Standard chemical tanker
    gas: 15.0,      // Vaporized methanol
    solid: 20.0     // Methanol pellets/powder
  },
  ammonia: {
    liquid: 20.0,   // Anhydrous ammonia tanker
    gas: 12.0,      // Compressed ammonia
    solid: 18.0     // Solid ammonia compounds
  }
};

// Function to calculate number of trucks needed
function calculateTrucksNeeded(fuelType, fuelState, volumeInTonnes) {
  const capacity = truckCapacities[fuelType]?.[fuelState] || truckCapacities[fuelType]?.liquid || 20.0;
  const trucksNeeded = Math.ceil(volumeInTonnes / capacity);
  
  return {
    trucksNeeded,
    capacityPerTruck: capacity,
    totalCapacityUsed: volumeInTonnes,
    utilizationRate: (volumeInTonnes / (trucksNeeded * capacity) * 100).toFixed(1)
  };
}

// US Port/Hub database with coordinates and infrastructure capabilities
const cityDatabase = {
  'Houston, TX': { coords: [29.7604, -95.3698], portCode: 'USTXH', infrastructure: ['truck', 'rail', 'ship', 'pipeline'] },
  'New Orleans, LA': { coords: [29.9511, -90.0715], portCode: 'USLNO', infrastructure: ['truck', 'rail', 'ship', 'pipeline'] },
  'Mobile, AL': { coords: [30.6954, -88.0399], portCode: 'USMOB', infrastructure: ['truck', 'rail', 'ship'] },
  'Tampa Bay, FL': { coords: [27.9506, -82.4572], portCode: 'USTPA', infrastructure: ['truck', 'rail', 'ship'] },
  'Savannah, GA': { coords: [32.0835, -81.0998], portCode: 'USSAV', infrastructure: ['truck', 'rail', 'ship'] },
  'Jacksonville, FL': { coords: [30.3322, -81.6557], portCode: 'USJAX', infrastructure: ['truck', 'rail', 'ship'] },
  'New York/NJ': { coords: [40.6892, -74.0445], portCode: 'USNYC', infrastructure: ['truck', 'rail', 'ship'] },
  'Philadelphia, PA': { coords: [39.9526, -75.1652], portCode: 'USPHL', infrastructure: ['truck', 'rail', 'ship'] },
  'Norfolk, VA': { coords: [36.8508, -76.2859], portCode: 'USNFK', infrastructure: ['truck', 'rail', 'ship'] },
  'Miami, FL': { coords: [25.7617, -80.1918], portCode: 'USMIA', infrastructure: ['truck', 'rail', 'ship'] },
  'Boston, MA': { coords: [42.3601, -71.0589], portCode: 'USBOS', infrastructure: ['truck', 'rail', 'ship'] },
  'Long Beach, CA': { coords: [33.7701, -118.1937], portCode: 'USLGB', infrastructure: ['truck', 'rail', 'ship'] },
  'Los Angeles, CA': { coords: [34.0522, -118.2437], portCode: 'USLAX', infrastructure: ['truck', 'rail', 'ship'] },
  'Seattle, WA': { coords: [47.6062, -122.3321], portCode: 'USSEA', infrastructure: ['truck', 'rail', 'ship'] },
  'Bellevue, WA': { coords: [47.6101, -122.2015], portCode: 'USBEL', infrastructure: ['truck', 'rail'] },
  'Portland, OR': { coords: [45.5152, -122.6784], portCode: 'USPOR', infrastructure: ['truck', 'rail', 'ship'] },
  'San Francisco/Oakland, CA': { coords: [37.8044, -122.2712], portCode: 'USFRO', infrastructure: ['truck', 'rail', 'ship'] },
  'Chicago, IL': { coords: [41.8781, -87.6298], portCode: 'USCHI', infrastructure: ['truck', 'rail', 'pipeline'] },
  'St. Louis, MO': { coords: [38.6270, -90.1994], portCode: 'USSTL', infrastructure: ['truck', 'rail', 'ship', 'pipeline'] },
  'Memphis, TN': { coords: [35.1495, -90.0490], portCode: 'USMEM', infrastructure: ['truck', 'rail', 'ship'] },
  'Duluth-Superior, MN/WI': { coords: [46.7867, -92.1005], portCode: 'USDLH', infrastructure: ['truck', 'rail', 'ship'] },
  
  // Add missing cities and alternate names
  'Port of Long Beach, CA': { coords: [33.7701, -118.1937], portCode: 'USLGB', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Los Angeles, CA': { coords: [34.0522, -118.2437], portCode: 'USLAX', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Seattle, WA': { coords: [47.6062, -122.3321], portCode: 'USSEA', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Portland, OR': { coords: [45.5152, -122.6784], portCode: 'USPOR', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Houston, TX': { coords: [29.7604, -95.3698], portCode: 'USTXH', infrastructure: ['truck', 'rail', 'ship', 'pipeline'] },
  'Port of New Orleans, LA': { coords: [29.9511, -90.0715], portCode: 'USLNO', infrastructure: ['truck', 'rail', 'ship', 'pipeline'] },
  'Port of Miami, FL': { coords: [25.7617, -80.1918], portCode: 'USMIA', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Savannah, GA': { coords: [32.0835, -81.0998], portCode: 'USSAV', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of New York/NJ': { coords: [40.6892, -74.0445], portCode: 'USNYC', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Oakland, CA': { coords: [37.8044, -122.2712], portCode: 'USFRO', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Tacoma, WA': { coords: [47.2529, -122.4443], portCode: 'USTAC', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Norfolk, VA': { coords: [36.8508, -76.2859], portCode: 'USNFK', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Charleston, SC': { coords: [32.7767, -79.9311], portCode: 'USCHS', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Baltimore, MD': { coords: [39.2904, -76.6122], portCode: 'USBAL', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Boston, MA': { coords: [42.3601, -71.0589], portCode: 'USBOS', infrastructure: ['truck', 'rail', 'ship'] },
  'Port of Philadelphia, PA': { coords: [39.9526, -75.1652], portCode: 'USPHL', infrastructure: ['truck', 'rail', 'ship'] },
  
  // Add additional aliases
  'LAX': { coords: [34.0522, -118.2437], portCode: 'USLAX', infrastructure: ['truck', 'rail', 'ship'] },
  'LGB': { coords: [33.7701, -118.1937], portCode: 'USLGB', infrastructure: ['truck', 'rail', 'ship'] },
  'SEA': { coords: [47.6062, -122.3321], portCode: 'USSEA', infrastructure: ['truck', 'rail', 'ship'] },
  'PDX': { coords: [45.5152, -122.6784], portCode: 'USPOR', infrastructure: ['truck', 'rail', 'ship'] },
  'NYC': { coords: [40.6892, -74.0445], portCode: 'USNYC', infrastructure: ['truck', 'rail', 'ship'] },
  'HOU': { coords: [29.7604, -95.3698], portCode: 'USTXH', infrastructure: ['truck', 'rail', 'ship', 'pipeline'] },
  'MSY': { coords: [29.9511, -90.0715], portCode: 'USLNO', infrastructure: ['truck', 'rail', 'ship', 'pipeline'] },
  'MIA': { coords: [25.7617, -80.1918], portCode: 'USMIA', infrastructure: ['truck', 'rail', 'ship'] },
  'SAV': { coords: [32.0835, -81.0998], portCode: 'USSAV', infrastructure: ['truck', 'rail', 'ship'] },
  'ORD': { coords: [41.8781, -87.6298], portCode: 'USCHI', infrastructure: ['truck', 'rail', 'pipeline'] },
  'BOS': { coords: [42.3601, -71.0589], portCode: 'USBOS', infrastructure: ['truck', 'rail', 'ship'] }
};

// Current market data including commodity prices
const marketData = {
  commodityPrices: {
    hydrogen: { price: 4.25, unit: 'kg', trend: 'stable' },
    methanol: { price: 0.62, unit: 'kg', trend: 'rising' },
    ammonia: { price: 0.65, unit: 'kg', trend: 'falling' },
    diesel: { price: 3.50, unit: 'gallon', trend: 'stable' },
    gasoline: { price: 3.15, unit: 'gallon', trend: 'stable' }
  },
  transportRates: {
    truck: { rate: 2.80, speed: 60, availability: 0.95, minCost: 500 },
    rail: { rate: 1.10, speed: 45, availability: 0.85, minCost: 800 },
    ship: { rate: 0.65, speed: 25, availability: 0.90, minCost: 1200 },
    pipeline: { rate: 0.40, speed: 15, availability: 0.99, minCost: 300 }
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
  console.log(`🗺️  Calculating distance from "${origin}" to "${destination}" via ${mode}`);
  
  const originData = cityDatabase[origin];
  const destData = cityDatabase[destination];
  
  if (!originData || !destData) {
    console.log(`❌ Unknown city: ${origin} or ${destination}`);
    console.log(`Available cities: ${Object.keys(cityDatabase).slice(0, 10).join(', ')}...`);
    
    // Return a reasonable fallback distance instead of random
    return 500; // 500 miles as fallback
  }

  const originCoords = originData.coords;
  const destCoords = destData.coords;
  
  if (!originCoords || !destCoords) {
    console.log(`❌ Missing coordinates for ${origin} or ${destination}`);
    return 500;
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
  const finalDistance = Math.round(baseDistance * routingFactor);
  
  console.log(`📏 Distance calculated: ${finalDistance} miles (base: ${Math.round(baseDistance)}, factor: ${routingFactor})`);
  return finalDistance;
}

// Smart hub selection based on geography
function selectOptimalHub(origin, destination, transportMode1, transportMode2) {
  console.log(`🎯 Selecting optimal hub for ${origin} to ${destination}`);
  
  const originCoords = cityDatabase[origin]?.coords;
  const destCoords = cityDatabase[destination]?.coords;
  
  if (!originCoords || !destCoords) {
    console.log('❌ Missing coordinates for hub selection');
    return null;
  }

  const [originLat, originLon] = originCoords;
  const [destLat, destLon] = destCoords;
  
  // Calculate midpoint
  const midLat = (originLat + destLat) / 2;
  const midLon = (originLon + destLon) / 2;
  
  // Find hubs within reasonable distance of the midpoint
  const hubCandidates = Object.entries(cityDatabase)
    .filter(([city, data]) => {
      // Don't select origin or destination as hub
      if (city === origin || city === destination) return false;
      
      // Check if hub has required infrastructure
      const hasMode1 = data.infrastructure.includes(transportMode1);
      const hasMode2 = data.infrastructure.includes(transportMode2);
      
      return hasMode1 && hasMode2;
    })
    .map(([city, data]) => {
      const [hubLat, hubLon] = data.coords;
      
      // Calculate distance from midpoint
      const distanceFromMidpoint = Math.sqrt(
        Math.pow(hubLat - midLat, 2) + Math.pow(hubLon - midLon, 2)
      );
      
      // Calculate if this hub makes geographical sense
      const originToHub = calculateModeDistance(origin, city, transportMode1);
      const hubToDestination = calculateModeDistance(city, destination, transportMode2);
      const directDistance = calculateModeDistance(origin, destination, transportMode1);
      
      // Hub should not add more than 20% to total distance
      const routeEfficiency = (originToHub + hubToDestination) / directDistance;
      
      return {
        city,
        distanceFromMidpoint,
        routeEfficiency,
        totalDistance: originToHub + hubToDestination,
        score: distanceFromMidpoint * routeEfficiency // Lower is better
      };
    })
    .filter(hub => hub.routeEfficiency <= 1.5) // Max 50% increase in distance
    .sort((a, b) => a.score - b.score);
  
  console.log(`📍 Hub candidates evaluated: ${hubCandidates.length}`);
  
  return hubCandidates.length > 0 ? hubCandidates[0].city : null;
}

// AI optimization function
function optimizeTransportMode(origin, destination, volume, optimizationMode) {
  const originInfra = cityDatabase[origin]?.infrastructure || [];
  const destInfra = cityDatabase[destination]?.infrastructure || [];
  
  // Find available modes at both locations
  const availableModes = ['truck', 'rail', 'ship', 'pipeline'].filter(mode => 
    originInfra.includes(mode) && destInfra.includes(mode)
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

// Enhanced cost calculation with real-time transportation APIs
const fetch = require('node-fetch');

// HuggingFace AI route advice integration
async function getRouteAdvice(routeSummary) {
  const prompt = `Given the following route: ${routeSummary}, provide professional logistics advice for cost, efficiency, and risk.`;
  const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-small', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: prompt })
  });
  const data = await response.json();
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  } else if (typeof data === 'object' && data.generated_text) {
    return data.generated_text;
  } else {
    return 'No AI advice available.';
  }
}

const calculateCost = async (req, res) => {
  try {
    console.log('📝 [DEBUG] Received calculation request:', req.body);
    
    const { 
      fuelType, 
      fuelState = 'liquid',
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

    // Calculate commodity cost using dynamic pricing
    let commodityPrice = 1.0;
    let fuelPrices = null;
    
    try {
      fuelPrices = await dynamicPricing.getFuelPrices();
      commodityPrice = fuelPrices[fuelType]?.price || marketData.commodityPrices[fuelType]?.price || 1.0;
      console.log(`💰 Using dynamic price for ${fuelType}: $${commodityPrice}/kg`);
    } catch (error) {
      console.warn('⚠️ Dynamic pricing failed, using static price:', error.message);
      commodityPrice = marketData.commodityPrices[fuelType]?.price || 1.0;
    }
    
    const commodityCost = volumeInKg * commodityPrice;

    // Get port data
    const originPort = cityDatabase[origin];
    const destinationPort = cityDatabase[destination];
    
    if (!originPort || !destinationPort) {
      return res.status(400).json({
        error: 'Invalid origin or destination port',
        availablePorts: Object.keys(cityDatabase)
      });
    }

    let totalDistance, transportationCost, mode1, mode2, legs = null;
    let realTimeData = {};
    let selectedHub = intermediateHub;
    
    // Smart hub selection if intermediate hub provided
    if (intermediateHub) {
      const hubPort = cityDatabase[intermediateHub];
      if (!hubPort) {
        return res.status(400).json({
          error: 'Invalid intermediate hub',
          availablePorts: Object.keys(cityDatabase)
        });
      }
      
      // If manual mode, validate the hub makes geographical sense
      if (optimizationMode === 'manual') {
        const originCoords = originPort.coords;
        const destCoords = destinationPort.coords;
        const hubCoords = hubPort.coords;
        
        // Check if hub is geographically reasonable
        const directDistance = calculateModeDistance(origin, destination, transportMode1 || 'truck');
        const viaHubDistance = calculateModeDistance(origin, intermediateHub, transportMode1 || 'truck') + 
                              calculateModeDistance(intermediateHub, destination, transportMode2 || 'truck');
        
        // If hub adds more than 100% to distance, suggest better hub
        if (viaHubDistance > directDistance * 2) {
          const suggestedHub = selectOptimalHub(origin, destination, transportMode1 || 'truck', transportMode2 || 'truck');
          return res.status(400).json({
            error: 'Inefficient routing detected',
            message: `Routing via ${intermediateHub} would add ${Math.round(((viaHubDistance - directDistance) / directDistance) * 100)}% to the journey`,
            suggestedHub: suggestedHub,
            directDistance: Math.round(directDistance),
            viaHubDistance: Math.round(viaHubDistance)
          });
        }
      }
    }
    
    try {
      if (selectedHub) {
        const hubPort = cityDatabase[selectedHub];
        // Multi-leg calculation with real-time APIs
        mode1 = optimizationMode === 'manual' ? transportMode1 : 
                optimizeTransportMode(origin, selectedHub, volumeInTonnes, optimizationMode);
        mode2 = optimizationMode === 'manual' ? transportMode2 : 
                optimizeTransportMode(selectedHub, destination, volumeInTonnes, optimizationMode);
        
        // Get real-time data for leg 1
        let leg1Data;
        switch (mode1) {
          case 'truck':
            leg1Data = await transportationAPI.getTruckRouting(originPort, hubPort, fuelType, volumeInTonnes);
            break;
          case 'rail':
            leg1Data = await transportationAPI.getRailRouting(originPort, hubPort, fuelType, volumeInTonnes);
            break;
          case 'ship':
            leg1Data = await transportationAPI.getShipRouting(originPort, hubPort, fuelType, volumeInTonnes);
            break;
          case 'pipeline':
            leg1Data = await transportationAPI.getPipelineRouting(originPort, hubPort, fuelType, volumeInTonnes);
            break;
          default:
            leg1Data = { distance: 250, rate: 2.5, source: 'fallback' };
        }

        // Get real-time data for leg 2
        let leg2Data;
        switch (mode2) {
          case 'truck':
            leg2Data = await transportationAPI.getTruckRouting(hubPort, destinationPort, fuelType, volumeInTonnes);
            break;
          case 'rail':
            leg2Data = await transportationAPI.getRailRouting(hubPort, destinationPort, fuelType, volumeInTonnes);
            break;
          case 'ship':
            leg2Data = await transportationAPI.getShipRouting(hubPort, destinationPort, fuelType, volumeInTonnes);
            break;
          case 'pipeline':
            leg2Data = await transportationAPI.getPipelineRouting(hubPort, destinationPort, fuelType, volumeInTonnes);
            break;
          default:
            leg2Data = { distance: 150, rate: 2.5, source: 'fallback' };
        }

        const distance1 = leg1Data.distance;
        const distance2 = leg2Data.distance;
        totalDistance = distance1 + distance2;
        
        const cost1 = distance1 * leg1Data.rate * volumeInTonnes;
        const cost2 = distance2 * leg2Data.rate * volumeInTonnes;
        transportationCost = cost1 + cost2;
        
        // Calculate truck requirements for each leg
        const leg1TruckInfo = mode1 === 'truck' ? calculateTrucksNeeded(fuelType, fuelState, volumeInTonnes) : null;
        const leg2TruckInfo = mode2 === 'truck' ? calculateTrucksNeeded(fuelType, fuelState, volumeInTonnes) : null;

        legs = {
          leg1: { 
            distance: distance1, 
            mode: mode1, 
            cost: cost1, 
            apiSource: leg1Data.source,
            duration: leg1Data.duration || leg1Data.transitTime,
            truckInfo: leg1TruckInfo
          },
          leg2: { 
            distance: distance2, 
            mode: mode2, 
            cost: cost2, 
            apiSource: leg2Data.source,
            duration: leg2Data.duration || leg2Data.transitTime,
            truckInfo: leg2TruckInfo
          }
        };
        
        realTimeData = {
          leg1API: leg1Data.source,
          leg2API: leg2Data.source,
          fuelSurcharge: (leg1Data.fuelSurcharge || 0) + (leg2Data.fuelSurcharge || 0),
          hazmatFees: (leg1Data.hazmatFee || 0) + (leg2Data.hazmatFee || 0),
          portFees: (leg1Data.portFees || 0) + (leg2Data.portFees || 0)
        };
        
        console.log('🛣️  Multi-leg route calculated with real-time data:', legs);
      } else {
        // Single leg calculation with real-time APIs
        mode1 = optimizationMode === 'manual' ? transportMode1 : 
                optimizeTransportMode(origin, destination, volumeInTonnes, optimizationMode);
        
        let routeData;
        switch (mode1) {
          case 'truck':
            routeData = await transportationAPI.getTruckRouting(originPort, destinationPort, fuelType, volumeInTonnes);
            break;
          case 'rail':
            routeData = await transportationAPI.getRailRouting(originPort, destinationPort, fuelType, volumeInTonnes);
            break;
          case 'ship':
            routeData = await transportationAPI.getShipRouting(originPort, destinationPort, fuelType, volumeInTonnes);
            break;
          case 'pipeline':
            routeData = await transportationAPI.getPipelineRouting(originPort, destinationPort, fuelType, volumeInTonnes);
            break;
          default:
            routeData = { distance: 400, rate: 2.5, source: 'fallback' };
        }

        totalDistance = routeData.distance;
        transportationCost = totalDistance * routeData.rate * volumeInTonnes;
        
        realTimeData = {
          apiSource: routeData.source,
          fuelSurcharge: routeData.fuelSurcharge || 0,
          hazmatFees: routeData.hazmatFee || 0,
          portFees: routeData.portFees || 0
        };
        
        // Calculate truck requirements for single leg
        const singleLegTruckInfo = mode1 === 'truck' ? calculateTrucksNeeded(fuelType, fuelState, volumeInTonnes) : null;

        legs = {
          leg1: {
            distance: totalDistance,
            mode: mode1,
            cost: transportationCost,
            apiSource: routeData.source,
            rate: routeData.rate,
            truckInfo: singleLegTruckInfo
          }
        };
        console.log('[DEBUG] Single-leg calculation:', {
          mode1,
          totalDistance,
          rate: routeData.rate,
          volumeInTonnes,
          transportationCost
        });
      }
    } catch (error) {
      console.error('❌ Real-time API error, using fallback calculation:', error);
      // Fallback to basic calculation if APIs fail
      if (selectedHub) {
        const hubPort = cityDatabase[selectedHub];
        mode1 = transportMode1 || 'truck';
        mode2 = transportMode2 || 'rail';
        
        // Calculate actual distances using our function
        const distance1 = calculateModeDistance(origin, selectedHub, mode1);
        const distance2 = calculateModeDistance(selectedHub, destination, mode2);
        totalDistance = distance1 + distance2;
        
        // Use market rates with minimum costs
        const rate1 = marketData.transportRates[mode1]?.rate || 2.5;
        const rate2 = marketData.transportRates[mode2]?.rate || 2.5;
        const minCost1 = marketData.transportRates[mode1]?.minCost || 500;
        const minCost2 = marketData.transportRates[mode2]?.minCost || 500;
        
        const cost1 = Math.max(distance1 * rate1 * volumeInTonnes, minCost1);
        const cost2 = Math.max(distance2 * rate2 * volumeInTonnes, minCost2);
        transportationCost = cost1 + cost2;
        
        // Calculate truck requirements for fallback multi-leg
        const fallbackLeg1TruckInfo = mode1 === 'truck' ? calculateTrucksNeeded(fuelType, fuelState, volumeInTonnes) : null;
        const fallbackLeg2TruckInfo = mode2 === 'truck' ? calculateTrucksNeeded(fuelType, fuelState, volumeInTonnes) : null;

        legs = {
          leg1: { 
            distance: distance1, 
            mode: mode1, 
            cost: cost1, 
            apiSource: 'fallback-calculated',
            rate: rate1,
            truckInfo: fallbackLeg1TruckInfo
          },
          leg2: { 
            distance: distance2, 
            mode: mode2, 
            cost: cost2, 
            apiSource: 'fallback-calculated',
            rate: rate2,
            truckInfo: fallbackLeg2TruckInfo
          }
        };
      } else {
        mode1 = transportMode1 || 'truck';
        totalDistance = calculateModeDistance(origin, destination, mode1);
        
        const rate = marketData.transportRates[mode1]?.rate || 2.5;
        const minCost = marketData.transportRates[mode1]?.minCost || 500;
        transportationCost = Math.max(totalDistance * rate * volumeInTonnes, minCost);
        
        // Calculate truck requirements for fallback single leg
        const fallbackSingleTruckInfo = mode1 === 'truck' ? calculateTrucksNeeded(fuelType, fuelState, volumeInTonnes) : null;
        
        legs = {
          leg1: {
            distance: totalDistance,
            mode: mode1,
            cost: transportationCost,
            apiSource: 'fallback-calculated',
            rate: rate,
            truckInfo: fallbackSingleTruckInfo
          }
        };
      }
      realTimeData = { apiSource: 'fallback-calculated', error: error.message };
    }

    // Additional costs
    const fuelHandlingFee = volumeInTonnes * 75;
    const terminalFees = legs ? 650 : 400;
    const hubTransferFee = legs ? volumeInTonnes * 45 : 0;
    const insuranceCost = (commodityCost + transportationCost) * 0.03;
    const carbonOffset = volumeInTonnes * 12;
    const regulatoryFees = volumeInTonnes * 25;
    
    // Add real-time surcharges
    const fuelSurcharge = realTimeData.fuelSurcharge || 0;
    const hazmatFees = realTimeData.hazmatFees || 0;
    const portFees = realTimeData.portFees || 0;
    
    const totalTransportCost = transportationCost + fuelHandlingFee + terminalFees + 
                               hubTransferFee + insuranceCost + carbonOffset + regulatoryFees +
                               fuelSurcharge + hazmatFees + portFees;
    const allInCost = commodityCost + totalTransportCost;
    
    // Compose route summary for AI
    const routeSummary = `Origin: ${origin}, Destination: ${destination}, Mode: ${transportMode1 || mode1}, Volume: ${volume} ${volumeUnit}`;
    let aiAdvice = '';
    try {
      aiAdvice = await getRouteAdvice(routeSummary);
    } catch (e) {
      aiAdvice = 'AI advice unavailable.';
    }

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
      hub: selectedHub,
      
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
        fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
        hazmatFees: Math.round(hazmatFees * 100) / 100,
        portFees: Math.round(portFees * 100) / 100,
        // Backward compatibility
        fuelHandlingFee: Math.round(fuelHandlingFee * 100) / 100,
        terminalFees: Math.round(terminalFees * 100) / 100,
        hubTransferFee: Math.round(hubTransferFee * 100) / 100,
        carbonOffset: Math.round(carbonOffset * 100) / 100
      },
      
      // Real-time data info
      realTimeData: {
        ...realTimeData,
        lastUpdated: new Date(),
        confidence: realTimeData.apiSource === 'fallback' ? 70 : 90
      },
      
      // Metadata
      confidence: realTimeData.apiSource === 'fallback' ? 70 : 90,
      optimizationMode,
      marketConditions: {
        commodityPrice: commodityPrice,
        fuelTrend: fuelPrices?.[fuelType]?.trend || marketData.commodityPrices[fuelType]?.trend || 'stable',
        priceSource: fuelPrices ? 'dynamic-api' : 'static-fallback'
      },
      marketInsights: {
        fuelTrend: fuelPrices?.[fuelType]?.trend || marketData.commodityPrices[fuelType]?.trend || 'stable',
        recommendation: fuelPrices ? 
          "Transportation costs calculated using real-time dynamic pricing and APIs for maximum accuracy." :
          "Transportation costs calculated using static pricing. Dynamic pricing temporarily unavailable."
      },
      timestamp: new Date(),
      aiAdvice: aiAdvice
    };

    console.log('✅ Final response data:', responseData);

    // Enhanced route object for database
    const routeData = {
      ...req.body,
      calculatedCost: allInCost,
      commodityCost,
      transportationCost,
      distance: totalDistance,
      optimizedModes: { mode1, mode2 },
      confidence: realTimeData.apiSource === 'fallback' ? 70 : 90,
      realTimeData: realTimeData
    };
    
    // Handle single-leg journeys - don't set transportMode2 field at all
    if (!selectedHub) {
      delete routeData.transportMode2;
      routeData.intermediateHub = undefined;
    }
    
    // Ensure transportMode1 is set
    if (!routeData.transportMode1) {
      routeData.transportMode1 = mode1 || 'truck';
    }
    
    // Only set transportMode2 if there's actually a second leg
    if (selectedHub && mode2) {
      routeData.transportMode2 = mode2;
    } else if (!selectedHub) {
      // Ensure transportMode2 is not set for single-leg journeys
      delete routeData.transportMode2;
    }
    
    const route = new Route(routeData);

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

// Get real-time transportation rates
const getTransportRates = async (req, res) => {
  try {
    const { origin, destination, fuelType, volume, transportMode } = req.query;
    
    const originPort = cityDatabase[origin];
    const destinationPort = cityDatabase[destination];
    
    if (!originPort || !destinationPort) {
      return res.status(400).json({ 
        error: 'Invalid origin or destination port',
        availablePorts: Object.keys(cityDatabase)
      });
    }

    let transportData;
    
    // Call appropriate real-time API based on transport mode
    switch (transportMode) {
      case 'truck':
        transportData = await transportationAPI.getTruckRouting(originPort, destinationPort, fuelType, parseFloat(volume));
        break;
      case 'rail':
        transportData = await transportationAPI.getRailRouting(originPort, destinationPort, fuelType, parseFloat(volume));
        break;
      case 'ship':
        transportData = await transportationAPI.getShipRouting(originPort, destinationPort, fuelType, parseFloat(volume));
        break;
      case 'pipeline':
        transportData = await transportationAPI.getPipelineRouting(originPort, destinationPort, fuelType, parseFloat(volume));
        break;
      default:
        return res.status(400).json({ error: 'Invalid transport mode' });
    }

    res.json({
      success: true,
      data: transportData
    });

  } catch (error) {
    console.error('❌ Transport rates error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transport rates', 
      details: error.message 
    });
  }
};

// New endpoint to suggest optimal hubs
const suggestOptimalHub = async (req, res) => {
  try {
    const { origin, destination, transportMode1 = 'truck', transportMode2 = 'truck' } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Origin and destination are required',
        required: ['origin', 'destination']
      });
    }
    
    const originPort = cityDatabase[origin];
    const destinationPort = cityDatabase[destination];
    
    if (!originPort || !destinationPort) {
      return res.status(400).json({
        error: 'Invalid origin or destination port',
        availablePorts: Object.keys(cityDatabase)
      });
    }
    
    const optimalHub = selectOptimalHub(origin, destination, transportMode1, transportMode2);
    
    if (!optimalHub) {
      return res.json({
        success: false,
        message: 'No suitable hub found',
        suggestion: 'Consider direct routing or different transport modes'
      });
    }
    
    // Calculate distances and efficiency
    const directDistance = calculateModeDistance(origin, destination, transportMode1);
    const leg1Distance = calculateModeDistance(origin, optimalHub, transportMode1);
    const leg2Distance = calculateModeDistance(optimalHub, destination, transportMode2);
    const totalViaHub = leg1Distance + leg2Distance;
    
    const efficiency = ((totalViaHub - directDistance) / directDistance) * 100;
    
    res.json({
      success: true,
      optimalHub,
      hubDetails: cityDatabase[optimalHub],
      routeAnalysis: {
        directDistance: Math.round(directDistance),
        viaHubDistance: Math.round(totalViaHub),
        leg1Distance: Math.round(leg1Distance),
        leg2Distance: Math.round(leg2Distance),
        efficiencyImpact: `${efficiency > 0 ? '+' : ''}${Math.round(efficiency)}%`
      },
      recommendation: efficiency <= 20 ? 'Efficient routing' : 'Consider direct routing'
    });
    
  } catch (error) {
    console.error('❌ Hub suggestion error:', error);
    res.status(500).json({
      error: 'Hub suggestion failed',
      message: error.message
    });
  }
};

module.exports = {
  calculateCost,
  getRouteHistory,
  getMarketData,
  getTransportRates,
  suggestOptimalHub
};