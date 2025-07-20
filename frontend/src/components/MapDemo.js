import React from 'react';
import RoutingMap from './RoutingMap';

// Demo component to showcase the routing map functionality
const MapDemo = () => {
  // Sample route data for demonstration
  const sampleRouteData = {
    fuelType: 'hydrogen',
    volume: '500',
    volumeUnit: 'tonnes',
    origin: {
      name: 'Houston, TX',
      coords: [29.7604, -95.3698]
    },
    intermediateHub: {
      name: 'New Orleans, LA',
      coords: [29.9511, -90.0715]
    },
    destination: {
      name: 'Miami, FL',
      coords: [25.7617, -80.1918]
    },
    transportMode1: 'truck',
    transportMode2: 'ship'
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ FuelRoute Pro - Interactive Routing Map Demo</h2>
      <p>This demonstrates the new routing map feature with a sample hydrogen transport route:</p>
      
      <div style={{ 
        background: '#f0f9ff', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #0ea5e9'
      }}>
        <h4>Sample Route Details:</h4>
        <ul>
          <li><strong>Fuel:</strong> {sampleRouteData.fuelType} ({sampleRouteData.volume} {sampleRouteData.volumeUnit})</li>
          <li><strong>Origin:</strong> {sampleRouteData.origin.name}</li>
          <li><strong>Hub:</strong> {sampleRouteData.intermediateHub.name}</li>
          <li><strong>Destination:</strong> {sampleRouteData.destination.name}</li>
          <li><strong>Transport Modes:</strong> {sampleRouteData.transportMode1} → {sampleRouteData.transportMode2}</li>
        </ul>
      </div>

      <RoutingMap 
        routeData={sampleRouteData}
        showRoute={true}
      />
      
      <div style={{ 
        background: '#f0fdf4', 
        padding: '15px', 
        borderRadius: '8px', 
        marginTop: '20px',
        border: '1px solid #22c55e'
      }}>
        <h4>✅ Features Implemented:</h4>
        <ul>
          <li>Interactive map with OpenStreetMap tiles</li>
          <li>Custom markers for origin, hub, and destination</li>
          <li>Route visualization with different colors for transport modes</li>
          <li>Distance calculations using Haversine formula</li>
          <li>Responsive design with legend and statistics</li>
          <li>Real-time route updates as user selects locations</li>
          <li>Integration with existing FuelForm component</li>
        </ul>
      </div>
    </div>
  );
};

export default MapDemo;