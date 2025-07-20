import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GoogleMapsService from '../services/googleMapsService';
import './RoutingMap.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different transport modes
const createCustomIcon = (color, symbol) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 14px; color: white; font-weight: bold;">${symbol}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const originIcon = createCustomIcon('#2E8B57', 'O');
const hubIcon = createCustomIcon('#FF6B35', 'H');
const destinationIcon = createCustomIcon('#DC143C', 'D');

// Transport mode colors and styles
const transportStyles = {
  truck: { color: '#FF6B35', weight: 4, opacity: 0.8, dashArray: '10, 5' },
  rail: { color: '#4169E1', weight: 6, opacity: 0.8 },
  ship: { color: '#20B2AA', weight: 5, opacity: 0.8, dashArray: '15, 10' },
  pipeline: { color: '#8A2BE2', weight: 8, opacity: 0.7 }
};

// Component to fit map bounds to route
const FitBounds = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds);
      map.fitBounds(leafletBounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  
  return null;
};

const RoutingMap = ({ routeData, onLocationSelect, showRoute = true }) => {
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of USA
  const [mapZoom, setMapZoom] = useState(4);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeBounds, setRouteBounds] = useState([]);
  const [googleRoutes, setGoogleRoutes] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const mapRef = useRef();
  const googleMapsService = useRef(new GoogleMapsService());

  // Extract coordinates from route data
  useEffect(() => {
    if (routeData && showRoute) {
      const coordinates = [];
      const bounds = [];

      console.log('Route data received:', routeData); // Debug log

      // Add origin
      if (routeData.origin && routeData.origin.coords) {
        coordinates.push(routeData.origin.coords);
        bounds.push(routeData.origin.coords);
        console.log('Origin added:', routeData.origin.coords);
      }

      // Add intermediate hub if exists
      if (routeData.intermediateHub && routeData.intermediateHub.coords) {
        coordinates.push(routeData.intermediateHub.coords);
        bounds.push(routeData.intermediateHub.coords);
        console.log('Hub added:', routeData.intermediateHub.coords);
      }

      // Add destination
      if (routeData.destination && routeData.destination.coords) {
        coordinates.push(routeData.destination.coords);
        bounds.push(routeData.destination.coords);
        console.log('Destination added:', routeData.destination.coords);
      }

      console.log('Final coordinates:', coordinates); // Debug log
      setRouteCoordinates(coordinates);
      setRouteBounds(bounds);

      // Center map on route if coordinates exist
      if (coordinates.length > 0) {
        const avgLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
        const avgLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(coordinates.length === 2 ? 6 : 5);
      }
    }
  }, [routeData, showRoute]);

  // Fetch Google Maps routes when route data changes
  useEffect(() => {
    const fetchGoogleRoutes = async () => {
      if (!routeData || !showRoute || routeCoordinates.length < 2) {
        setGoogleRoutes([]);
        return;
      }

      setIsLoadingRoutes(true);
      console.log('Fetching Google Maps routes...');

      try {
        const routes = [];
        
        if (routeCoordinates.length === 2) {
          // Direct route
          const origin = { coords: routeCoordinates[0] };
          const destination = { coords: routeCoordinates[1] };
          const mode = routeData.transportMode1 || 'truck';

          let routeResult;
          switch (mode) {
            case 'truck':
              routeResult = await googleMapsService.current.getDrivingRoute(origin, destination);
              break;
            case 'rail':
              routeResult = await googleMapsService.current.getTransitRoute(origin, destination);
              break;
            case 'ship':
              routeResult = await googleMapsService.current.getShippingRoute(
                { coords: routeCoordinates[0], infrastructure: routeData.origin?.infrastructure || [] },
                { coords: routeCoordinates[1], infrastructure: routeData.destination?.infrastructure || [] }
              );
              break;
            default:
              routeResult = await googleMapsService.current.getDrivingRoute(origin, destination);
          }

          routes.push({
            ...routeResult,
            mode: mode,
            color: getRouteColor(mode),
            label: `${mode} route`
          });

        } else if (routeCoordinates.length === 3) {
          // Multi-leg route
          const origin = { coords: routeCoordinates[0] };
          const hub = { coords: routeCoordinates[1] };
          const destination = { coords: routeCoordinates[2] };
          
          const mode1 = routeData.transportMode1 || 'truck';
          const mode2 = routeData.transportMode2 || 'ship';

          // Fetch first leg
          let leg1Result;
          switch (mode1) {
            case 'truck':
              leg1Result = await googleMapsService.current.getDrivingRoute(origin, hub);
              break;
            case 'rail':
              leg1Result = await googleMapsService.current.getTransitRoute(origin, hub);
              break;
            case 'ship':
              leg1Result = await googleMapsService.current.getShippingRoute(
                { coords: routeCoordinates[0], infrastructure: routeData.origin?.infrastructure || [] },
                { coords: routeCoordinates[1], infrastructure: routeData.intermediateHub?.infrastructure || [] }
              );
              break;
            default:
              leg1Result = await googleMapsService.current.getDrivingRoute(origin, hub);
          }

          routes.push({
            ...leg1Result,
            mode: mode1,
            color: getRouteColor(mode1),
            label: `${mode1} to hub`
          });

          // Fetch second leg
          let leg2Result;
          switch (mode2) {
            case 'truck':
              leg2Result = await googleMapsService.current.getDrivingRoute(hub, destination);
              break;
            case 'rail':
              leg2Result = await googleMapsService.current.getTransitRoute(hub, destination);
              break;
            case 'ship':
              leg2Result = await googleMapsService.current.getShippingRoute(
                { coords: routeCoordinates[1], infrastructure: routeData.intermediateHub?.infrastructure || [] },
                { coords: routeCoordinates[2], infrastructure: routeData.destination?.infrastructure || [] }
              );
              break;
            default:
              leg2Result = await googleMapsService.current.getDrivingRoute(hub, destination);
          }

          routes.push({
            ...leg2Result,
            mode: mode2,
            color: getRouteColor(mode2),
            label: `${mode2} to destination`
          });
        }

        console.log('Google Maps routes fetched:', routes);
        setGoogleRoutes(routes);

      } catch (error) {
        console.error('Error fetching Google Maps routes:', error);
        // Fallback to straight lines if Google Maps fails
        setGoogleRoutes([]);
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    fetchGoogleRoutes();
  }, [routeCoordinates, routeData, showRoute]);

  // Handle map click for location selection
  const handleMapClick = (e) => {
    if (onLocationSelect) {
      const { lat, lng } = e.latlng;
      onLocationSelect({ coords: [lat, lng], name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  };

  // Generate route segments with different transport modes
  const generateRouteSegments = () => {
    if (!routeData || routeCoordinates.length < 2) {
      console.log('No route segments - insufficient data:', { routeData, routeCoordinates });
      return [];
    }

    const segments = [];
    console.log('Generating segments for coordinates:', routeCoordinates);
    
    if (routeCoordinates.length === 2) {
      // Direct route (origin to destination)
      segments.push({
        coordinates: routeCoordinates,
        mode: routeData.transportMode1 || 'truck',
        label: `${routeData.transportMode1 || 'truck'} transport`
      });
      console.log('Direct route segment created:', segments[0]);
    } else if (routeCoordinates.length === 3) {
      // Route with intermediate hub
      segments.push({
        coordinates: [routeCoordinates[0], routeCoordinates[1]],
        mode: routeData.transportMode1 || 'truck',
        label: `${routeData.transportMode1 || 'truck'} to hub`
      });
      segments.push({
        coordinates: [routeCoordinates[1], routeCoordinates[2]],
        mode: routeData.transportMode2 || 'ship',
        label: `${routeData.transportMode2 || 'ship'} to destination`
      });
      console.log('Multi-leg route segments created:', segments);
    }

    return segments;
  };

  const routeSegments = generateRouteSegments();

  // Function to decode Google polyline
  const decodePolyline = (encoded) => {
    if (!encoded) return [];
    
    // If it's our simple format (lat,lng|lat,lng)
    if (encoded.includes('|')) {
      return encoded.split('|').map(point => {
        const [lat, lng] = point.split(',').map(Number);
        return [lat, lng];
      });
    }
    
    // Google polyline decoding algorithm
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates = [];

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coordinates.push([lat / 1e5, lng / 1e5]);
    }

    return coordinates;
  };

  return (
    <div className="routing-map-container">
      <div className="map-header">
        <h3>🗺️ Route Visualization</h3>
        {routeData && (
          <div className="route-info">
            <span className="fuel-type">
              {routeData.fuelType ? `${routeData.fuelType.toUpperCase()}` : 'Select fuel type'}
            </span>
            {routeData.volume && (
              <span className="volume">
                {routeData.volume} {routeData.volumeUnit || 'tonnes'}
              </span>
            )}
          </div>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '500px', width: '100%' }}
        ref={mapRef}
        onClick={handleMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to route */}
        <FitBounds bounds={routeBounds} />

        {/* Origin marker */}
        {routeData?.origin?.coords && (
          <Marker position={routeData.origin.coords} icon={originIcon}>
            <Popup>
              <div className="map-popup">
                <strong>🏭 Origin</strong><br />
                {routeData.origin.name}<br />
                <small>Coordinates: {routeData.origin.coords.join(', ')}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Intermediate hub marker */}
        {routeData?.intermediateHub?.coords && (
          <Marker position={routeData.intermediateHub.coords} icon={hubIcon}>
            <Popup>
              <div className="map-popup">
                <strong>🏢 Intermediate Hub</strong><br />
                {routeData.intermediateHub.name}<br />
                <small>Coordinates: {routeData.intermediateHub.coords.join(', ')}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {routeData?.destination?.coords && (
          <Marker position={routeData.destination.coords} icon={destinationIcon}>
            <Popup>
              <div className="map-popup">
                <strong>🎯 Destination</strong><br />
                {routeData.destination.name}<br />
                <small>Coordinates: {routeData.destination.coords.join(', ')}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Google Maps routes (realistic routing) */}
        {showRoute && googleRoutes.length > 0 && googleRoutes.map((route, index) => {
          const routeCoords = decodePolyline(route.polyline);
          return routeCoords.length > 0 ? (
            <Polyline
              key={`google-route-${index}`}
              positions={routeCoords}
              pathOptions={{
                color: route.color,
                weight: 4,
                opacity: 0.8,
                dashArray: route.mode === 'ship' ? '10, 10' : route.mode === 'rail' ? '5, 5' : null
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>🗺️ {route.label}</strong><br />
                  Mode: {route.mode}<br />
                  Distance: {route.distance?.toFixed(1)} km<br />
                  Duration: {route.duration?.toFixed(1)} hours<br />
                  <small>Source: Google Maps API</small>
                </div>
              </Popup>
            </Polyline>
          ) : null;
        })}

        {/* Fallback to straight line routes if Google Maps fails */}
        {showRoute && googleRoutes.length === 0 && !isLoadingRoutes && routeSegments.map((segment, index) => (
          <Polyline
            key={`fallback-${index}`}
            positions={segment.coordinates}
            pathOptions={{
              ...transportStyles[segment.mode] || transportStyles.truck,
              opacity: 0.6,
              dashArray: '15, 10' // Dashed to indicate fallback
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>📏 {segment.label} (Straight Line)</strong><br />
                Mode: {segment.mode}<br />
                Distance: ~{calculateDistance(segment.coordinates[0], segment.coordinates[1])} km<br />
                <small style={{color: '#f59e0b'}}>⚠️ Fallback route - Google Maps unavailable</small>
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>

      {/* Loading indicator */}
      {isLoadingRoutes && (
        <div className="route-loading">
          <div className="loading-spinner"></div>
          <span>Loading realistic routes from Google Maps...</span>
        </div>
      )}

      {/* Legend */}
      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-marker origin"></div>
            <span>Origin</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker hub"></div>
            <span>Hub</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker destination"></div>
            <span>Destination</span>
          </div>
        </div>
        
        <div className="transport-legend">
          <h5>Transport Modes</h5>
          {Object.entries(transportStyles).map(([mode, style]) => (
            <div key={mode} className="legend-item">
              <div 
                className="legend-line" 
                style={{ 
                  backgroundColor: style.color,
                  height: `${style.weight}px`,
                  opacity: style.opacity,
                  borderStyle: style.dashArray ? 'dashed' : 'solid'
                }}
              ></div>
              <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
            </div>
          ))}
        </div>

        {/* Route source indicator */}
        <div className="route-source">
          {googleRoutes.length > 0 ? (
            <div className="source-indicator google">
              <span className="source-icon">🗺️</span>
              <span>Google Maps Routing</span>
            </div>
          ) : !isLoadingRoutes && routeSegments.length > 0 ? (
            <div className="source-indicator fallback">
              <span className="source-icon">📏</span>
              <span>Straight Line (Fallback)</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Route statistics */}
      {showRoute && routeData && (
        <div className="route-stats">
          <h4>Route Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Distance:</span>
              <span className="stat-value">
                {calculateTotalDistance(routeCoordinates)} km
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Transport Modes:</span>
              <span className="stat-value">
                {routeSegments.length} segment{routeSegments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Fuel Type:</span>
              <span className="stat-value">
                {routeData.fuelType || 'Not specified'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

// Helper function to calculate total route distance
const calculateTotalDistance = (coordinates) => {
  if (coordinates.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
  }
  return totalDistance;
};

export default RoutingMap;