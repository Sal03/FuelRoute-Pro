import React, { useState, useEffect } from 'react';

// API Service - inlined to avoid external imports
const API_BASE_URL = 'http://localhost:5001/api';

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API functions
const checkApiHealth = () => makeRequest('/health');
const getFuelTypes = () => makeRequest('/fuel-types');
const getRouteHistory = () => makeRequest('/routes');
const calculateRouteCost = (routeData) => makeRequest('/calculate-cost', {
  method: 'POST',
  body: JSON.stringify(routeData),
});

const FuelRouteApp = () => {
  // Form state
  const [formData, setFormData] = useState({
    fuelType: 'hydrogen',
    volume: '',
    origin: '',
    destination: '',
    intermediateHub: '',
    transportMode1: 'truck',
    transportMode2: 'truck',
  });

  // App state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fuelTypes, setFuelTypes] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');

  // Predefined locations
  const locations = [
    'LAX (Los Angeles International Airport), CA',
    'Port of Long Beach, CA',
    'Port of Los Angeles, CA',
    'Taipei, Taiwan',
    'Taoyuan International Airport, Taiwan',
    'Kaohsiung Port, Taiwan',
    'Seattle, WA',
    'Portland, OR',
    'San Francisco, CA',
    'Houston, TX',
    'New York, NY',
    'Chicago, IL',
    'Denver, CO',
    'Miami, FL'
  ];

  const transportModes = [
    { value: 'truck', label: 'Truck (2.80/ton-mile)' },
    { value: 'rail', label: 'Rail (1.10/ton-mile)' },
    { value: 'ship', label: 'Ship (0.65/ton-mile)' },
    { value: 'pipeline', label: 'Pipeline (0.40/ton-mile)' }
  ];

  // Check API health on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check API health
        await checkApiHealth();
        setApiStatus('connected');

        // Load fuel types
        const fuelTypesResponse = await getFuelTypes();
        setFuelTypes(fuelTypesResponse.data || []);

        // Load route history
        const historyResponse = await getRouteHistory();
        setRouteHistory(historyResponse.data || []);

      } catch (error) {
        console.error('Failed to initialize app:', error);
        setApiStatus('error');
        setError('Unable to connect to backend server. Make sure it\'s running on port 5001.');
      }
    };

    initializeApp();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Validate required fields
      if (!formData.fuelType || !formData.volume || !formData.origin || !formData.destination) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare data for API
      const requestData = {
        ...formData,
        volume: parseFloat(formData.volume)
      };

      console.log('Sending request:', requestData);

      // Call API
      const response = await calculateRouteCost(requestData);
      
      console.log('Received response:', response);
      setResult(response);

      // Refresh route history
      const historyResponse = await getRouteHistory();
      setRouteHistory(historyResponse.data || []);

    } catch (error) {
      setError(error.message);
      console.error('Calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // API Status indicator
  const ApiStatusIndicator = () => (
    <div className={`flex items-center gap-2 mb-4 p-2 rounded ${
      apiStatus === 'connected' ? 'bg-green-100 text-green-800' :
      apiStatus === 'error' ? 'bg-red-100 text-red-800' :
      'bg-yellow-100 text-yellow-800'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        apiStatus === 'connected' ? 'bg-green-500' :
        apiStatus === 'error' ? 'bg-red-500' :
        'bg-yellow-500'
      }`}></div>
      <span className="text-sm font-medium">
        {apiStatus === 'connected' ? 'Backend Connected' :
         apiStatus === 'error' ? 'Backend Disconnected' :
         'Checking Connection...'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          FuelRoute Pro Cost Calculator
        </h1>
        
        <ApiStatusIndicator />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Calculate Transport Cost</h2>
            
            <div className="space-y-4">
              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type *
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {fuelTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume (tonnes) *
                </label>
                <input
                  type="number"
                  name="volume"
                  value={formData.volume}
                  onChange={handleInputChange}
                  min="0.1"
                  step="0.1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter volume in tonnes"
                  required
                />
              </div>

              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin *
                </label>
                <select
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select origin</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select destination</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Intermediate Hub */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intermediate Hub (Optional)
                </label>
                <select
                  name="intermediateHub"
                  value={formData.intermediateHub}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No intermediate hub</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Transport Mode 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transport Mode {formData.intermediateHub ? '(First Leg)' : ''}
                </label>
                <select
                  name="transportMode1"
                  value={formData.transportMode1}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {transportModes.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>

              {/* Transport Mode 2 - only show if intermediate hub is selected */}
              {formData.intermediateHub && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transport Mode (Second Leg)
                  </label>
                  <select
                    name="transportMode2"
                    value={formData.transportMode2}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {transportModes.map(mode => (
                      <option key={mode.value} value={mode.value}>{mode.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || apiStatus !== 'connected'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Calculating...' : 'Calculate Cost'}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Calculation Results */}
            {result && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-700">
                  Cost Calculation Results
                </h3>
                
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-green-600">
                    Total Cost: {formatCurrency(result.data.totalCost)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Base Cost:</strong><br />
                      {formatCurrency(result.data.baseCost)}
                    </div>
                    <div>
                      <strong>Distance:</strong><br />
                      {result.data.distance} miles
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Cost Breakdown:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Fuel Handling Fee:</span>
                        <span>{formatCurrency(result.data.costBreakdown.fuelHandlingFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terminal Fees:</span>
                        <span>{formatCurrency(result.data.costBreakdown.terminalFees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hub Transfer Fee:</span>
                        <span>{formatCurrency(result.data.costBreakdown.hubTransferFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insurance Cost:</span>
                        <span>{formatCurrency(result.data.costBreakdown.insuranceCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Carbon Offset:</span>
                        <span>{formatCurrency(result.data.costBreakdown.carbonOffset)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Route Legs */}
                  {result.data.legs && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Route Details:</h4>
                      <div className="space-y-1 text-sm">
                        <div>Leg 1: {result.data.legs.leg1.distance} miles via {result.data.legs.leg1.mode} - {formatCurrency(result.data.legs.leg1.cost)}</div>
                        <div>Leg 2: {result.data.legs.leg2.distance} miles via {result.data.legs.leg2.mode} - {formatCurrency(result.data.legs.leg2.cost)}</div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-4">
                    Confidence: {result.data.confidence}% | Calculated: {formatDate(result.data.timestamp)}
                  </div>
                </div>
              </div>
            )}

            {/* Route History */}
            {routeHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Calculations</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {routeHistory.slice(0, 5).map((route) => (
                    <div key={route._id} className="border-b pb-2 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="text-sm">
                          <div className="font-medium">
                            {route.origin} → {route.destination}
                          </div>
                          <div className="text-gray-600">
                            {route.volume} tonnes {route.fuelType}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-bold text-green-600">
                            {formatCurrency(route.calculatedCost)}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {formatDate(route.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelRouteApp;