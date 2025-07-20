// FREE Transportation APIs - No Credit Card Required
const axios = require('axios');
const SimpleFuelPriceService = require('./simpleFuelPriceService');

// Import searoute for maritime routing
let searoute;
try {
  searoute = require('searoute');
} catch (error) {
  console.warn('searoute package not found. Please install with: npm install searoute');
  searoute = null;
}

class FreeTransportationAPIService {
  constructor() {
    this.apiKeys = {
      openRouteService: process.env.OPENROUTE_SERVICE_KEY,
      graphHopper: process.env.GRAPHHOPPER_API_KEY,
      eia: process.env.EIA_API_KEY,
      googleMaps: process.env.GOOGLE_MAPS_API_KEY,
      searoutes: process.env.SEAROUTES_API_KEY
    };
    
    // Initialize fuel price service
    this.fuelPriceService = new SimpleFuelPriceService();
  }

  // TRUCK TRANSPORTATION - Using OpenRouteService (FREE)
  async getTruckRouting(origin, destination, fuelType, volume) {
    try {
      // Primary: OpenRouteService (2,000 requests/day - FREE)
      const response = await axios.post('https://api.openrouteservice.org/v2/directions/driving-hgv/json', {
        coordinates: [
          [origin.coords[1], origin.coords[0]], // lon, lat
          [destination.coords[1], destination.coords[0]]
        ],
        profile: 'driving-hgv', // Heavy goods vehicle
        format: 'json',
        instructions: false,
        geometry: true
      }, {
        headers: {
          'Authorization': this.apiKeys.openRouteService,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const distance = Math.round(route.summary.distance * 0.000621371); // Convert to miles
        const duration = Math.round(route.summary.duration / 60); // Convert to minutes
        
        // Get real-time fuel pricing
        const fuelEfficiency = this.fuelPriceService.getFuelEfficiency('truck', fuelType);
        const fuelCost = this.fuelPriceService.calculateFuelCost(distance, fuelType, volume, fuelEfficiency);
        
        return {
          success: true,
          distance: distance,
          duration: duration,
          rate: this.calculateTruckRate(distance, fuelType, volume),
          fuelSurcharge: this.calculateFuelSurcharge(distance, volume),
          hazmatFee: this.getHazmatFee(fuelType, volume),
          fuelCost: fuelCost.fuelCost,
          fuelPrice: fuelCost.fuelPrice,
          fuelNeeded: fuelCost.fuelNeeded,
          totalCost: this.calculateTotalCost(distance, fuelType, volume, fuelCost.fuelCost),
          source: 'openroute-service',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('OpenRouteService error:', error.message);
    }

    // Fallback: GraphHopper (1,000 requests/day - FREE)
    try {
      const response = await axios.get('https://graphhopper.com/api/1/route', {
        params: {
          point: `${origin.coords[0]},${origin.coords[1]}`,
          point: `${destination.coords[0]},${destination.coords[1]}`,
          vehicle: 'truck',
          locale: 'en',
          calc_points: false,
          key: this.apiKeys.graphHopper
        },
        timeout: 10000
      });

      if (response.data.paths && response.data.paths.length > 0) {
        const path = response.data.paths[0];
        const distance = Math.round(path.distance * 0.000621371); // Convert to miles
        const duration = Math.round(path.time / 60000); // Convert to minutes
        
        return {
          success: true,
          distance: distance,
          duration: duration,
          rate: this.calculateTruckRate(distance, fuelType, volume),
          fuelSurcharge: this.calculateFuelSurcharge(distance, volume),
          hazmatFee: this.getHazmatFee(fuelType, volume),
          source: 'graphhopper',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('GraphHopper error:', error.message);
    }

    // Final fallback: Google Maps (if available)
    if (this.apiKeys.googleMaps) {
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
          params: {
            origin: `${origin.coords[0]},${origin.coords[1]}`,
            destination: `${destination.coords[0]},${destination.coords[1]}`,
            mode: 'driving',
            key: this.apiKeys.googleMaps
          },
          timeout: 10000
        });

        if (response.data.routes && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          const leg = route.legs[0];
          
          return {
            success: true,
            distance: this.parseDistance(leg.distance.text),
            duration: this.parseDuration(leg.duration.text),
            rate: this.calculateTruckRate(this.parseDistance(leg.distance.text), fuelType, volume),
            fuelSurcharge: this.calculateFuelSurcharge(this.parseDistance(leg.distance.text), volume),
            hazmatFee: this.getHazmatFee(fuelType, volume),
            source: 'google-maps',
            timestamp: new Date()
          };
        }
      } catch (error) {
        console.error('Google Maps error:', error.message);
      }
    }

    // Mathematical fallback
    return this.calculateFallbackRoute(origin, destination, 'truck', fuelType, volume);
  }

  // RAIL TRANSPORTATION - Using free rail data
  async getRailRouting(origin, destination, fuelType, volume) {
    try {
      // Use OpenRouteService with public transport profile
      const response = await axios.post('https://api.openrouteservice.org/v2/directions/driving-car/json', {
        coordinates: [
          [origin.coords[1], origin.coords[0]],
          [destination.coords[1], destination.coords[0]]
        ],
        profile: 'driving-car', // Use car routing as approximation
        format: 'json'
      }, {
        headers: {
          'Authorization': this.apiKeys.openRouteService,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const distance = Math.round(route.summary.distance * 0.000621371 * 1.15); // Rail routing factor
        const duration = Math.round(route.summary.duration / 60 * 2); // Rail is slower
        
        return {
          success: true,
          distance: distance,
          transitTime: duration,
          rate: this.calculateRailRate(distance, fuelType, volume),
          fuelSurcharge: this.calculateFuelSurcharge(distance, volume) * 0.5,
          hazmatFee: this.getHazmatFee(fuelType, volume),
          source: 'openroute-rail-estimate',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Rail routing error:', error.message);
    }

    return this.calculateRailFallback(origin, destination, fuelType, volume);
  }

  // SHIP TRANSPORTATION - Using searoute library and real-time pricing
  async getShipRouting(origin, destination, fuelType, volume) {
    let distance;
    let routeSource = 'great-circle-maritime';
    
    // Try searoute library first
    if (searoute) {
      try {
        const route = searoute(origin.coords, destination.coords, {
          units: 'miles'
        });
        
        if (route && route.properties && route.properties.length_km) {
          distance = Math.round(route.properties.length_km * 0.621371); // Convert km to miles
          routeSource = 'searoute-library';
        }
      } catch (error) {
        console.error('Searoute library error:', error.message);
      }
    }
    
    // Fallback to great circle distance if searoute fails
    if (!distance) {
      distance = this.calculateDistance(origin.coords, destination.coords) * 1.25; // Maritime routing factor
    }
    
    // Get real-time fuel pricing
    const fuelEfficiency = this.fuelPriceService.getFuelEfficiency('ship', fuelType);
    const fuelCost = this.fuelPriceService.calculateFuelCost(distance, fuelType, volume, fuelEfficiency);
    
    return {
      success: true,
      distance: Math.round(distance),
      transitTime: Math.round(distance / 20), // 20 mph average
      rate: this.calculateShipRate(distance, fuelType, volume),
      fuelSurcharge: this.calculateFuelSurcharge(distance, volume) * 0.3,
      portFees: this.getPortFees(origin, destination, fuelType, volume),
      hazmatFee: this.getHazmatFee(fuelType, volume),
      fuelCost: fuelCost.fuelCost,
      fuelPrice: fuelCost.fuelPrice,
      fuelNeeded: fuelCost.fuelNeeded,
      totalCost: this.calculateTotalCost(distance, fuelType, volume, fuelCost.fuelCost),
      source: routeSource,
      timestamp: new Date()
    };
  }

  // PIPELINE TRANSPORTATION - Using EIA API (FREE)
  async getPipelineRouting(origin, destination, fuelType, volume) {
    try {
      // EIA API is completely free
      const response = await axios.get('https://api.eia.gov/v2/petroleum/move/pipeall/data', {
        params: {
          'api_key': this.apiKeys.eia,
          'data[0]': 'value',
          'facets[product][]': this.mapFuelToPipelineProduct(fuelType),
          'sort[0][column]': 'period',
          'sort[0][direction]': 'desc',
          'offset': 0,
          'length': 100
        },
        timeout: 15000
      });

      if (response.data.response && response.data.response.data) {
        const distance = this.calculateDistance(origin.coords, destination.coords) * 1.1;
        
        return {
          success: true,
          distance: Math.round(distance),
          capacity: this.getPipelineCapacity(fuelType),
          rate: this.calculatePipelineRate(distance, fuelType, volume),
          throughput: Math.min(volume, 10000),
          availability: 0.95,
          regulatoryFees: this.getPipelineRegulatoryFees(fuelType, volume),
          source: 'eia-pipeline',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('EIA Pipeline error:', error.message);
    }

    return this.calculatePipelineFallback(origin, destination, fuelType, volume);
  }

  // RATE CALCULATION METHODS
  calculateTruckRate(distance, fuelType, volume) {
    const baseRate = 2.8; // $/mile/ton
    const hazmatMultiplier = this.getHazmatMultiplier(fuelType);
    const volumeDiscount = Math.max(0.8, 1 - (volume / 10000)); // Volume discount
    
    return baseRate * hazmatMultiplier * volumeDiscount;
  }

  calculateRailRate(distance, fuelType, volume) {
    const baseRate = 1.1; // $/mile/ton
    const hazmatMultiplier = this.getHazmatMultiplier(fuelType);
    const volumeDiscount = Math.max(0.7, 1 - (volume / 20000));
    
    return baseRate * hazmatMultiplier * volumeDiscount;
  }

  calculateShipRate(distance, fuelType, volume) {
    const baseRate = 0.65; // $/mile/ton
    const hazmatMultiplier = this.getHazmatMultiplier(fuelType);
    const volumeDiscount = Math.max(0.6, 1 - (volume / 50000));
    
    return baseRate * hazmatMultiplier * volumeDiscount;
  }

  calculatePipelineRate(distance, fuelType, volume) {
    const baseRate = 0.4; // $/mile/ton
    const throughputFactor = Math.min(1.2, 1 + (volume / 100000));
    
    return baseRate * throughputFactor;
  }

  calculateFuelSurcharge(distance, volume) {
    return distance * volume * 0.02; // 2 cents per mile per ton
  }

  getHazmatFee(fuelType, volume) {
    const baseFee = 100;
    const volumeMultiplier = Math.log10(volume + 1);
    const fuelMultiplier = {
      'hydrogen': 2.0,
      'methanol': 1.5,
      'ammonia': 1.8
    };
    
    return baseFee * volumeMultiplier * (fuelMultiplier[fuelType] || 1.0);
  }

  getHazmatMultiplier(fuelType) {
    const multipliers = {
      'hydrogen': 1.4,
      'methanol': 1.2,
      'ammonia': 1.3
    };
    return multipliers[fuelType] || 1.0;
  }

  getPortFees(origin, destination, fuelType, volume) {
    const baseFee = 300;
    const volumeFactor = Math.min(volume / 1000, 5);
    const hazmatFactor = this.getHazmatMultiplier(fuelType);
    
    return baseFee * volumeFactor * hazmatFactor;
  }

  getPipelineCapacity(fuelType) {
    const capacities = {
      'hydrogen': 5000,
      'methanol': 15000,
      'ammonia': 10000
    };
    return capacities[fuelType] || 8000;
  }

  getPipelineRegulatoryFees(fuelType, volume) {
    return volume * 0.03; // $0.03 per ton
  }

  mapFuelToPipelineProduct(fuelType) {
    const mapping = {
      'hydrogen': 'natural_gas',
      'methanol': 'refined_products',
      'ammonia': 'natural_gas_liquids'
    };
    return mapping[fuelType] || 'refined_products';
  }

  // UTILITY METHODS
  parseDistance(distanceText) {
    const match = distanceText.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(',', '')) : 0;
  }

  parseDuration(durationText) {
    const hours = durationText.match(/(\d+)\s*hour/);
    const minutes = durationText.match(/(\d+)\s*min/);
    return (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);
  }

  calculateDistance(coords1, coords2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  // FALLBACK METHODS
  calculateFallbackRoute(origin, destination, mode, fuelType, volume) {
    const distance = this.calculateDistance(origin.coords, destination.coords);
    const rates = {
      'truck': this.calculateTruckRate(distance, fuelType, volume),
      'rail': this.calculateRailRate(distance, fuelType, volume),
      'ship': this.calculateShipRate(distance, fuelType, volume),
      'pipeline': this.calculatePipelineRate(distance, fuelType, volume)
    };
    
    return {
      success: true,
      distance: Math.round(distance),
      rate: rates[mode],
      fuelSurcharge: this.calculateFuelSurcharge(distance, volume),
      hazmatFee: this.getHazmatFee(fuelType, volume),
      source: 'mathematical-fallback',
      timestamp: new Date()
    };
  }

  calculateRailFallback(origin, destination, fuelType, volume) {
    const distance = this.calculateDistance(origin.coords, destination.coords) * 1.15;
    
    return {
      success: true,
      distance: Math.round(distance),
      rate: this.calculateRailRate(distance, fuelType, volume),
      transitTime: Math.round(distance / 40),
      fuelSurcharge: this.calculateFuelSurcharge(distance, volume),
      hazmatFee: this.getHazmatFee(fuelType, volume),
      source: 'rail-fallback',
      timestamp: new Date()
    };
  }

  calculatePipelineFallback(origin, destination, fuelType, volume) {
    const distance = this.calculateDistance(origin.coords, destination.coords) * 1.05;
    
    return {
      success: true,
      distance: Math.round(distance),
      rate: this.calculatePipelineRate(distance, fuelType, volume),
      capacity: this.getPipelineCapacity(fuelType),
      availability: 0.9,
      source: 'pipeline-fallback',
      timestamp: new Date()
    };
  }

  // Calculate total transportation cost
  calculateTotalCost(distance, fuelType, volume, fuelCost) {
    const baseRate = this.calculateTruckRate(distance, fuelType, volume);
    const fuelSurcharge = this.calculateFuelSurcharge(distance, volume);
    const hazmatFee = this.getHazmatFee(fuelType, volume);
    
    return {
      baseCost: baseRate * distance * volume,
      fuelCost: fuelCost,
      fuelSurcharge: fuelSurcharge,
      hazmatFee: hazmatFee,
      totalCost: (baseRate * distance * volume) + fuelCost + fuelSurcharge + hazmatFee
    };
  }

  // Enhanced rail routing with fuel pricing
  async getEnhancedRailRouting(origin, destination, fuelType, volume) {
    const railResult = await this.getRailRouting(origin, destination, fuelType, volume);
    
    if (railResult.success) {
      const fuelEfficiency = this.fuelPriceService.getFuelEfficiency('rail', fuelType);
      const fuelCost = this.fuelPriceService.calculateFuelCost(railResult.distance, fuelType, volume, fuelEfficiency);
      
      return {
        ...railResult,
        fuelCost: fuelCost.fuelCost,
        fuelPrice: fuelCost.fuelPrice,
        fuelNeeded: fuelCost.fuelNeeded,
        totalCost: this.calculateTotalCost(railResult.distance, fuelType, volume, fuelCost.fuelCost)
      };
    }
    
    return railResult;
  }

  // Enhanced pipeline routing with fuel pricing
  async getEnhancedPipelineRouting(origin, destination, fuelType, volume) {
    const pipelineResult = await this.getPipelineRouting(origin, destination, fuelType, volume);
    
    if (pipelineResult.success) {
      const fuelEfficiency = this.fuelPriceService.getFuelEfficiency('pipeline', fuelType);
      const fuelCost = this.fuelPriceService.calculateFuelCost(pipelineResult.distance, fuelType, volume, fuelEfficiency);
      
      return {
        ...pipelineResult,
        fuelCost: fuelCost.fuelCost,
        fuelPrice: fuelCost.fuelPrice,
        fuelNeeded: fuelCost.fuelNeeded,
        totalCost: this.calculateTotalCost(pipelineResult.distance, fuelType, volume, fuelCost.fuelCost)
      };
    }
    
    return pipelineResult;
  }
}

module.exports = new FreeTransportationAPIService();