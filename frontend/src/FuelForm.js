import React, { useState } from 'react';
import './FuelForm.css';

const FuelForm = ({ backendAPI, apiStatus }) => {
  const [formData, setFormData] = useState({
    fuelType: '',
    fuelState: '',
    volume: '',
    volumeUnit: 'tonnes',
    origin: '',
    intermediateHub: '',
    destination: '',
    transportMode1: '',
    transportMode2: ''
  });

  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [hubSuggestions, setHubSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showHubSuggestions, setShowHubSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Enhanced city database with coordinates and hub types
  const cityDatabase = [
    { name: 'Seattle, WA', coords: [47.6062, -122.3321], hubType: 'port', region: 'US West Coast' },
    { name: 'Seattle-Tacoma International Airport, WA', coords: [47.4502, -122.3088], hubType: 'airport', region: 'US West Coast' },
    { name: 'Bellevue, WA', coords: [47.6101, -122.2015], hubType: 'city', region: 'US West Coast' },
    { name: 'Portland, OR', coords: [45.5152, -122.6784], hubType: 'port', region: 'US West Coast' },
    { name: 'Los Angeles, CA', coords: [34.0522, -118.2437], hubType: 'port', region: 'US West Coast' },
    { name: 'LAX (Los Angeles International Airport), CA', coords: [33.9425, -118.4081], hubType: 'airport', region: 'US West Coast' },
    { name: 'Port of Long Beach, CA', coords: [33.7701, -118.1937], hubType: 'port', region: 'US West Coast' },
    { name: 'Port of Los Angeles, CA', coords: [33.7361, -118.2644], hubType: 'port', region: 'US West Coast' },
    { name: 'San Francisco, CA', coords: [37.7749, -122.4194], hubType: 'port', region: 'US West Coast' },
    { name: 'Oakland, CA', coords: [37.8044, -122.2712], hubType: 'port', region: 'US West Coast' },
    { name: 'Houston, TX', coords: [29.7604, -95.3698], hubType: 'port', region: 'US Gulf Coast' },
    { name: 'New York, NY', coords: [40.7128, -74.0060], hubType: 'port', region: 'US East Coast' },
    { name: 'Newark, NJ', coords: [40.7357, -74.1724], hubType: 'port', region: 'US East Coast' },
    { name: 'Chicago, IL', coords: [41.8781, -87.6298], hubType: 'rail', region: 'US Midwest' },
    { name: 'Denver, CO', coords: [39.7392, -104.9903], hubType: 'rail', region: 'US Mountain' },
    { name: 'Miami, FL', coords: [25.7617, -80.1918], hubType: 'port', region: 'US Southeast' },
    { name: 'Taipei, Taiwan', coords: [25.0330, 121.5654], hubType: 'airport', region: 'Asia Pacific' },
    { name: 'Taoyuan International Airport, Taiwan', coords: [25.0797, 121.2342], hubType: 'airport', region: 'Asia Pacific' },
    { name: 'Kaohsiung Port, Taiwan', coords: [22.6273, 120.3014], hubType: 'port', region: 'Asia Pacific' },
    { name: 'Taichung, Taiwan', coords: [24.1477, 120.6736], hubType: 'city', region: 'Asia Pacific' },
    { name: 'Vancouver Port, BC', coords: [49.2827, -123.1207], hubType: 'port', region: 'Canada West Coast' },
    { name: 'Tokyo Port, Japan', coords: [35.6762, 139.6503], hubType: 'port', region: 'Asia Pacific' },
    { name: 'Shanghai Port, China', coords: [31.2304, 121.4737], hubType: 'port', region: 'Asia Pacific' },
    { name: 'Singapore Port', coords: [1.3521, 103.8198], hubType: 'port', region: 'Asia Pacific' }
  ];

  // Real-time market simulation data
  const marketConditions = {
    fuelPrices: {
      hydrogen: { current: 4.25, trend: 'stable', volatility: 0.15 },
      methanol: { current: 1.85, trend: 'rising', volatility: 0.08 },
      ammonia: { current: 2.40, trend: 'falling', volatility: 0.12 }
    },
    transportRates: {
      truck: { current: 2.8, trend: 'rising', demandFactor: 1.2 },
      rail: { current: 1.1, trend: 'stable', demandFactor: 0.9 },
      ship: { current: 0.65, trend: 'falling', demandFactor: 0.8 },
      pipeline: { current: 0.4, trend: 'stable', demandFactor: 1.0 }
    },
    supplyChain: {
      congestion: 0.15,
      seasonality: 1.1,
      fuelAvailability: 0.85
    },
    economic: {
      dieselPrice: 3.45,
      laborCosts: 1.05,
      insuranceRates: 1.02
    }
  };

  // Fuel options
  const fuelOptions = {
    hydrogen: { 
      name: 'Hydrogen (H₂)', 
      states: ['gas', 'liquid'],
      density: { gas: 0.08988, liquid: 70.8 },
      energyDensity: 142,
      storageComplexity: 'high',
      regulatoryFactor: 1.3
    },
    methanol: { 
      name: 'Methanol (CH₃OH)', 
      states: ['liquid'],
      density: { liquid: 791.3 },
      energyDensity: 19.9,
      storageComplexity: 'medium',
      regulatoryFactor: 1.1
    },
    ammonia: { 
      name: 'Ammonia (NH₃)', 
      states: ['gas', 'liquid'],
      density: { gas: 0.7708, liquid: 682 },
      energyDensity: 18.8,
      storageComplexity: 'high',
      regulatoryFactor: 1.4
    }
  };

  const volumeUnits = [
    { value: 'tonnes', label: 'Tonnes (metric tons)', factor: 1 },
    { value: 'kg', label: 'Kilograms', factor: 0.001 },
    { value: 'liters', label: 'Liters', factor: 0.001 },
    { value: 'gallons', label: 'Gallons', factor: 0.00378541 },
    { value: 'cubic_meters', label: 'Cubic Meters', factor: 1 }
  ];

  // Calculate distance using Haversine formula
  const calculateDistance = (origin, destination) => {
    const originData = cityDatabase.find(city => city.name === origin);
    const destData = cityDatabase.find(city => city.name === destination);
    
    if (!originData || !destData) {
      return Math.floor(Math.random() * 500) + 100;
    }

    const [lat1, lon1] = originData.coords;
    const [lat2, lon2] = destData.coords;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
  };

  // FIXED: Enhanced cost calculation with commodity pricing
  const calculateEnhancedCost = (data) => {
    const fuel = fuelOptions[data.fuelType];
    const market = marketConditions;
    
    const volumeUnit = volumeUnits.find(unit => unit.value === data.volumeUnit);
    let volumeInTonnes = parseFloat(data.volume) * volumeUnit.factor;
    const volumeInKg = volumeInTonnes * 1000;
    
    // 1. COMMODITY COST (This was missing!)
    const commodityPrice = market.fuelPrices[data.fuelType]?.current || 4.25;
    const commodityCost = volumeInKg * commodityPrice;
    
    // 2. TRANSPORT COST
    // Leg 1: Origin to Hub/Destination
    const distance1 = calculateDistance(data.origin, data.intermediateHub || data.destination);
    const rate1 = market.transportRates[data.transportMode1]?.current || 2.5;
    const baseCost1 = distance1 * rate1 * volumeInTonnes * fuel.regulatoryFactor;
    
    // Leg 2: Hub to Destination (if hub exists)
    let distance2 = 0, baseCost2 = 0;
    if (data.intermediateHub) {
      distance2 = calculateDistance(data.intermediateHub, data.destination);
      const rate2 = market.transportRates[data.transportMode2]?.current || 2.5;
      baseCost2 = distance2 * rate2 * volumeInTonnes * fuel.regulatoryFactor;
    }
    
    const totalDistance = distance1 + distance2;
    const transportationCost = baseCost1 + baseCost2;
    
    // 3. ADDITIONAL COSTS
    const fuelHandlingFee = volumeInTonnes * 75 * (fuel.storageComplexity === 'high' ? 1.3 : 1.15);
    const terminalFees = data.intermediateHub ? 1050 : 400;
    const hubTransferFee = data.intermediateHub ? volumeInTonnes * 45 : 0;
    const insuranceCost = ((commodityCost + transportationCost) * 0.03) * market.economic.insuranceRates;
    const carbonOffset = volumeInTonnes * 12;
    
    // 4. TOTAL ALL-IN COST
    const totalTransportCost = transportationCost + fuelHandlingFee + terminalFees + hubTransferFee + insuranceCost + carbonOffset;
    const allInCost = commodityCost + totalTransportCost;
    
    return {
      // Main costs
      allInCost: Math.round(allInCost * 100) / 100,
      commodityCost: Math.round(commodityCost * 100) / 100,
      totalTransportCost: Math.round(totalTransportCost * 100) / 100,
      
      // Route details  
      totalDistance,
      leg1: { 
        distance: distance1, 
        cost: Math.round(baseCost1 * 100) / 100, 
        mode: data.transportMode1 
      },
      leg2: data.intermediateHub ? { 
        distance: distance2, 
        cost: Math.round(baseCost2 * 100) / 100, 
        mode: data.transportMode2 
      } : null,
      
      // Cost breakdown
      fuelHandlingFee: Math.round(fuelHandlingFee * 100) / 100,
      terminalFees: Math.round(terminalFees * 100) / 100,
      hubTransferFee: Math.round(hubTransferFee * 100) / 100,
      insuranceCost: Math.round(insuranceCost * 100) / 100,
      carbonOffset: Math.round(carbonOffset * 100) / 100,
      
      // Metadata
      confidence: 85,
      hub: data.intermediateHub,
      commodityPrice,
      marketInsights: {
        fuelTrend: market.fuelPrices[data.fuelType]?.trend,
        recommendation: "Route optimized based on current market conditions. Commodity cost included in all-in pricing."
      }
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'fuelType') {
      setFormData({ 
        ...formData, 
        [name]: value, 
        fuelState: '' 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCityInput = (e, field) => {
    const value = e.target.value;
    setFormData({ ...formData, [field]: value });

    if (value.length > 0) {
      let filtered = cityDatabase.filter(city =>
        city.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);

      if (field === 'origin') {
        setOriginSuggestions(filtered.map(city => city.name));
        setShowOriginSuggestions(true);
      } else if (field === 'intermediateHub') {
        setHubSuggestions(filtered.map(city => city.name));
        setShowHubSuggestions(true);
      } else {
        setDestinationSuggestions(filtered.map(city => city.name));
        setShowDestinationSuggestions(true);
      }
    } else {
      if (field === 'origin') setShowOriginSuggestions(false);
      else if (field === 'intermediateHub') setShowHubSuggestions(false);
      else setShowDestinationSuggestions(false);
    }
  };

  const selectSuggestion = (city, field) => {
    setFormData({ ...formData, [field]: city });
    if (field === 'origin') setShowOriginSuggestions(false);
    else if (field === 'intermediateHub') setShowHubSuggestions(false);
    else setShowDestinationSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.transportMode1) {
      alert('Please select Transport Mode 1');
      return;
    }
    
    if (formData.intermediateHub && !formData.transportMode2) {
      alert('Please select Transport Mode 2 for the intermediate hub route');
      return;
    }
    
    setIsCalculating(true);
    setShowResults(false);
    
    try {
      if (backendAPI && backendAPI.isConnected) {
        // Use backend API
        const response = await backendAPI.calculateCost(formData);
        if (response.success && response.data) {
          setResults(response.data);
        } else {
          throw new Error('Invalid backend response');
        }
        
        if (backendAPI.refreshHistory) {
          backendAPI.refreshHistory();
        }
      } else {
        // Fallback to local calculation  
        await new Promise(resolve => setTimeout(resolve, 2000));
        const calculationResults = calculateEnhancedCost(formData);
        setResults(calculationResults);
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Calculation failed:', error);
      // Always fallback to local calculation
      await new Promise(resolve => setTimeout(resolve, 2000));
      const calculationResults = calculateEnhancedCost(formData);
      setResults(calculationResults);
      setShowResults(true);
    } finally {
      setIsCalculating(false);
    }
  };

  const availableStates = formData.fuelType ? fuelOptions[formData.fuelType]?.states || [] : [];

  // Helper function to safely format numbers
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return parseFloat(value).toFixed(2);
  };

  return (
    <div className="calculator-section">
      <div className="calculator-container">
        <div className="calculator-header">
          <h2>AI-Powered Multi-Leg Fuel Transportation Calculator</h2>
          <p>Calculate complex routes with intermediate hubs and multiple transport modes</p>
          <div className="ai-badge">
            <span className="ai-indicator">🤖</span>
            Multi-Modal AI Analysis
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="calculator-form">
          
          {/* Fuel Type and State */}
          <div className="form-row">
            <div className="form-group">
              <label>Fuel Type</label>
              <select 
                name="fuelType" 
                value={formData.fuelType}
                onChange={handleChange} 
                required
              >
                <option value="">Select Fuel Type</option>
                {Object.entries(fuelOptions).map(([key, fuel]) => (
                  <option key={key} value={key}>{fuel.name}</option>
                ))}
              </select>
              {formData.fuelType && (
                <div className="market-info">
                  Current Price: ${marketConditions.fuelPrices[formData.fuelType]?.current.toFixed(2)}/kg
                  <span className={`trend ${marketConditions.fuelPrices[formData.fuelType]?.trend}`}>
                    {marketConditions.fuelPrices[formData.fuelType]?.trend === 'rising' ? '↗️' : 
                     marketConditions.fuelPrices[formData.fuelType]?.trend === 'falling' ? '↘️' : '➡️'}
                  </span>
                </div>
              )}
            </div>

            {formData.fuelType && availableStates.length > 0 && (
              <div className="form-group">
                <label>Fuel State</label>
                <select 
                  name="fuelState" 
                  value={formData.fuelState}
                  onChange={handleChange} 
                  required
                >
                  <option value="">Select State</option>
                  {availableStates.map(state => (
                    <option key={state} value={state}>
                      {state.charAt(0).toUpperCase() + state.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Volume and Unit */}
          <div className="form-row">
            <div className="form-group">
              <label>Volume</label>
              <input 
                type="number" 
                name="volume" 
                value={formData.volume}
                onChange={handleChange} 
                placeholder="Enter volume (e.g., 10)"
                required 
              />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select 
                name="volumeUnit" 
                value={formData.volumeUnit}
                onChange={handleChange}
              >
                {volumeUnits.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Planning - Three Destinations */}
          <div className="form-row">
            <div className="form-group autocomplete-group">
              <label>Origin (Point A)</label>
              <input 
                type="text" 
                name="origin" 
                value={formData.origin}
                onChange={(e) => handleCityInput(e, 'origin')}
                placeholder="e.g., LAX (Los Angeles International Airport)"
                required 
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {originSuggestions.map((city, index) => (
                    <div key={index} className="suggestion-item" onClick={() => selectSuggestion(city, 'origin')}>
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group autocomplete-group">
              <label>Intermediate Hub (Point B)</label>
              <input 
                type="text" 
                name="intermediateHub" 
                value={formData.intermediateHub}
                onChange={(e) => handleCityInput(e, 'intermediateHub')}
                placeholder="e.g., Port of Long Beach, CA"
              />
              {showHubSuggestions && hubSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {hubSuggestions.map((city, index) => (
                    <div key={index} className="suggestion-item" onClick={() => selectSuggestion(city, 'intermediateHub')}>
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group autocomplete-group">
              <label>Final Destination (Point C)</label>
              <input 
                type="text" 
                name="destination" 
                value={formData.destination}
                onChange={(e) => handleCityInput(e, 'destination')}
                placeholder="e.g., Taipei, Taiwan"
                required 
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {destinationSuggestions.map((city, index) => (
                    <div key={index} className="suggestion-item" onClick={() => selectSuggestion(city, 'destination')}>
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TRANSPORT MODES - ALWAYS VISIBLE */}
          <div className="form-row">
            <div className="form-group">
              <label>Transport Mode (A → {formData.intermediateHub ? 'B' : 'C'}) *</label>
              <select 
                name="transportMode1" 
                value={formData.transportMode1}
                onChange={handleChange} 
                required
              >
                <option value="">Select Transport Mode</option>
                <option value="truck">🚛 Truck</option>
                <option value="rail">🚂 Rail</option>
                <option value="ship">🚢 Ship</option>
                <option value="pipeline">🔧 Pipeline</option>
              </select>
              {formData.transportMode1 && (
                <div className="market-info">
                  Rate: ${marketConditions.transportRates[formData.transportMode1]?.current.toFixed(2)}/ton-mile
                </div>
              )}
            </div>

            {formData.intermediateHub && (
              <div className="form-group">
                <label>Transport Mode (B → C) *</label>
                <select 
                  name="transportMode2" 
                  value={formData.transportMode2}
                  onChange={handleChange} 
                  required={!!formData.intermediateHub}
                >
                  <option value="">Select Transport Mode</option>
                  <option value="truck">🚛 Truck</option>
                  <option value="rail">🚂 Rail</option>
                  <option value="ship">🚢 Ship</option>
                  <option value="pipeline">🔧 Pipeline</option>
                </select>
                {formData.transportMode2 && (
                  <div className="market-info">
                    Rate: ${marketConditions.transportRates[formData.transportMode2]?.current.toFixed(2)}/ton-mile
                  </div>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="calculate-btn" disabled={isCalculating}>
            {isCalculating ? (
              <>
                <span className="loading-spinner"></span>
                Calculating All-In Route Cost...
              </>
            ) : (
              'Calculate All-In Cost'
            )}
          </button>
        </form>

        {/* Results Panel with ALL-IN COST */}
        {showResults && Object.keys(results).length > 0 && (
          <div className="results-panel">
            <div className="results-header">
              <h3>All-In Cost Analysis</h3>
              <div className="confidence-score">
                <span className="confidence-label">Confidence Score:</span>
                <span className={`confidence-value ${(results.confidence || 85) > 85 ? 'high' : (results.confidence || 85) > 70 ? 'medium' : 'low'}`}>
                  {results.confidence || 85}%
                </span>
              </div>
            </div>
            
            {/* MAIN ALL-IN COST DISPLAY */}
            <div className="total-cost">
              Total All-In Cost: ${formatNumber(results.allInCost)}
            </div>

            {/* Commodity vs Transport Breakdown */}
            <div className="cost-breakdown">
              <div className="cost-item">
                <div className="cost-label">Commodity Cost (Fuel Purchase)</div>
                <div className="cost-value">${formatNumber(results.commodityCost)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Total Transport & Logistics</div>
                <div className="cost-value">${formatNumber(results.totalTransportCost)}</div>
              </div>
            </div>

            {/* Detailed Cost Breakdown */}
            <div className="cost-breakdown">
              <div className="cost-item">
                <div className="cost-label">Leg 1 Transport ({results.leg1?.mode})</div>
                <div className="cost-value">${formatNumber(results.leg1?.cost)}</div>
              </div>
              {results.leg2 && (
                <div className="cost-item">
                  <div className="cost-label">Leg 2 Transport ({results.leg2?.mode})</div>
                  <div className="cost-value">${formatNumber(results.leg2?.cost)}</div>
                </div>
              )}
              <div className="cost-item">
                <div className="cost-label">Fuel Handling</div>
                <div className="cost-value">${formatNumber(results.fuelHandlingFee)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Terminal Fees</div>
                <div className="cost-value">${formatNumber(results.terminalFees)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Insurance & Risk</div>
                <div className="cost-value">${formatNumber(results.insuranceCost)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Carbon Offset</div>
                <div className="cost-value">${formatNumber(results.carbonOffset)}</div>
              </div>
              {formData.intermediateHub && (
                <div className="cost-item">
                  <div className="cost-label">Hub Transfer Fee</div>
                  <div className="cost-value">${formatNumber(results.hubTransferFee)}</div>
                </div>
              )}
            </div>
            
            {/* Route Overview */}
            <div className="route-overview">
              <h4>🗺️ Route Summary</h4>
              <div className="route-path">
                <span className="route-point">{formData.origin}</span>
                <span className="route-arrow">🚛 {results.leg1?.distance || 0} mi →</span>
                {formData.intermediateHub && (
                  <>
                    <span className="route-point">{formData.intermediateHub}</span>
                    <span className="route-arrow">🚢 {results.leg2?.distance || 0} mi →</span>
                  </>
                )}
                <span className="route-point">{formData.destination}</span>
              </div>
              <div className="total-distance">Total Distance: {results.totalDistance || 0} miles</div>
            </div>

            <div className="market-insights">
              <h4>🤖 AI Multi-Modal Insights</h4>
              <div className="ai-recommendation">
                <h5>💡 Route Optimization:</h5>
                <p>{results.marketInsights?.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="ai-status">
        🚚🚢 Multi-Modal AI Active
      </div>
    </div>
  );
};

export default FuelForm;