// frontend/src/components/RouteMap.js - Simple Google Maps Button Only
import React from 'react';

const RouteMap = ({ origin, destination, intermediateHub, transportModes, results }) => {
  
  const generateGoogleMapsUrl = () => {
    if (intermediateHub) {
      return `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(intermediateHub)}/${encodeURIComponent(destination)}`;
    }
    return `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
  };

  return (
    <div className="route-map-simple">
      <div className="route-summary">
        <div className="route-info">
          <h4>📍 Route: {origin} → {destination}</h4>
          <p>Distance: <strong>{results?.totalDistance || 0} miles</strong> (Google Maps API)</p>
        </div>
        
        <a 
          href={generateGoogleMapsUrl()}
          target="_blank" 
          rel="noopener noreferrer"
          className="google-maps-button"
        >
          🗺️ View Full Route in Google Maps
        </a>
      </div>

      <style jsx>{`
        .route-map-simple {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
          color: white;
        }

        .route-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .route-info h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .route-info p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .google-maps-button {
          background: #4285f4;
          color: white;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .google-maps-button:hover {
          background: #3367d6;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(66, 133, 244, 0.4);
        }

        @media (max-width: 768px) {
          .route-summary {
            flex-direction: column;
            text-align: center;
          }

          .google-maps-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default RouteMap;