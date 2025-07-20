import React, { useState, useEffect } from 'react';
import './FuelForm.css';
import PriceDisplay from './components/PriceDisplay';
import RoutingMap from './components/RoutingMap';

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
  const [realTimePrices, setRealTimePrices] = useState(null);
  const [results, setResults] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeMapData, setRouteMapData] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // US Port/Hub database with coordinates and infrastructure capabilities
  const cityDatabase = [
    // Gulf Coast Ports
    { 
      name: 'Houston, TX', 
      coords: [29.7604, -95.3698], 
      hubType: 'port', 
      region: 'US Gulf Coast',
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      portCode: 'USTXH',
      facilities: ['petrochemical', 'container', 'bulk', 'energy']
    },
    { 
      name: 'New Orleans, LA', 
      coords: [29.9511, -90.0715], 
      hubType: 'port', 
      region: 'US Gulf Coast',
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      portCode: 'USLNO',
      facilities: ['bulk', 'container', 'energy', 'grain']
    },
    { 
      name: 'Mobile, AL', 
      coords: [30.6954, -88.0399], 
      hubType: 'port', 
      region: 'US Gulf Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USMOB',
      facilities: ['container', 'bulk', 'automotive']
    },
    { 
      name: 'Tampa Bay, FL', 
      coords: [27.9506, -82.4572], 
      hubType: 'port', 
      region: 'US Gulf Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USTPA',
      facilities: ['bulk', 'container', 'energy', 'phosphate']
    },
    
    // East Coast Ports
    { 
      name: 'Savannah, GA', 
      coords: [32.0835, -81.0998], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USSAV',
      facilities: ['container', 'bulk', 'automotive']
    },
    { 
      name: 'Jacksonville, FL', 
      coords: [30.3322, -81.6557], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USJAX',
      facilities: ['container', 'automotive', 'bulk']
    },
    { 
      name: 'New York/NJ', 
      coords: [40.6892, -74.0445], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USNYC',
      facilities: ['container', 'bulk', 'energy', 'automotive']
    },
    { 
      name: 'Philadelphia, PA', 
      coords: [39.9526, -75.1652], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USPHL',
      facilities: ['bulk', 'container', 'energy', 'steel']
    },
    { 
      name: 'Norfolk, VA', 
      coords: [36.8508, -76.2859], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USNFK',
      facilities: ['container', 'bulk', 'coal', 'military']
    },
    { 
      name: 'Miami, FL', 
      coords: [25.7617, -80.1918], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USMIA',
      facilities: ['container', 'cruise', 'cargo']
    },
    { 
      name: 'Boston, MA', 
      coords: [42.3601, -71.0589], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USBOS',
      facilities: ['container', 'bulk', 'energy', 'fish']
    },
    
    // West Coast Ports
    { 
      name: 'Long Beach, CA', 
      coords: [33.7701, -118.1937], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USLGB',
      facilities: ['container', 'bulk', 'automotive', 'energy']
    },
    { 
      name: 'Los Angeles, CA', 
      coords: [34.0522, -118.2437], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USLAX',
      facilities: ['container', 'bulk', 'automotive', 'energy']
    },
    { 
      name: 'Seattle, WA', 
      coords: [47.6062, -122.3321], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USSEA',
      facilities: ['container', 'bulk', 'energy', 'fish']
    },
    { 
      name: 'Bellevue, WA', 
      coords: [47.6101, -122.2015], 
      hubType: 'city', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail'],
      portCode: 'USBEL',
      facilities: ['distribution', 'logistics', 'tech']
    },
    { 
      name: 'Portland, OR', 
      coords: [45.5152, -122.6784], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USPOR',
      facilities: ['bulk', 'container', 'automotive', 'grain']
    },
    { 
      name: 'San Francisco/Oakland, CA', 
      coords: [37.8044, -122.2712], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USFRO',
      facilities: ['container', 'bulk', 'automotive']
    },
    
    // Inland Hubs
    { 
      name: 'Chicago, IL', 
      coords: [41.8781, -87.6298], 
      hubType: 'rail', 
      region: 'US Midwest',
      infrastructure: ['truck', 'rail', 'pipeline'],
      portCode: 'USCHI',
      facilities: ['rail_yard', 'distribution', 'commodity_exchange']
    },
    { 
      name: 'St. Louis, MO', 
      coords: [38.6270, -90.1994], 
      hubType: 'inland', 
      region: 'US Midwest',
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      portCode: 'USSTL',
      facilities: ['river_port', 'rail_yard', 'distribution']
    },
    { 
      name: 'Memphis, TN', 
      coords: [35.1495, -90.0490], 
      hubType: 'inland', 
      region: 'US Southeast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USMEM',
      facilities: ['distribution', 'rail_yard', 'river_port']
    },
    { 
      name: 'Duluth-Superior, MN/WI', 
      coords: [46.7867, -92.1005], 
      hubType: 'inland', 
      region: 'US Great Lakes',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USDLH',
      facilities: ['bulk', 'grain', 'iron_ore', 'coal']
    }
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

  // Enhanced cost calculation with real-time pricing
  const calculateEnhancedCost = (data) => {
    const fuel = fuelOptions[data.fuelType];
    const market = marketConditions;
    
    const volumeUnit = volumeUnits.find(unit => unit.value === data.volumeUnit);
    let volumeInTonnes = parseFloat(data.volume) * volumeUnit.factor;
    const volumeInKg = volumeInTonnes * 1000;
    
    // 1. COMMODITY COST with real-time pricing if available
    let commodityPrice;
    if (realTimePrices && realTimePrices.price) {
      // Use real-time price from API
      commodityPrice = realTimePrices.price;
      console.log(`Using real-time price: $${commodityPrice}/kg`);
    } else {
      // Fall back to static price
      commodityPrice = market.fuelPrices[data.fuelType]?.current || 4.25;
      console.log(`Using static price: $${commodityPrice}/kg`);
    }
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
      confidence: realTimePrices ? realTimePrices.confidence : 85,
      hub: data.intermediateHub,
      commodityPrice,
      marketInsights: {
        fuelTrend: market.fuelPrices[data.fuelType]?.trend,
        recommendation: realTimePrices 
          ? `Route optimized using real-time pricing data with ${realTimePrices.confidence}% confidence.` 
          : "Route optimized based on current market conditions. Commodity cost included in all-in pricing."
      },
      priceSource: realTimePrices ? 'real-time-api' : 'static-data'
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
    
    // Debug: Print payload before submit
    console.log('[DEBUG] Submitting payload to backend:', formData);
    // Validation
    if (!formData.transportMode1) {
      alert('Please select Transport Mode 1');
      return;
    }
    
    // If intermediateHub is provided, require transportMode2. Otherwise, only require transportMode2 for long/international routes.
    if (formData.intermediateHub && !formData.transportMode2) {
      alert('Please select Transport Mode 2 for the intermediate hub route');
      return;
    }

    // Make intermediateHub optional for domestic/short routes.
    // Estimate as 'short' if both origin and destination are in the US and no intermediateHub is provided.
    const isDomestic = (formData.origin && formData.destination &&
      /,\s*([A-Z]{2})$/.test(formData.origin) && /,\s*([A-Z]{2})$/.test(formData.destination));
    if (!formData.intermediateHub && !isDomestic) {
      alert('Please enter an intermediate hub for international or multi-leg routes.');
      return;
    }
    
    setIsCalculating(true);
    setShowResults(false);
    
    try {
      if (backendAPI && backendAPI.isConnected) {
        // Use backend API
        const response = await backendAPI.calculateCost(formData);
        if (response.success && response.data) {
          // Map backend response to frontend format
          const backendData = response.data;
          const mappedResults = {
            allInCost: backendData.allInCost || backendData.totalCost,
            commodityCost: backendData.commodityCost,
            totalTransportCost: backendData.totalTransportCost || backendData.transportationCost,
            
            // Map leg data
            leg1: {
              cost: backendData.legs?.leg1?.cost || backendData.transportationCost,
              distance: backendData.legs?.leg1?.distance || backendData.distance,
              mode: backendData.legs?.leg1?.mode || formData.transportMode1
            },
            leg2: backendData.legs?.leg2 ? {
              cost: backendData.legs.leg2.cost,
              distance: backendData.legs.leg2.distance,
              mode: backendData.legs.leg2.mode
            } : null,
            
            // Map other costs
            fuelHandlingFee: backendData.fuelHandlingFee || backendData.costBreakdown?.fuelHandlingFee,
            terminalFees: backendData.terminalFees || backendData.costBreakdown?.terminalFees,
            insuranceCost: backendData.insuranceCost || backendData.costBreakdown?.insurance,
            carbonOffset: backendData.carbonOffset || backendData.costBreakdown?.carbonOffset,
            hubTransferFee: backendData.hubTransferFee || backendData.costBreakdown?.hubTransferFee,
            
            // Map route data
            totalDistance: backendData.totalDistance || backendData.distance,
            
            // Map metadata
            confidence: backendData.confidence || backendData.realTimeData?.confidence,
            marketInsights: backendData.marketInsights || {
              recommendation: "Route optimized using real-time backend pricing data."
            },
            priceSource: 'real-time-api'
          };
          
          setResults(mappedResults);
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
  
  // Handle real-time price updates
  const handlePriceUpdate = (priceData) => {
    setRealTimePrices(priceData);
  };

  // Update route map data when form data changes
  const updateRouteMapData = () => {
    const getLocationData = (locationName) => {
      const location = cityDatabase.find(city => city.name === locationName);
      console.log(`Looking for location: "${locationName}", found:`, location);
      return location ? { name: locationName, coords: location.coords } : null;
    };

    console.log('Updating route map data with form data:', {
      origin: formData.origin,
      destination: formData.destination,
      intermediateHub: formData.intermediateHub
    });

    if (formData.origin && formData.destination) {
      const originData = getLocationData(formData.origin);
      const destinationData = getLocationData(formData.destination);
      const hubData = formData.intermediateHub ? getLocationData(formData.intermediateHub) : null;

      const mapData = {
        fuelType: formData.fuelType,
        volume: formData.volume,
        volumeUnit: formData.volumeUnit,
        origin: originData,
        destination: destinationData,
        intermediateHub: hubData,
        transportMode1: formData.transportMode1,
        transportMode2: formData.transportMode2
      };
      
      console.log('Setting route map data:', mapData);
      setRouteMapData(mapData);
      setShowMap(true);
    } else {
      console.log('Not showing map - missing origin or destination');
      setShowMap(false);
    }
  };

  // Watch for form data changes to update map
  useEffect(() => {
    updateRouteMapData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.origin, formData.destination, formData.intermediateHub, formData.fuelType, formData.volume, formData.transportMode1, formData.transportMode2]);

  return (
    <div className="calculator-section">
      <div className="calculator-container">
        <div className="calculator-header">
          <h2>AI-Powered Multi-Leg Fuel Transportation Calculator</h2>
          <p>Calculate complex routes with intermediate hubs and multiple transport modes</p>
          
          {/* Real-Time Price Display Component */}
          <PriceDisplay 
            selectedFuel={formData.fuelType} 
            onPriceUpdate={handlePriceUpdate}
          />
          
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
                {results.priceSource && (
                  <span className="price-source">
                    {results.priceSource === 'real-time-api' ? '(Real-time pricing)' : '(Static pricing)'}
                  </span>
                )}
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
                {results.priceSource && (
                  <span className="price-source">
                    {results.priceSource === 'real-time-api' ? '(Real-time pricing)' : '(Static pricing)'}
                  </span>
                )}
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
              {results.leg1?.truckInfo && (
                <div className="truck-info">
                  <div className="truck-details">
                    🚛 <strong>{results.leg1.truckInfo.trucksNeeded} trucks needed</strong> 
                    ({results.leg1.truckInfo.capacityPerTruck}t capacity each, {results.leg1.truckInfo.utilizationRate}% utilization)
                  </div>
                </div>
              )}
              {results.leg2 && (
                <div className="cost-item">
                  <div className="cost-label">Leg 2 Transport ({results.leg2?.mode})</div>
                  <div className="cost-value">${formatNumber(results.leg2?.cost)}</div>
                </div>
              )}
              {results.leg2?.truckInfo && (
                <div className="truck-info">
                  <div className="truck-details">
                    🚛 <strong>{results.leg2.truckInfo.trucksNeeded} trucks needed</strong> 
                    ({results.leg2.truckInfo.capacityPerTruck}t capacity each, {results.leg2.truckInfo.utilizationRate}% utilization)
                  </div>
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

            {/* Interactive Routing Map */}
            {showMap && routeMapData && (
              <RoutingMap 
                routeData={routeMapData}
                showRoute={true}
              />
            )}

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