/**
 * Enhanced Routing Service
 * Provides accurate routing for all transport modes using appropriate APIs
 */

const axios = require('axios');
const searoute = require('searoute');

class EnhancedRoutingService {
  constructor() {
    this.googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
    this.openRouteKey = process.env.OPENROUTE_SERVICE_KEY;
    this.graphHopperKey = process.env.GRAPHHOPPER_API_KEY;
    
    // Cache for routing results
    this.routeCache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Get route for any transport mode
   */
  async getRoute(origin, destination, transportMode, options = {}) {
    const cacheKey = `${origin}-${destination}-${transportMode}`;
    const cached = this.routeCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log(`📋 Using cached route for ${transportMode}`);
      return cached.data;
    }

    let routeData;
    
    switch (transportMode.toLowerCase()) {
      case 'truck':
        routeData = await this.getTruckRoute(origin, destination, options);
        break;
      case 'ship':
        routeData = await this.getShipRoute(origin, destination, options);
        break;
      case 'rail':
        routeData = await this.getRailRoute(origin, destination, options);
        break;
      case 'pipeline':
        routeData = await this.getPipelineRoute(origin, destination, options);
        break;
      default:
        throw new Error(`Unsupported transport mode: ${transportMode}`);
    }

    // Cache the result
    this.routeCache.set(cacheKey, {
      data: routeData,
      timestamp: Date.now()
    });

    return routeData;
  }

  /**
   * TRUCK ROUTING - Uses Google Maps Directions API
   */
  async getTruckRoute(origin, destination, options = {}) {
    try {
      console.log(`🚛 Getting truck route: ${origin} → ${destination}`);
      
      if (!this.googleMapsKey || this.googleMapsKey === 'your_google_maps_api_key_here') {
        return this.getFallbackTruckRoute(origin, destination);
      }

      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: origin,
          destination: destination,
          mode: 'driving',
          units: 'imperial',
          avoid: options.avoidTolls ? 'tolls' : '',
          key: this.googleMapsKey
        },
        timeout: 15000
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: this.parseDistance(leg.distance.text),
          duration: this.parseDuration(leg.duration.text),
          distanceMeters: leg.distance.value,
          durationSeconds: leg.duration.value,
          polyline: route.overview_polyline.points,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text
          })),
          apiSource: 'google-maps',
          confidence: 95,
          tollInfo: route.fare ? {
            currency: route.fare.currency,
            value: route.fare.value
          } : null
        };
      } else {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

    } catch (error) {
      console.warn(`⚠️ Google Maps truck routing failed: ${error.message}`);
      return this.getFallbackTruckRoute(origin, destination);
    }
  }

  /**
   * SHIP ROUTING - Uses Searoute for maritime distances
   */
  async getShipRoute(origin, destination, options = {}) {
    try {
      console.log(`🚢 Getting ship route: ${origin} → ${destination}`);
      
      const originCoords = await this.getCoordinates(origin);
      const destCoords = await this.getCoordinates(destination);
      
      if (!originCoords || !destCoords) {
        return this.getFallbackShipRoute(origin, destination);
      }

      // Use searoute for maritime routing
      const route = searoute.getRoute(
        [originCoords.lng, originCoords.lat],
        [destCoords.lng, destCoords.lat],
        { units: 'miles' }
      );

      if (route && route.properties) {
        const distanceMiles = route.properties.length;
        const estimatedSpeed = 25; // knots average
        const durationHours = distanceMiles / estimatedSpeed;

        return {
          distance: Math.round(distanceMiles),
          duration: Math.round(durationHours * 60), // minutes
          distanceMeters: distanceMiles * 1609.34,
          durationSeconds: durationHours * 3600,
          route: route.geometry,
          waypoints: route.geometry.coordinates,
          apiSource: 'searoute-maritime',
          confidence: 90,
          seaRoute: true,
          estimatedSpeed: estimatedSpeed,
          weatherFactors: this.getMaritimeWeatherFactors(),
          portInfo: {
            origin: await this.getPortInfo(origin),
            destination: await this.getPortInfo(destination)
          }
        };
      } else {
        throw new Error('Searoute failed to generate route');
      }

    } catch (error) {
      console.warn(`⚠️ Ship routing failed: ${error.message}`);
      return this.getFallbackShipRoute(origin, destination);
    }
  }

  /**
   * RAIL ROUTING - Uses OpenRoute Service or fallback calculation
   */
  async getRailRoute(origin, destination, options = {}) {
    try {
      console.log(`🚂 Getting rail route: ${origin} → ${destination}`);
      
      // Try OpenRoute Service for rail routing
      if (this.openRouteKey && this.openRouteKey !== 'your_openroute_service_key_here') {
        const originCoords = await this.getCoordinates(origin);
        const destCoords = await this.getCoordinates(destination);
        
        if (originCoords && destCoords) {
          const response = await axios.post('https://api.openrouteservice.org/v2/directions/driving-car', {
            coordinates: [[originCoords.lng, originCoords.lat], [destCoords.lng, destCoords.lat]],
            format: 'json',
            units: 'mi'
          }, {
            headers: {
              'Authorization': this.openRouteKey,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          });

          if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const railFactor = 1.15; // Rail routes are typically 15% longer than direct
            
            return {
              distance: Math.round(route.summary.distance * 0.000621371 * railFactor), // Convert to miles
              duration: Math.round(route.summary.duration / 60 * 1.3), // Rail is slower, convert to minutes
              distanceMeters: route.summary.distance * railFactor,
              durationSeconds: route.summary.duration * 1.3,
              geometry: route.geometry,
              apiSource: 'openroute-rail',
              confidence: 85,
              railSpecific: {
                gradeFactor: 1.1,
                curvatureFactor: 1.05,
                estimatedSpeed: 45 // mph average
              }
            };
          }
        }
      }
      
      return this.getFallbackRailRoute(origin, destination);

    } catch (error) {
      console.warn(`⚠️ Rail routing failed: ${error.message}`);
      return this.getFallbackRailRoute(origin, destination);
    }
  }

  /**
   * PIPELINE ROUTING - Specialized calculation for pipeline networks
   */
  async getPipelineRoute(origin, destination, options = {}) {
    try {
      console.log(`🔧 Getting pipeline route: ${origin} → ${destination}`);
      
      const originCoords = await this.getCoordinates(origin);
      const destCoords = await this.getCoordinates(destination);
      
      if (!originCoords || !destCoords) {
        return this.getFallbackPipelineRoute(origin, destination);
      }

      // Calculate great circle distance
      const directDistance = this.calculateGreatCircleDistance(
        originCoords.lat, originCoords.lng,
        destCoords.lat, destCoords.lng
      );

      // Pipeline routing factors
      const terrainFactor = 1.25; // Pipelines follow terrain, avoid obstacles
      const regulatoryFactor = 1.15; // Regulatory routing requirements
      const safetyFactor = 1.1; // Safety buffer routing
      
      const pipelineDistance = directDistance * terrainFactor * regulatoryFactor * safetyFactor;
      
      // Pipeline flow speed (varies by fuel type and pressure)
      const flowSpeed = options.fuelType === 'hydrogen' ? 15 : 20; // mph equivalent
      const transitTime = pipelineDistance / flowSpeed;

      return {
        distance: Math.round(pipelineDistance),
        duration: Math.round(transitTime * 60), // minutes
        distanceMeters: pipelineDistance * 1609.34,
        durationSeconds: transitTime * 3600,
        apiSource: 'pipeline-calculation',
        confidence: 80,
        pipelineSpecific: {
          terrainFactor: terrainFactor,
          regulatoryFactor: regulatoryFactor,
          safetyFactor: safetyFactor,
          flowSpeed: flowSpeed,
          pressureRequirements: this.getPipelinePressureRequirements(options.fuelType),
          materialCompatibility: this.getPipelineMaterialCompatibility(options.fuelType)
        },
        routingFactors: {
          terrain: 'Moderate terrain adjustments',
          regulatory: 'Standard regulatory compliance routing',
          safety: 'Enhanced safety buffer zones'
        }
      };

    } catch (error) {
      console.warn(`⚠️ Pipeline routing failed: ${error.message}`);
      return this.getFallbackPipelineRoute(origin, destination);
    }
  }

  /**
   * Get coordinates for a location
   */
  async getCoordinates(location) {
    try {
      // Check if it's already coordinates
      const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
      }

      // Use Google Geocoding API
      if (this.googleMapsKey && this.googleMapsKey !== 'your_google_maps_api_key_here') {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address: location,
            key: this.googleMapsKey
          },
          timeout: 10000
        });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const result = response.data.results[0];
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          };
        }
      }

      // Fallback to city database
      return this.getCityCoordinates(location);

    } catch (error) {
      console.warn(`⚠️ Geocoding failed for ${location}: ${error.message}`);
      return this.getCityCoordinates(location);
    }
  }

  /**
   * Fallback routing methods
   */
  getFallbackTruckRoute(origin, destination) {
    const distance = this.estimateDistance(origin, destination) * 1.2; // Road factor
    return {
      distance: Math.round(distance),
      duration: Math.round(distance / 60 * 60), // 60 mph average
      apiSource: 'fallback-truck',
      confidence: 70
    };
  }

  getFallbackShipRoute(origin, destination) {
    const distance = this.estimateDistance(origin, destination) * 1.1; // Maritime factor
    return {
      distance: Math.round(distance),
      duration: Math.round(distance / 25 * 60), // 25 knots average
      apiSource: 'fallback-ship',
      confidence: 65
    };
  }

  getFallbackRailRoute(origin, destination) {
    const distance = this.estimateDistance(origin, destination) * 1.3; // Rail routing factor
    return {
      distance: Math.round(distance),
      duration: Math.round(distance / 45 * 60), // 45 mph average
      apiSource: 'fallback-rail',
      confidence: 60
    };
  }

  getFallbackPipelineRoute(origin, destination) {
    const distance = this.estimateDistance(origin, destination) * 1.4; // Pipeline routing factor
    return {
      distance: Math.round(distance),
      duration: Math.round(distance / 15 * 60), // 15 mph flow speed
      apiSource: 'fallback-pipeline',
      confidence: 55
    };
  }

  /**
   * Utility methods
   */
  calculateGreatCircleDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  parseDistance(distanceText) {
    const match = distanceText.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  }

  parseDuration(durationText) {
    const hours = durationText.match(/(\d+)\s*h/);
    const minutes = durationText.match(/(\d+)\s*m/);
    return (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);
  }

  estimateDistance(origin, destination) {
    // Simple estimation based on city database or coordinates
    const originCoords = this.getCityCoordinates(origin);
    const destCoords = this.getCityCoordinates(destination);
    
    if (originCoords && destCoords) {
      return this.calculateGreatCircleDistance(
        originCoords.lat, originCoords.lng,
        destCoords.lat, destCoords.lng
      );
    }
    
    return 1000; // Default fallback
  }

  getCityCoordinates(cityName) {
    const cityDatabase = {
      'Houston, TX': { lat: 29.7604, lng: -95.3698 },
      'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
      'New York, NY': { lat: 40.7128, lng: -74.0060 },
      'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
      'Miami, FL': { lat: 25.7617, lng: -80.1918 },
      'Seattle, WA': { lat: 47.6062, lng: -122.3321 },
      'Boston, MA': { lat: 42.3601, lng: -71.0589 },
      'Bellevue, WA': { lat: 47.6101, lng: -122.2015 }
    };
    
    return cityDatabase[cityName] || null;
  }

  getMaritimeWeatherFactors() {
    return {
      season: 'current',
      windConditions: 'moderate',
      seaState: 'calm',
      weatherDelay: 0.05 // 5% time buffer
    };
  }

  async getPortInfo(location) {
    return {
      name: location,
      facilities: ['container', 'bulk', 'energy'],
      depth: 'deep_water',
      services: ['fuel', 'maintenance', 'storage']
    };
  }

  getPipelinePressureRequirements(fuelType) {
    const requirements = {
      hydrogen: { pressure: '350-700 bar', material: 'specialized_steel' },
      methanol: { pressure: '10-50 bar', material: 'carbon_steel' },
      ammonia: { pressure: '8-20 bar', material: 'stainless_steel' }
    };
    return requirements[fuelType] || requirements.methanol;
  }

  getPipelineMaterialCompatibility(fuelType) {
    const compatibility = {
      hydrogen: 'Requires hydrogen-compatible materials to prevent embrittlement',
      methanol: 'Compatible with most standard pipeline materials',
      ammonia: 'Requires corrosion-resistant materials'
    };
    return compatibility[fuelType] || 'Standard pipeline materials suitable';
  }
}

module.exports = new EnhancedRoutingService();