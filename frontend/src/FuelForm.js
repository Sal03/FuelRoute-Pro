import React, { useState, useEffect } from 'react';
import './FuelForm.css';

const FuelForm = () => {
  const [formData, setFormData] = useState({
    fuelType: '',
    fuelState: '',
    volume: '',
    volumeUnit: 'tonnes',
    origin: '',
    intermediateHub: '',
    destination: '',
    transportMode1: '', // A to B
    transportMode2: ''  // B to C
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
  const [isMultiLeg, setIsMultiLeg] = useState(false);

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
    // Taiwan destinations
    { name: 'Taipei, Taiwan', coords: [25.0330, 121.5654], hubType: 'airport', region: 'Asia Pacific' },
    { name: 'Taoyuan International Airport, Taiwan', coords: [25.0797, 121.2342], hubType: 'airport', region: 'Asia Pacific' },
    { name: 'Kaohsiung Port, Taiwan', coords: [22.6273, 120.3014], hubType: 'port', region: 'Asia Pacific' },
    { name: 'Taichung, Taiwan', coords: [24.1477, 120.6736], hubType: 'city', region: 'Asia Pacific' },
    // Additional international hubs
    { name: 'Vancouver Port, BC', coords: [49.2827, -123.1207], hubType: 'port', region: 'Canada West Coast' },
    { name: 'Tokyo Port, Japan', coords: [35.6762, 139.6503], hubType: 'port', region: 'Asia Pacific' },
    { name: 'Shanghai Port, China', coords: [31.2304, 121.4737], hubType: 'port', region: 'Asia Pacific' },
    { name: 'Singapore Port', coords: [1.3521, 103.8198], hubType: 'port', region: 'Asia Pacific' }
  ];

  // Smart hub suggestions based on origin and destination
  const getSmartHubSuggestions = (origin, destination) => {
    const originData = cityDatabase.find(city => city.name === origin);
    const destData = cityDatabase.find(city => city.name === destination);
    
    if (!originData || !destData) return [];
    
    const isTransPacific = originData.region.includes('US') && destData.region === 'Asia Pacific';
    const isTransAtlantic = originData.region.includes('US') && (destData.region === 'Europe' || destData.region === 'UK');
    
    let suggestedHubs = [];
    
    if (isTransPacific) {
      // For trans-Pacific routes, suggest West Coast ports
      suggestedHubs = cityDatabase.filter(city => 
        (city.hubType === 'port' && city.region === 'US West Coast') ||
        (city.hubType === 'port' && city.region === 'Canada West Coast')
      );
    } else if (isTransAtlantic) {
      // For trans-Atlantic routes, suggest East Coast ports
      suggestedHubs = cityDatabase.filter(city => 
        city.hubType === 'port' && city.region === 'US East Coast'
      );
    } else {
      // For domestic routes, suggest rail hubs
      suggestedHubs = cityDatabase.filter(city => 
        city.hubType === 'rail' || city.hubType === 'port'
      );
    }
    
    return suggestedHubs.slice(0, 5);
  };

  // Check if route requires multi-leg transport
  const requiresMultiLeg = (origin, destination) => {
    const originData = cityDatabase.find(city => city.name === origin);
    const destData = cityDatabase.find(city => city.name === destination);
    
    if (!originData || !destData) return false;
    
    // Trans-Pacific routes definitely need multi-leg
    const isTransPacific = originData.region.includes('US') && destData.region === 'Asia Pacific';
    const isTransAtlantic = originData.region.includes('US') && (destData.region === 'Europe' || destData.region === 'UK');
    
    return isTransPacific || isTransAtlantic;
  };

  // Real-time market simulation data
  const [marketConditions] = useState({
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
  });

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

  // Get valid transport modes for each leg
  const getValidTransportModes = (origin, destination, isFirstLeg = true) => {
    const originData = cityDatabase.find(city => city.name === origin);
    const destData = cityDatabase.find(city => city.name === destination);
    
    if (!originData || !destData) {
      return ['truck', 'rail', 'ship', 'pipeline'];
    }
    
    const isCrossingOcean = originData.region !== destData.region && 
                           (originData.region.includes('US') && destData.region === 'Asia Pacific');
    
    if (isCrossingOcean && !isFirstLeg) {
      // Second leg crossing ocean - only ship makes sense
      return ['ship'];
    } else if (isFirstLeg && isCrossingOcean) {
      // First leg to get to port - truck, rail
      return ['truck', 'rail'];
    } else {
      // Domestic or same region
      return ['truck', 'rail', 'ship', 'pipeline'];
    }
  };

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

  // Get transport mode recommendation based on volume
  const getTransportModeRecommendation = (volume, volumeUnit) => {
    const volumeUnit_obj = volumeUnits.find(unit => unit.value === volumeUnit);
    const volumeInTonnes = volume * volumeUnit_obj.factor;
    
    if (volumeInTonnes >= 10) {
      return {
        show: true,
        message: "💡 For 10+ tonnes: Rail or Ship transport recommended for cost efficiency and environmental benefits.",
        primaryRecommendation: "rail",
        secondaryRecommendation: "ship",
        reasoning: "Large volumes benefit from bulk transport modes with lower per-unit costs."
      };
    } else if (volumeInTonnes >= 5) {
      return {
        show: true,
        message: "🚛 For 5-10 tonnes: Truck transport offers good balance of cost and flexibility.",
        primaryRecommendation: "truck",
        reasoning: "Medium volumes are well-suited for road transport."
      };
    } else {
      return {
        show: true,
        message: "🚐 For smaller volumes: Truck transport is most practical for door-to-door delivery.",
        primaryRecommendation: "truck",
        reasoning: "Small volumes require flexible, direct transport."
      };
    }
  };

  // Multi-leg cost calculation
  const calculateMultiLegCost = (data) => {
    const fuel = fuelOptions[data.fuelType];
    const market = marketConditions;
    
    const volumeUnit = volumeUnits.find(unit => unit.value === data.volumeUnit);
    let volumeInTonnes = data.volume * volumeUnit.factor;
    
    // Leg 1: Origin to Hub
    const distance1 = calculateDistance(data.origin, data.intermediateHub);
    const rate1 = market.transportRates[data.transportMode1].current;
    const baseCost1 = distance1 * rate1 * volumeInTonnes * fuel.regulatoryFactor;
    
    // Leg 2: Hub to Destination
    const distance2 = calculateDistance(data.intermediateHub, data.destination);
    const rate2 = market.transportRates[data.transportMode2].current;
    const baseCost2 = distance2 * rate2 * volumeInTonnes * fuel.regulatoryFactor;
    
    // Additional costs
    const fuelHandlingFee = volumeInTonnes * 75 * (fuel.storageComplexity === 'high' ? 1.3 : 1.15);
    const terminalFees = 400 + 650; // Hub transfer + destination
    const hubTransferFee = volumeInTonnes * 45; // Cost to transfer between modes
    const insuranceCost = ((baseCost1 + baseCost2) * 0.03) * market.economic.insuranceRates;
    const carbonOffset = volumeInTonnes * 12;
    
    const totalDistance = distance1 + distance2;
    const totalBaseCost = baseCost1 + baseCost2;
    const totalCost = totalBaseCost + fuelHandlingFee + terminalFees + hubTransferFee + insuranceCost + carbonOffset;
    
    // Confidence score (lower for multi-leg complexity)
    const confidenceScore = Math.round(0.8 * 85); // 68% for multi-leg routes
    
    return {
      isMultiLeg: true,
      leg1: { distance: distance1, cost: baseCost1, mode: data.transportMode1 },
      leg2: { distance: distance2, cost: baseCost2, mode: data.transportMode2 },
      totalDistance,
      totalBaseCost,
      fuelHandlingFee,
      terminalFees,
      hubTransferFee,
      insuranceCost,
      carbonOffset,
      totalCost,
      confidence: confidenceScore,
      hub: data.intermediateHub,
      marketInsights: {
        fuelTrend: market.fuelPrices[data.fuelType]?.trend,
        recommendation: "Multi-leg transport optimized for international shipping. Hub transfer ensures efficient mode switching."
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

    // Check if multi-leg is needed when origin/destination changes
    if (name === 'origin' || name === 'destination') {
      const newFormData = { ...formData, [name]: value };
      if (newFormData.origin && newFormData.destination) {
        const needsMultiLeg = requiresMultiLeg(newFormData.origin, newFormData.destination);
        setIsMultiLeg(needsMultiLeg);
        
        if (needsMultiLeg && !newFormData.intermediateHub) {
          // Auto-suggest intermediate hub
          const suggestions = getSmartHubSuggestions(newFormData.origin, newFormData.destination);
          if (suggestions.length > 0) {
            setFormData(prev => ({ ...prev, intermediateHub: suggestions[0].name }));
          }
        }
      }
    }
  };

  const handleCityInput = (e, field) => {
    const value = e.target.value;
    setFormData({ ...formData, [field]: value });

    if (value.length > 0) {
      let filtered = [];
      
      if (field === 'intermediateHub') {
        // Smart suggestions for intermediate hub
        const smartHubs = getSmartHubSuggestions(formData.origin, formData.destination);
        filtered = smartHubs.filter(city =>
          city.name.toLowerCase().includes(value.toLowerCase())
        );
      } else {
        filtered = cityDatabase.filter(city =>
          city.name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5);
      }

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
    setIsCalculating(true);
    setShowResults(false);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const calculationResults = calculateMultiLegCost(formData);
    setResults(calculationResults);
    setShowResults(true);
    setIsCalculating(false);
  };

  const availableStates = formData.fuelType ? fuelOptions[formData.fuelType]?.states || [] : [];
  const transportRecommendation = formData.volume && formData.volumeUnit ? 
    getTransportModeRecommendation(parseFloat(formData.volume), formData.volumeUnit) : 
    { show: false };

  const validModes1 = getValidTransportModes(formData.origin, formData.intermediateHub, true);
  const validModes2 = getValidTransportModes(formData.intermediateHub, formData.destination, false);

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

          {/* Transport Mode Recommendation */}
          {transportRecommendation.show && (
            <div className="transport-recommendation">
              <div className="recommendation-content">
                <p>{transportRecommendation.message}</p>
                {transportRecommendation.reasoning && (
                  <small>{transportRecommendation.reasoning}</small>
                )}
              </div>
            </div>
          )}

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
                required 
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

          {/* Transport Modes for Each Leg */}
          <div className="form-row">
            <div className="form-group">
              <label>Transport Mode (A → B)</label>
              <select 
                name="transportMode1" 
                value={formData.transportMode1}
                onChange={handleChange} 
                required
              >
                <option value="">Select Transport Mode</option>
                <option value="truck">Truck</option>
                <option value="rail">Rail</option>
                <option value="pipeline">Pipeline</option>
              </select>
              {formData.transportMode1 && (
                <div className="market-info">
                  Rate: ${marketConditions.transportRates[formData.transportMode1]?.current.toFixed(2)}/ton-mile
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Transport Mode (B → C)</label>
              <select 
                name="transportMode2" 
                value={formData.transportMode2}
                onChange={handleChange} 
                required
              >
                <option value="">Select Transport Mode</option>
                <option value="truck">Truck</option>
                <option value="rail">Rail</option>
                <option value="ship">Ship</option>
                <option value="pipeline">Pipeline</option>
              </select>
              {formData.transportMode2 && (
                <div className="market-info">
                  Rate: ${marketConditions.transportRates[formData.transportMode2]?.current.toFixed(2)}/ton-mile
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="calculate-btn" disabled={isCalculating}>
            {isCalculating ? (
              <>
                <span className="loading-spinner"></span>
                Calculating Multi-Leg Route...
              </>
            ) : (
              'Calculate Multi-Modal Route'
            )}
          </button>
        </form>

        {/* Results Panel */}
        {showResults && (
          <div className="results-panel">
            <div className="results-header">
              <h3>Multi-Leg Route Analysis</h3>
              <div className="confidence-score">
                <span className="confidence-label">Confidence Score:</span>
                <span className={`confidence-value ${results.confidence > 85 ? 'high' : results.confidence > 70 ? 'medium' : 'low'}`}>
                  {results.confidence}%
                </span>
              </div>
            </div>
            
            {/* Route Overview */}
            <div className="route-overview">
              <h4>🗺️ Route Summary</h4>
              <div className="route-path">
                <span className="route-point">{formData.origin}</span>
                <span className="route-arrow">🚛 {results.leg1?.distance} mi →</span>
                <span className="route-point">{results.hub}</span>
                <span className="route-arrow">🚢 {results.leg2?.distance} mi →</span>
                <span className="route-point">{formData.destination}</span>
              </div>
              <div className="total-distance">Total Distance: {results.totalDistance} miles</div>
            </div>
            
            <div className="cost-breakdown">
              <div className="cost-item">
                <div className="cost-label">Leg 1 Transport ({results.leg1?.mode})</div>
                <div className="cost-value">${results.leg1?.cost?.toFixed(2)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Leg 2 Transport ({results.leg2?.mode})</div>
                <div className="cost-value">${results.leg2?.cost?.toFixed(2)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Hub Transfer Fee</div>
                <div className="cost-value">${results.hubTransferFee?.toFixed(2)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Fuel Handling</div>
                <div className="cost-value">${results.fuelHandlingFee?.toFixed(2)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Terminal Fees</div>
                <div className="cost-value">${results.terminalFees?.toFixed(2)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Insurance & Risk</div>
                <div className="cost-value">${results.insuranceCost?.toFixed(2)}</div>
              </div>
              <div className="cost-item">
                <div className="cost-label">Carbon Offset</div>
                <div className="cost-value">${results.carbonOffset?.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="total-cost">
              Total Multi-Leg Cost: ${results.totalCost?.toFixed(2)}
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