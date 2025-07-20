/**
 * Google Maps API Service for realistic routing
 * Handles road routes for trucks/rail and shipping routes for maritime transport
 */

const GOOGLE_MAPS_API_KEY = 'AIzaSyDEO_rKNxyCnLgkTCO34byVqYHFNr59jsU';

class GoogleMapsService {
  constructor() {
    this.apiKey = GOOGLE_MAPS_API_KEY;
    // Use backend proxy to avoid CORS issues
    this.baseUrl = '/api/google-maps/directions';
  }

  /**
   * Get driving route between two points (for truck transport)
   */
  async getDrivingRoute(origin, destination) {
    try {
      const params = new URLSearchParams({
        origin: `${origin.coords[0]},${origin.coords[1]}`,
        destination: `${destination.coords[0]},${destination.coords[1]}`,
        mode: 'driving',
        avoid: 'tolls', // Prefer routes without tolls for commercial transport
        key: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.value / 1000, // Convert to kilometers
          duration: leg.duration.value / 3600, // Convert to hours
          polyline: route.overview_polyline.points,
          steps: leg.steps.map(step => ({
            distance: step.distance.value / 1000,
            duration: step.duration.value / 3600,
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            startLocation: [step.start_location.lat, step.start_location.lng],
            endLocation: [step.end_location.lat, step.end_location.lng]
          })),
          bounds: {
            northeast: [route.bounds.northeast.lat, route.bounds.northeast.lng],
            southwest: [route.bounds.southwest.lat, route.bounds.southwest.lng]
          }
        };
      } else {
        throw new Error(`Google Maps API error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error fetching driving route:', error);
      throw error;
    }
  }

  /**
   * Get transit route (for rail transport)
   */
  async getTransitRoute(origin, destination) {
    try {
      const params = new URLSearchParams({
        origin: `${origin.coords[0]},${origin.coords[1]}`,
        destination: `${destination.coords[0]},${destination.coords[1]}`,
        mode: 'transit',
        transit_mode: 'rail',
        key: this.apiKey
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.value / 1000,
          duration: leg.duration.value / 3600,
          polyline: route.overview_polyline.points,
          transitDetails: leg.steps.filter(step => step.travel_mode === 'TRANSIT').map(step => ({
            line: step.transit_details?.line?.name || 'Rail',
            vehicle: step.transit_details?.line?.vehicle?.name || 'Train'
          })),
          bounds: {
            northeast: [route.bounds.northeast.lat, route.bounds.northeast.lng],
            southwest: [route.bounds.southwest.lat, route.bounds.southwest.lng]
          }
        };
      } else {
        // Fallback to driving route if no transit available
        console.warn('No transit route found, falling back to driving route');
        return await this.getDrivingRoute(origin, destination);
      }
    } catch (error) {
      console.error('Error fetching transit route:', error);
      // Fallback to driving route
      return await this.getDrivingRoute(origin, destination);
    }
  }

  /**
   * Get shipping route between ports (coastal navigation)
   */
  async getShippingRoute(originPort, destinationPort) {
    try {
      // For shipping routes, we'll use a combination of:
      // 1. Direct water route calculation
      // 2. Major shipping lanes consideration
      
      const origin = originPort.coords;
      const destination = destinationPort.coords;
      
      // Check if both are coastal ports
      const isCoastalRoute = this.isCoastalPort(originPort) && this.isCoastalPort(destinationPort);
      
      if (isCoastalRoute) {
        // Generate realistic shipping route following coastlines
        const waypoints = this.generateShippingWaypoints(origin, destination);
        
        return {
          distance: this.calculateShippingDistance(origin, destination, waypoints),
          duration: this.calculateShippingDuration(origin, destination),
          polyline: this.generateShippingPolyline(origin, destination, waypoints),
          waypoints: waypoints,
          routeType: 'coastal_shipping',
          bounds: this.calculateBounds([origin, destination, ...waypoints])
        };
      } else {
        // One or both ports are inland - use driving route to nearest port
        return await this.getDrivingRoute(originPort, destinationPort);
      }
    } catch (error) {
      console.error('Error calculating shipping route:', error);
      // Fallback to straight-line distance
      return this.calculateStraightLineRoute(originPort, destinationPort);
    }
  }

  /**
   * Check if a port is coastal (has ship infrastructure)
   */
  isCoastalPort(port) {
    return port.infrastructure && port.infrastructure.includes('ship');
  }

  /**
   * Generate waypoints for shipping routes following major shipping lanes
   */
  generateShippingWaypoints(origin, destination) {
    const waypoints = [];
    
    // Major shipping waypoints along US coasts
    const shippingWaypoints = {
      // West Coast
      'west_coast_north': [48.1351, -124.1207], // Off Washington coast
      'west_coast_central': [36.7783, -121.8013], // Off California central coast
      'west_coast_south': [32.8312, -117.8931], // Off San Diego
      
      // East Coast
      'east_coast_north': [41.4993, -70.6693], // Off Cape Cod
      'east_coast_central': [36.8529, -75.9774], // Off Cape Hatteras
      'east_coast_south': [25.7617, -80.1918], // Off Miami
      
      // Gulf Coast
      'gulf_west': [29.3013, -94.7977], // Off Texas coast
      'gulf_central': [29.2520, -89.4012], // Off Louisiana coast
      'gulf_east': [27.7663, -82.6404], // Off Florida Gulf coast
    };

    // Determine route type based on origin and destination
    const originLat = origin[0];
    const originLng = origin[1];
    const destLat = destination[0];
    const destLng = destination[1];

    // West Coast routing
    if (originLng < -115 && destLng < -115) {
      if (Math.abs(originLat - destLat) > 5) {
        waypoints.push(shippingWaypoints.west_coast_central);
      }
    }
    // East Coast routing
    else if (originLng > -85 && destLng > -85 && originLat > 25 && destLat > 25) {
      if (Math.abs(originLat - destLat) > 5) {
        waypoints.push(shippingWaypoints.east_coast_central);
      }
    }
    // Gulf Coast routing
    else if (originLat < 32 && destLat < 32 && originLng > -100 && destLng > -100) {
      waypoints.push(shippingWaypoints.gulf_central);
    }
    // Cross-coast routing (through Panama Canal simulation)
    else if ((originLng < -115 && destLng > -85) || (originLng > -85 && destLng < -115)) {
      waypoints.push([9.0765, -79.6014]); // Panama Canal
    }

    return waypoints;
  }

  /**
   * Calculate shipping distance including waypoints
   */
  calculateShippingDistance(origin, destination, waypoints) {
    let totalDistance = 0;
    let currentPoint = origin;

    // Add distance through waypoints
    for (const waypoint of waypoints) {
      totalDistance += this.haversineDistance(currentPoint, waypoint);
      currentPoint = waypoint;
    }

    // Add final leg to destination
    totalDistance += this.haversineDistance(currentPoint, destination);

    return totalDistance;
  }

  /**
   * Calculate shipping duration (average 20 knots = 37 km/h)
   */
  calculateShippingDuration(origin, destination) {
    const distance = this.haversineDistance(origin, destination);
    const averageSpeed = 37; // km/h (20 knots)
    return distance / averageSpeed;
  }

  /**
   * Generate polyline for shipping route
   */
  generateShippingPolyline(origin, destination, waypoints) {
    // Simple polyline generation - in production, use actual polyline encoding
    const points = [origin, ...waypoints, destination];
    return this.encodePolyline(points);
  }

  /**
   * Calculate bounds for multiple points
   */
  calculateBounds(points) {
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    
    return {
      northeast: [Math.max(...lats), Math.max(...lngs)],
      southwest: [Math.min(...lats), Math.min(...lngs)]
    };
  }

  /**
   * Fallback straight-line route calculation
   */
  calculateStraightLineRoute(origin, destination) {
    const distance = this.haversineDistance(origin.coords, destination.coords);
    
    return {
      distance: distance,
      duration: distance / 80, // Assume 80 km/h average speed
      polyline: this.encodePolyline([origin.coords, destination.coords]),
      routeType: 'straight_line',
      bounds: this.calculateBounds([origin.coords, destination.coords])
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  haversineDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2[0] - point1[0]);
    const dLng = this.toRadians(point2[1] - point1[1]);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1[0])) * Math.cos(this.toRadians(point2[0])) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Simple polyline encoding (simplified version)
   */
  encodePolyline(points) {
    // This is a simplified version - in production, use Google's polyline encoding
    return points.map(p => `${p[0]},${p[1]}`).join('|');
  }

  /**
   * Decode polyline for display
   */
  decodePolyline(encoded) {
    // Simplified decoder - matches our simple encoder
    if (encoded.includes('|')) {
      return encoded.split('|').map(point => {
        const [lat, lng] = point.split(',').map(Number);
        return [lat, lng];
      });
    }
    
    // If it's a Google polyline, we'd need the full decoder here
    // For now, return empty array to trigger fallback
    return [];
  }
}

export default GoogleMapsService;