import React, { useState, useEffect } from 'react';
import './PriceDisplay.css';

const PriceDisplay = ({ selectedFuel, onPriceUpdate }) => {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchPrices();
    
    // Refresh prices every 15 minutes
    const interval = setInterval(fetchPrices, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    // When selectedFuel changes, update parent component with the price
    if (selectedFuel && prices && prices[selectedFuel]) {
      onPriceUpdate(prices[selectedFuel]);
    }
  }, [selectedFuel, prices, onPriceUpdate]);
  
  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/fuel-types');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Convert the array to an object keyed by fuel type
        const priceData = {};
        result.data.forEach(fuel => {
          priceData[fuel.type] = {
            price: fuel.currentPrice,
            unit: fuel.unit,
            confidence: fuel.confidence || 85,
            lastUpdated: fuel.lastUpdated || new Date().toISOString()
          };
        });
        
        setPrices(priceData);
        setLastUpdated(new Date());
        
        // If a specific fuel is selected, notify parent component
        if (selectedFuel && priceData[selectedFuel]) {
          onPriceUpdate(priceData[selectedFuel]);
        }
        
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Failed to fetch current prices');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !prices) {
    return <div className="price-display loading">Loading current prices...</div>;
  }
  
  if (error && !prices) {
    return <div className="price-display error">{error}</div>;
  }
  
  if (!prices) {
    return <div className="price-display empty">No price data available</div>;
  }
  
  return (
    <div className="price-display">
      <div className="price-header">
        <h4>Current Market Prices</h4>
        {lastUpdated && (
          <span className="update-time">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="price-cards">
        {Object.entries(prices).map(([fuel, data]) => (
          <div 
            key={fuel} 
            className={`price-card ${selectedFuel === fuel ? 'selected' : ''}`}
          >
            <div className="fuel-name">
              {fuel === 'hydrogen' ? 'Hydrogen (H₂)' : 
               fuel === 'methanol' ? 'Methanol (CH₃OH)' : 
               'Ammonia (NH₃)'}
            </div>
            <div className="price-value">
              ${data.price.toFixed(2)}/{data.unit}
            </div>
            <div className="confidence">
              {data.confidence}% confidence
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceDisplay;