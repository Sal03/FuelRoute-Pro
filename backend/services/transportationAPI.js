// Real-time Transportation API Integration Service
const axios = require('axios');

class TransportationAPIService {
  constructor() {
    this.apiKeys = {
      googleMaps: process.env.GOOGLE_MAPS_API_KEY,
      here: process.env.HERE_API_KEY,
      mapbox: process.env.MAPBOX_API_KEY,
      freightWaves: process.env.FREIGHTWAVES_API_KEY,
      eia: process.env.EIA_API_KEY,
      marineTraffic: process.env.MARINE_TRAFFIC_API_KEY,
      railwayAPI: process.env.RAILWAY_API_KEY
    };
  }

  // TRUCK TRANSPORTATION - Real-time routing and rates
  async getTruckRouting(origin, destination, fuelType, volume) {
    try {
      // Primary: Google Maps Directions API with truck routing
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${origin.coords[0]},${origin.coords[1]}`,
          destination: `${destination.coords[0]},${destination.coords[1]}`,
          mode: 'driving',
          avoid: 'tolls',
          units: 'imperial',
          departure_time: 'now',
          traffic_model: 'best_guess',
          key: this.apiKeys.googleMaps
        },
        timeout: 10000
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        // Get real-time trucking rates from FreightWaves API
        const rateData = await this.getTruckingRates(origin, destination, fuelType, volume);
        
        return {
          success: true,
          distance: this.parseDistance(leg.distance.text),
          duration: this.parseDuration(leg.duration.text),
          trafficDuration: leg.duration_in_traffic ? this.parseDuration(leg.duration_in_traffic.text) : null,
          route: route.overview_polyline.points,
          rate: rateData.rate,
          fuelSurcharge: rateData.fuelSurcharge,
          hazmatFee: this.getHazmatFee(fuelType, volume),
          congestionFactor: this.calculateCongestionFactor(leg.duration, leg.duration_in_traffic),
          source: 'google-maps',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Google Maps API error:', error.message);
    }

    // Fallback: HERE API
    try {
      const response = await axios.get('https://route.ls.hereapi.com/routing/7.2/calculateroute.json', {
        params: {
          waypoint0: `${origin.coords[0]},${origin.coords[1]}`,
          waypoint1: `${destination.coords[0]},${destination.coords[1]}`,
          mode: 'fastest;truck;traffic:enabled',
          departure: 'now',
          apikey: this.apiKeys.here
        },
        timeout: 10000
      });

      if (response.data.response && response.data.response.route) {
        const route = response.data.response.route[0];
        const distance = route.summary.distance * 0.000621371; // Convert to miles
        
        return {
          success: true,
          distance: Math.round(distance),
          duration: Math.round(route.summary.travelTime / 60), // Convert to minutes
          rate: this.calculateFallbackTruckRate(distance, fuelType),
          source: 'here-api',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('HERE API error:', error.message);
    }

    // Final fallback: Haversine calculation
    const fallbackData = this.calculateFallbackRoute(origin, destination, 'truck', fuelType, volume);
    console.log('🚛 Truck routing fallback data:', fallbackData);
    return fallbackData;
  }

  // RAIL TRANSPORTATION - Real-time rail network routing
  async getRailRouting(origin, destination, fuelType, volume) {
    try {
      // Primary: Rail network API (using OpenRailwayMap or similar)
      const response = await axios.post('https://api.openrailwaymap.org/route', {
        from: { lat: origin.coords[0], lon: origin.coords[1] },
        to: { lat: destination.coords[0], lon: destination.coords[1] },
        transport: 'rail',
        cargo_type: this.mapFuelToCargoType(fuelType)
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.railwayAPI}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.success) {
        const railRates = await this.getRailRates(origin, destination, fuelType, volume);
        
        return {
          success: true,
          distance: response.data.distance,
          transitTime: response.data.transit_time,
          route: response.data.route,
          rate: railRates.rate,
          fuelSurcharge: railRates.fuelSurcharge,
          hazmatFee: this.getHazmatFee(fuelType, volume),
          railNetwork: response.data.network,
          source: 'rail-network-api',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Rail API error:', error.message);
    }

    // Fallback: AAR (Association of American Railroads) estimation
    return this.calculateRailFallback(origin, destination, fuelType, volume);
  }

  // SHIP TRANSPORTATION - Real-time maritime routing
  async getShipRouting(origin, destination, fuelType, volume) {
    try {
      // Primary: MarineTraffic API for maritime routing
      const response = await axios.get('https://services.marinetraffic.com/api/voyage/v:1/routeexception', {
        params: {
          from_port: origin.portCode,
          to_port: destination.portCode,
          vessel_type: this.getVesselType(fuelType, volume),
          msgtype: 'extended'
        },
        headers: {
          'X-API-Key': this.apiKeys.marineTraffic
        },
        timeout: 15000
      });

      if (response.data && response.data.length > 0) {
        const route = response.data[0];
        const shippingRates = await this.getShippingRates(origin, destination, fuelType, volume);
        
        return {
          success: true,
          distance: route.DISTANCE,
          transitTime: route.DURATION,
          route: route.ROUTE,
          rate: shippingRates.rate,
          fuelSurcharge: shippingRates.fuelSurcharge,
          portFees: this.getPortFees(origin, destination, fuelType, volume),
          weatherDelay: route.WEATHER_DELAY || 0,
          vesselType: this.getVesselType(fuelType, volume),
          source: 'marine-traffic',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('MarineTraffic API error:', error.message);
    }

    // Fallback: Great Circle distance calculation
    return this.calculateShipFallback(origin, destination, fuelType, volume);
  }

  // PIPELINE TRANSPORTATION - Real-time pipeline network data
  async getPipelineRouting(origin, destination, fuelType, volume) {
    try {
      // Primary: EIA (Energy Information Administration) Pipeline API
      const response = await axios.get('https://api.eia.gov/v2/petroleum/move/pipeall/data', {
        params: {
          'api_key': this.apiKeys.eia,
          'data[0]': 'value',
          'facets[product][]': this.mapFuelToPipelineProduct(fuelType),
          'facets[process][]': 'pipeline',
          'sort[0][column]': 'period',
          'sort[0][direction]': 'desc',
          'offset': 0,
          'length': 5000
        },
        timeout: 15000
      });

      if (response.data.response && response.data.response.data) {
        const pipelineData = response.data.response.data;
        const pipelineRates = await this.getPipelineRates(origin, destination, fuelType, volume);
        
        return {
          success: true,
          distance: this.calculatePipelineDistance(origin, destination),
          capacity: this.getPipelineCapacity(origin, destination, fuelType),
          rate: pipelineRates.rate,
          throughput: pipelineRates.throughput,
          availability: pipelineRates.availability,
          regulatoryFees: this.getPipelineRegulatoryFees(fuelType, volume),
          networkStatus: 'operational',
          source: 'eia-pipeline',
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('EIA Pipeline API error:', error.message);
    }

    // Fallback: Pipeline network estimation
    return this.calculatePipelineFallback(origin, destination, fuelType, volume);
  }

  // HELPER METHODS FOR REAL-TIME RATES

  async getTruckingRates(origin, destination, fuelType, volume) {
    try {
      // FreightWaves SONAR API for real-time trucking rates
      const response = await axios.get('https://api.freightwaves.com/sonar/rates/truckload', {
        params: {
          origin: origin.portCode,
          destination: destination.portCode,
          equipment: this.getTruckEquipmentType(fuelType),
          date: new Date().toISOString().split('T')[0]
        },
        headers: {
          'Authorization': `Bearer ${this.apiKeys.freightWaves}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.success) {
        return {
          rate: response.data.rate,
          fuelSurcharge: response.data.fuel_surcharge,
          marketCondition: response.data.market_condition
        };
      }
    } catch (error) {
      console.error('FreightWaves API error:', error.message);
    }

    // Fallback rates
    return {
      rate: this.calculateFallbackTruckRate(0, fuelType),
      fuelSurcharge: 0.15,
      marketCondition: 'normal'
    };
  }

  async getRailRates(origin, destination, fuelType, volume) {
    // Real-time rail rates would typically come from Class I railroads
    // For now, using market-based calculations
    const baseRate = 0.04; // Per ton-mile
    const fuelSurcharge = 0.12;
    const hazmatMultiplier = this.getHazmatMultiplier(fuelType);
    
    return {
      rate: baseRate * hazmatMultiplier,
      fuelSurcharge: fuelSurcharge,
      marketCondition: 'stable'
    };
  }

  async getShippingRates(origin, destination, fuelType, volume) {
    // Baltic Dry Index and container shipping rates
    const baseRate = 0.02; // Per ton-mile
    const fuelSurcharge = 0.08;
    const hazmatMultiplier = this.getHazmatMultiplier(fuelType);
    
    return {
      rate: baseRate * hazmatMultiplier,
      fuelSurcharge: fuelSurcharge,
      marketCondition: 'volatile'
    };
  }

  async getPipelineRates(origin, destination, fuelType, volume) {
    const baseRate = 0.01; // Per ton-mile
    const throughputFactor = Math.min(1.0, volume / 1000); // Economy of scale
    
    return {
      rate: baseRate * (1 + throughputFactor),
      throughput: Math.min(volume, 10000), // Daily capacity
      availability: 0.95 // 95% availability
    };
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

  calculateCongestionFactor(normalDuration, trafficDuration) {
    if (!trafficDuration) return 1.0;
    return trafficDuration.value / normalDuration.value;
  }

  mapFuelToCargoType(fuelType) {
    const mapping = {
      'hydrogen': 'hazmat_gas',
      'methanol': 'hazmat_liquid',
      'ammonia': 'hazmat_gas'
    };
    return mapping[fuelType] || 'general';
  }

  getVesselType(fuelType, volume) {
    if (volume > 50000) return 'chemical_tanker';
    if (volume > 10000) return 'product_tanker';
    return 'container';
  }

  getTruckEquipmentType(fuelType) {
    const mapping = {
      'hydrogen': 'specialized_tank',
      'methanol': 'liquid_tank',
      'ammonia': 'pressure_tank'
    };
    return mapping[fuelType] || 'dry_van';
  }

  getHazmatFee(fuelType, volume) {
    const baseFee = 150;
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
    const baseFee = 500;
    const volumeFactor = Math.min(volume / 1000, 10);
    const hazmatFactor = this.getHazmatMultiplier(fuelType);
    
    return baseFee * volumeFactor * hazmatFactor;
  }

  getPipelineRegulatoryFees(fuelType, volume) {
    return volume * 0.05; // $0.05 per ton
  }

  calculateFallbackTruckRate(distance, fuelType) {
    const baseRate = 2.5;
    const hazmatMultiplier = this.getHazmatMultiplier(fuelType);
    return baseRate * hazmatMultiplier;
  }

  // FALLBACK CALCULATIONS

  calculateFallbackRoute(origin, destination, mode, fuelType, volume) {
    const baseDistance = this.calculateDistance(origin.coords, destination.coords);
    
    // Apply routing factors based on mode
    const routingFactors = {
      'truck': 1.25,
      'rail': 1.15,
      'ship': 1.35,
      'pipeline': 1.10
    };
    
    const distance = Math.round(baseDistance * (routingFactors[mode] || 1.2));
    
    const rates = {
      'truck': 2.80,
      'rail': 1.10,
      'ship': 0.65,
      'pipeline': 0.40
    };
    
    console.log(`🔧 Fallback route calculation: ${mode} from ${origin.portCode || 'unknown'} to ${destination.portCode || 'unknown'}`);
    console.log(`   Base distance: ${Math.round(baseDistance)} miles, Final distance: ${distance} miles`);
    console.log(`   Rate: ${rates[mode]} * ${this.getHazmatMultiplier(fuelType)} = ${rates[mode] * this.getHazmatMultiplier(fuelType)}`);
    
    return {
      success: true,
      distance: distance,
      rate: rates[mode] * this.getHazmatMultiplier(fuelType),
      source: 'fallback-calculation',
      timestamp: new Date()
    };
  }

  calculateRailFallback(origin, destination, fuelType, volume) {
    const distance = this.calculateDistance(origin.coords, destination.coords) * 1.15; // Rail routing factor
    
    return {
      success: true,
      distance: Math.round(distance),
      rate: 0.8 * this.getHazmatMultiplier(fuelType),
      transitTime: Math.round(distance / 40), // 40 mph average
      source: 'fallback-calculation',
      timestamp: new Date()
    };
  }

  calculateShipFallback(origin, destination, fuelType, volume) {
    const distance = this.calculateDistance(origin.coords, destination.coords) * 1.25; // Maritime routing factor
    
    return {
      success: true,
      distance: Math.round(distance),
      rate: 0.4 * this.getHazmatMultiplier(fuelType),
      transitTime: Math.round(distance / 20), // 20 mph average
      source: 'fallback-calculation',
      timestamp: new Date()
    };
  }

  calculatePipelineFallback(origin, destination, fuelType, volume) {
    const distance = this.calculateDistance(origin.coords, destination.coords) * 1.05; // Pipeline routing factor
    
    return {
      success: true,
      distance: Math.round(distance),
      rate: 0.2,
      availability: 0.9,
      source: 'fallback-calculation',
      timestamp: new Date()
    };
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

  calculatePipelineDistance(origin, destination) {
    // Pipeline networks don't follow great circle routes
    const directDistance = this.calculateDistance(origin.coords, destination.coords);
    return directDistance * 1.1; // 10% longer for infrastructure routing
  }

  getPipelineCapacity(origin, destination, fuelType) {
    // Mock capacity based on fuel type and route
    const capacities = {
      'hydrogen': 5000,
      'methanol': 15000,
      'ammonia': 10000
    };
    return capacities[fuelType] || 8000;
  }

  mapFuelToPipelineProduct(fuelType) {
    const mapping = {
      'hydrogen': 'natural_gas', // Hydrogen often transported in natural gas pipelines
      'methanol': 'refined_products',
      'ammonia': 'natural_gas_liquids'
    };
    return mapping[fuelType] || 'refined_products';
  }
}

module.exports = new TransportationAPIService();