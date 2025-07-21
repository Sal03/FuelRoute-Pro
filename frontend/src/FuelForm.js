import React, { useState, useEffect } from 'react';
import './FuelForm.css';
import PriceDisplay from './components/PriceDisplay';
import RoutingMap from './components/RoutingMap';
import RouteMap from './components/RouteMap';

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
  const [marketConditions, setMarketConditions] = useState(null);
  const [routeMapData, setRouteMapData] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [emergencyContactInfo, setEmergencyContactInfo] = useState('');
  const [specialHandlingRequirements, setSpecialHandlingRequirements] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('standard');
  const [insuranceLevel, setInsuranceLevel] = useState('standard');
  const [carbonOffsetPreference, setCarbonOffsetPreference] = useState('standard');

  // Enhanced US Port/Hub database with coordinates and infrastructure capabilities
  const cityDatabase = [
    // Gulf Coast Ports
    { 
      name: 'Houston, TX', 
      coords: [29.7604, -95.3698], 
      hubType: 'port', 
      region: 'US Gulf Coast',
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      portCode: 'USTXH',
      facilities: ['petrochemical', 'container', 'bulk', 'energy'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression', 'spill_containment'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'hurricane_prepared'
    },
    { 
      name: 'New Orleans, LA', 
      coords: [29.9511, -90.0715], 
      hubType: 'port', 
      region: 'US Gulf Coast',
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      portCode: 'USLNO',
      facilities: ['bulk', 'container', 'energy', 'grain'],
      specializedHandling: ['ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'medical_facilities'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'hurricane_prepared'
    },
    { 
      name: 'Mobile, AL', 
      coords: [30.6954, -88.0399], 
      hubType: 'port', 
      region: 'US Gulf Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USMOB',
      facilities: ['container', 'bulk', 'automotive'],
      specializedHandling: ['methanol'],
      emergencyServices: ['coast_guard', 'hazmat_response'],
      operatingHours: '16/5',
      securityLevel: 'medium',
      weatherResilience: 'storm_prepared'
    },
    { 
      name: 'Tampa Bay, FL', 
      coords: [27.9506, -82.4572], 
      hubType: 'port', 
      region: 'US Gulf Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USTPA',
      facilities: ['bulk', 'container', 'energy', 'phosphate'],
      specializedHandling: ['ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression'],
      operatingHours: '20/6',
      securityLevel: 'medium',
      weatherResilience: 'hurricane_prepared'
    },
    
    // East Coast Ports
    { 
      name: 'Savannah, GA', 
      coords: [32.0835, -81.0998], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USSAV',
      facilities: ['container', 'bulk', 'automotive'],
      specializedHandling: ['methanol'],
      emergencyServices: ['hazmat_response', 'medical_facilities'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'storm_prepared'
    },
    { 
      name: 'Jacksonville, FL', 
      coords: [30.3322, -81.6557], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USJAX',
      facilities: ['container', 'automotive', 'bulk'],
      specializedHandling: ['methanol'],
      emergencyServices: ['coast_guard', 'hazmat_response'],
      operatingHours: '18/6',
      securityLevel: 'medium',
      weatherResilience: 'hurricane_prepared'
    },
    { 
      name: 'New York/NJ', 
      coords: [40.6892, -74.0445], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USNYC',
      facilities: ['container', 'bulk', 'energy', 'automotive'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression', 'medical_facilities', 'spill_containment'],
      operatingHours: '24/7',
      securityLevel: 'maximum',
      weatherResilience: 'winter_prepared'
    },
    { 
      name: 'Philadelphia, PA', 
      coords: [39.9526, -75.1652], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USPHL',
      facilities: ['bulk', 'container', 'energy', 'steel'],
      specializedHandling: ['hydrogen', 'ammonia'],
      emergencyServices: ['hazmat_response', 'fire_suppression'],
      operatingHours: '24/6',
      securityLevel: 'high',
      weatherResilience: 'winter_prepared'
    },
    { 
      name: 'Norfolk, VA', 
      coords: [36.8508, -76.2859], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USNFK',
      facilities: ['container', 'bulk', 'coal', 'military'],
      specializedHandling: ['ammonia'],
      emergencyServices: ['military_support', 'hazmat_response'],
      operatingHours: '24/7',
      securityLevel: 'maximum',
      weatherResilience: 'storm_prepared'
    },
    { 
      name: 'Miami, FL', 
      coords: [25.7617, -80.1918], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USMIA',
      facilities: ['container', 'cruise', 'cargo'],
      specializedHandling: ['methanol'],
      emergencyServices: ['coast_guard', 'medical_facilities'],
      operatingHours: '20/7',
      securityLevel: 'medium',
      weatherResilience: 'hurricane_prepared'
    },
    { 
      name: 'Boston, MA', 
      coords: [42.3601, -71.0589], 
      hubType: 'port', 
      region: 'US East Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USBOS',
      facilities: ['container', 'bulk', 'energy', 'fish'],
      specializedHandling: ['ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'medical_facilities'],
      operatingHours: '18/6',
      securityLevel: 'high',
      weatherResilience: 'winter_prepared'
    },
    
    // West Coast Ports
    { 
      name: 'Long Beach, CA', 
      coords: [33.7701, -118.1937], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USLGB',
      facilities: ['container', 'bulk', 'automotive', 'energy'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression', 'spill_containment'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'earthquake_prepared'
    },
    { 
      name: 'Los Angeles, CA', 
      coords: [34.0522, -118.2437], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USLAX',
      facilities: ['container', 'bulk', 'automotive', 'energy'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression', 'medical_facilities'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'earthquake_prepared'
    },
    { 
      name: 'Seattle, WA', 
      coords: [47.6062, -122.3321], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USSEA',
      facilities: ['container', 'bulk', 'energy', 'fish'],
      specializedHandling: ['hydrogen', 'ammonia'],
      emergencyServices: ['coast_guard', 'hazmat_response'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'rain_prepared'
    },
    { 
      name: 'Seattle-Tacoma International Airport, WA', 
      coords: [47.4502, -122.3088], 
      hubType: 'airport', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'air'],
      portCode: 'USSTA',
      facilities: ['cargo', 'passenger', 'freight'],
      specializedHandling: ['small_volume_hydrogen'],
      emergencyServices: ['fire_suppression', 'medical_facilities'],
      operatingHours: '24/7',
      securityLevel: 'maximum',
      weatherResilience: 'all_weather'
    },
    { 
      name: 'Bellevue, WA', 
      coords: [47.6101, -122.2015], 
      hubType: 'city', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail'],
      portCode: 'USBEL',
      facilities: ['distribution', 'logistics', 'tech'],
      specializedHandling: ['tech_grade_methanol'],
      emergencyServices: ['fire_suppression'],
      operatingHours: '16/5',
      securityLevel: 'medium',
      weatherResilience: 'standard'
    },
    { 
      name: 'Portland, OR', 
      coords: [45.5152, -122.6784], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USPOR',
      facilities: ['bulk', 'container', 'automotive', 'grain'],
      specializedHandling: ['ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'river_rescue'],
      operatingHours: '20/6',
      securityLevel: 'medium',
      weatherResilience: 'rain_prepared'
    },
    { 
      name: 'San Francisco/Oakland, CA', 
      coords: [37.8044, -122.2712], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USFRO',
      facilities: ['container', 'bulk', 'automotive'],
      specializedHandling: ['methanol'],
      emergencyServices: ['hazmat_response', 'earthquake_response'],
      operatingHours: '18/6',
      securityLevel: 'high',
      weatherResilience: 'earthquake_prepared'
    },
    { 
      name: 'LAX (Los Angeles International Airport), CA', 
      coords: [33.9425, -118.4081], 
      hubType: 'airport', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'air'],
      portCode: 'USLAX',
      facilities: ['cargo', 'passenger', 'freight'],
      specializedHandling: ['small_volume_hydrogen', 'methanol'],
      emergencyServices: ['fire_suppression', 'medical_facilities', 'hazmat_response'],
      operatingHours: '24/7',
      securityLevel: 'maximum',
      weatherResilience: 'all_weather'
    },
    { 
      name: 'Port of Long Beach, CA', 
      coords: [33.7701, -118.1937], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USPLB',
      facilities: ['container', 'bulk', 'automotive', 'energy'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression', 'spill_containment'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'earthquake_prepared'
    },
    { 
      name: 'Port of Los Angeles, CA', 
      coords: [33.7361, -118.2644], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USPLA',
      facilities: ['container', 'bulk', 'automotive', 'energy'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression', 'spill_containment'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'earthquake_prepared'
    },
    { 
      name: 'San Francisco, CA', 
      coords: [37.7749, -122.4194], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USSFO',
      facilities: ['container', 'bulk', 'tech'],
      specializedHandling: ['tech_grade_methanol'],
      emergencyServices: ['hazmat_response', 'earthquake_response'],
      operatingHours: '16/6',
      securityLevel: 'high',
      weatherResilience: 'earthquake_prepared'
    },
    { 
      name: 'Oakland, CA', 
      coords: [37.8044, -122.2712], 
      hubType: 'port', 
      region: 'US West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USOAK',
      facilities: ['container', 'bulk', 'automotive'],
      specializedHandling: ['methanol'],
      emergencyServices: ['hazmat_response', 'earthquake_response'],
      operatingHours: '20/6',
      securityLevel: 'high',
      weatherResilience: 'earthquake_prepared'
    },
    
    // Inland Hubs
    { 
      name: 'Chicago, IL', 
      coords: [41.8781, -87.6298], 
      hubType: 'rail', 
      region: 'US Midwest',
      infrastructure: ['truck', 'rail', 'pipeline'],
      portCode: 'USCHI',
      facilities: ['rail_yard', 'distribution', 'commodity_exchange'],
      specializedHandling: ['ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'medical_facilities'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'winter_prepared'
    },
    { 
      name: 'St. Louis, MO', 
      coords: [38.6270, -90.1994], 
      hubType: 'inland', 
      region: 'US Midwest',
      infrastructure: ['truck', 'rail', 'ship', 'pipeline'],
      portCode: 'USSTL',
      facilities: ['river_port', 'rail_yard', 'distribution'],
      specializedHandling: ['ammonia', 'methanol'],
      emergencyServices: ['river_rescue', 'hazmat_response'],
      operatingHours: '20/6',
      securityLevel: 'medium',
      weatherResilience: 'flood_prepared'
    },
    { 
      name: 'Memphis, TN', 
      coords: [35.1495, -90.0490], 
      hubType: 'inland', 
      region: 'US Southeast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USMEM',
      facilities: ['distribution', 'rail_yard', 'river_port'],
      specializedHandling: ['methanol'],
      emergencyServices: ['river_rescue', 'hazmat_response'],
      operatingHours: '18/6',
      securityLevel: 'medium',
      weatherResilience: 'storm_prepared'
    },
    { 
      name: 'Duluth-Superior, MN/WI', 
      coords: [46.7867, -92.1005], 
      hubType: 'inland', 
      region: 'US Great Lakes',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'USDLH',
      facilities: ['bulk', 'grain', 'iron_ore', 'coal'],
      specializedHandling: ['ammonia'],
      emergencyServices: ['coast_guard', 'ice_rescue'],
      operatingHours: '16/6',
      securityLevel: 'medium',
      weatherResilience: 'winter_prepared'
    },
    { 
      name: 'Denver, CO', 
      coords: [39.7392, -104.9903], 
      hubType: 'rail', 
      region: 'US Mountain',
      infrastructure: ['truck', 'rail', 'pipeline'],
      portCode: 'USDEN',
      facilities: ['rail_yard', 'distribution', 'energy'],
      specializedHandling: ['hydrogen', 'methanol'],
      emergencyServices: ['mountain_rescue', 'hazmat_response'],
      operatingHours: '20/6',
      securityLevel: 'medium',
      weatherResilience: 'altitude_prepared'
    },
    
    // International Destinations
    { 
      name: 'Taipei, Taiwan', 
      coords: [25.0330, 121.5654], 
      hubType: 'airport', 
      region: 'Asia Pacific',
      infrastructure: ['truck', 'rail', 'air'],
      portCode: 'TWTPE',
      facilities: ['cargo', 'passenger', 'tech'],
      specializedHandling: ['tech_grade_methanol', 'small_volume_hydrogen'],
      emergencyServices: ['fire_suppression', 'medical_facilities'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'typhoon_prepared'
    },
    { 
      name: 'Taoyuan International Airport, Taiwan', 
      coords: [25.0797, 121.2342], 
      hubType: 'airport', 
      region: 'Asia Pacific',
      infrastructure: ['truck', 'rail', 'air'],
      portCode: 'TWTYA',
      facilities: ['cargo', 'passenger', 'freight'],
      specializedHandling: ['small_volume_hydrogen', 'methanol'],
      emergencyServices: ['fire_suppression', 'medical_facilities'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'typhoon_prepared'
    },
    { 
      name: 'Kaohsiung Port, Taiwan', 
      coords: [22.6273, 120.3014], 
      hubType: 'port', 
      region: 'Asia Pacific',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'TWKAO',
      facilities: ['container', 'bulk', 'energy', 'petrochemical'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression', 'spill_containment'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'typhoon_prepared'
    },
    { 
      name: 'Taichung, Taiwan', 
      coords: [24.1477, 120.6736], 
      hubType: 'city', 
      region: 'Asia Pacific',
      infrastructure: ['truck', 'rail'],
      portCode: 'TWTAI',
      facilities: ['distribution', 'manufacturing', 'tech'],
      specializedHandling: ['tech_grade_methanol'],
      emergencyServices: ['fire_suppression'],
      operatingHours: '16/6',
      securityLevel: 'medium',
      weatherResilience: 'typhoon_prepared'
    },
    { 
      name: 'Vancouver Port, BC', 
      coords: [49.2827, -123.1207], 
      hubType: 'port', 
      region: 'Canada West Coast',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'CAVAN',
      facilities: ['container', 'bulk', 'grain', 'energy'],
      specializedHandling: ['hydrogen', 'ammonia'],
      emergencyServices: ['coast_guard', 'hazmat_response'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'rain_prepared'
    },
    { 
      name: 'Tokyo Port, Japan', 
      coords: [35.6762, 139.6503], 
      hubType: 'port', 
      region: 'Asia Pacific',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'JPTYO',
      facilities: ['container', 'bulk', 'automotive', 'tech'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'earthquake_response'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'earthquake_prepared'
    },
    { 
      name: 'Shanghai Port, China', 
      coords: [31.2304, 121.4737], 
      hubType: 'port', 
      region: 'Asia Pacific',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'CNSHA',
      facilities: ['container', 'bulk', 'manufacturing', 'energy'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression'],
      operatingHours: '24/7',
      securityLevel: 'medium',
      weatherResilience: 'typhoon_prepared'
    },
    { 
      name: 'Singapore Port', 
      coords: [1.3521, 103.8198], 
      hubType: 'port', 
      region: 'Asia Pacific',
      infrastructure: ['truck', 'rail', 'ship'],
      portCode: 'SGSIN',
      facilities: ['container', 'bulk', 'energy', 'petrochemical'],
      specializedHandling: ['hydrogen', 'ammonia', 'methanol'],
      emergencyServices: ['hazmat_response', 'fire_suppression', 'medical_facilities'],
      operatingHours: '24/7',
      securityLevel: 'high',
      weatherResilience: 'monsoon_prepared'
    }
  ];

  // ENHANCED: Dynamic market simulation with realistic prices, real-time updates, and advanced analytics
  const getDynamicMarketConditions = () => {
    const baseTime = Date.now();
    const hourlyVariation = Math.sin(baseTime / (1000 * 60 * 60)) * 0.1;
    const dailyVariation = Math.sin(baseTime / (1000 * 60 * 60 * 24)) * 0.05;
    const weeklyVariation = Math.sin(baseTime / (1000 * 60 * 60 * 24 * 7)) * 0.03;
    const monthlyVariation = Math.sin(baseTime / (1000 * 60 * 60 * 24 * 30)) * 0.02;
    const seasonalVariation = Math.sin(baseTime / (1000 * 60 * 60 * 24 * 365.25)) * 0.04;
    
    const globalSupplyDisruption = Math.random() > 0.95 ? 0.15 : 0; // 5% chance of supply disruption
    const demandSpike = Math.random() > 0.92 ? 0.12 : 0; // 8% chance of demand spike
    const weatherImpact = Math.random() > 0.88 ? 0.08 : 0; // 12% chance of weather impact
    
    return {
      fuelPrices: {
        hydrogen: { 
          current: Math.round((4.25 + hourlyVariation + dailyVariation + weeklyVariation + monthlyVariation + seasonalVariation + globalSupplyDisruption + demandSpike) * 100) / 100, 
          trend: hourlyVariation > 0.05 ? 'rising' : hourlyVariation < -0.05 ? 'falling' : 'stable', 
          volatility: 0.15 + (globalSupplyDisruption * 0.5),
          marketDepth: 0.85 - (globalSupplyDisruption * 0.3),
          supplyTightness: 0.7 + globalSupplyDisruption + demandSpike,
          futuresPrice: Math.round((4.25 + weeklyVariation + monthlyVariation) * 100) / 100,
          spotPremium: Math.round((hourlyVariation + dailyVariation) * 100) / 100,
          technicalIndicators: {
            rsi: Math.round(50 + (hourlyVariation * 100)),
            movingAverage: Math.round((4.25 + weeklyVariation) * 100) / 100,
            bollinger: { upper: 4.8, lower: 3.7 }
          }
        },
        methanol: { 
          current: Math.round((1.85 + hourlyVariation * 0.5 + dailyVariation + weeklyVariation * 0.7 + monthlyVariation + seasonalVariation * 0.8 + globalSupplyDisruption * 0.6) * 100) / 100, 
          trend: dailyVariation > 0.02 ? 'rising' : dailyVariation < -0.02 ? 'falling' : 'stable', 
          volatility: 0.08 + (globalSupplyDisruption * 0.3),
          marketDepth: 0.92 - (globalSupplyDisruption * 0.2),
          supplyTightness: 0.6 + globalSupplyDisruption * 0.8 + demandSpike,
          futuresPrice: Math.round((1.85 + weeklyVariation * 0.7 + monthlyVariation) * 100) / 100,
          spotPremium: Math.round((hourlyVariation * 0.5 + dailyVariation) * 100) / 100,
          technicalIndicators: {
            rsi: Math.round(50 + (dailyVariation * 150)),
            movingAverage: Math.round((1.85 + weeklyVariation * 0.7) * 100) / 100,
            bollinger: { upper: 2.2, lower: 1.5 }
          }
        },
        ammonia: { 
          current: Math.round((2.40 + hourlyVariation * 0.7 + dailyVariation + weeklyVariation * 0.8 + monthlyVariation + seasonalVariation * 0.9 + globalSupplyDisruption * 0.7) * 100) / 100, 
          trend: hourlyVariation < -0.05 ? 'falling' : hourlyVariation > 0.03 ? 'rising' : 'stable', 
          volatility: 0.12 + (globalSupplyDisruption * 0.4),
          marketDepth: 0.78 - (globalSupplyDisruption * 0.25),
          supplyTightness: 0.8 + globalSupplyDisruption + demandSpike * 0.9,
          futuresPrice: Math.round((2.40 + weeklyVariation * 0.8 + monthlyVariation) * 100) / 100,
          spotPremium: Math.round((hourlyVariation * 0.7 + dailyVariation) * 100) / 100,
          technicalIndicators: {
            rsi: Math.round(50 + (hourlyVariation * 120)),
            movingAverage: Math.round((2.40 + weeklyVariation * 0.8) * 100) / 100,
            bollinger: { upper: 2.9, lower: 1.9 }
          }
        }
      },
      transportRates: {
        truck: { 
          current: Math.round((2.8 + hourlyVariation * 0.2 + weatherImpact) * 100) / 100, 
          trend: 'rising', 
          demandFactor: 1.2 + demandSpike,
          capacity: 0.85 - weatherImpact - (demandSpike * 0.3),
          fuelSurcharge: 0.15 + (dailyVariation * 0.05),
          driverAvailability: 0.82 - (demandSpike * 0.2),
          routeOptimization: 0.88,
          maintenanceCosts: Math.round((350 + hourlyVariation * 50) * 100) / 100
        },
        rail: { 
          current: Math.round((1.1 + dailyVariation * 0.1 + weatherImpact * 0.5) * 100) / 100, 
          trend: weatherImpact > 0.05 ? 'rising' : 'stable', 
          demandFactor: 0.9 + demandSpike * 0.7,
          capacity: 0.92 - weatherImpact - (demandSpike * 0.15),
          fuelSurcharge: 0.08 + (dailyVariation * 0.02),
          trackAvailability: 0.95 - weatherImpact,
          carAvailability: 0.88 - (demandSpike * 0.25),
          priorityScheduling: priorityLevel === 'urgent' ? 1.25 : priorityLevel === 'high' ? 1.1 : 1.0
        },
        ship: { 
          current: Math.round((0.65 + weeklyVariation * 0.05 + weatherImpact * 0.3) * 100) / 100, 
          trend: weeklyVariation < -0.02 ? 'falling' : weatherImpact > 0.04 ? 'rising' : 'stable', 
          demandFactor: 0.8 + demandSpike * 0.6,
          capacity: 0.78 - weatherImpact - (demandSpike * 0.2),
          fuelSurcharge: 0.25 + (monthlyVariation * 0.1),
          portCongestion: 0.15 + demandSpike + weatherImpact,
          vesselAvailability: 0.85 - (demandSpike * 0.3),
          canalFees: Math.round((2500 + weeklyVariation * 500) * 100) / 100
        },
        pipeline: { 
          current: Math.round((0.4 + dailyVariation * 0.02) * 100) / 100, 
          trend: 'stable', 
          demandFactor: 1.0 + demandSpike * 0.3,
          capacity: 0.95 - (demandSpike * 0.1),
          fuelSurcharge: 0.02,
          throughputOptimization: 0.96,
          maintenanceSchedule: Math.random() > 0.95 ? 0.8 : 1.0, // 5% chance of maintenance
          pressureManagement: 0.98
        }
      },
      supplyChain: {
        congestion: Math.round((0.15 + hourlyVariation * 0.05 + demandSpike + weatherImpact) * 100) / 100,
        seasonality: Math.round((1.1 + weeklyVariation * 0.1 + seasonalVariation) * 100) / 100,
        fuelAvailability: Math.round((0.85 + dailyVariation * 0.1 - globalSupplyDisruption) * 100) / 100,
        weatherFactor: Math.round((1.0 + hourlyVariation * 0.05 + weatherImpact) * 100) / 100,
        geopoliticalRisk: 0.05 + (globalSupplyDisruption * 0.3),
        inventoryLevels: Math.round((0.75 + weeklyVariation * 0.15 - globalSupplyDisruption) * 100) / 100,
        logisticsEfficiency: Math.round((0.88 - weatherImpact - (demandSpike * 0.1)) * 100) / 100,
        qualityAssurance: 0.97,
        documentationCompliance: 0.95,
        emergencyResponseReadiness: 0.92
      },
      economic: {
        dieselPrice: Math.round((3.45 + hourlyVariation * 0.3 + dailyVariation * 0.2 + globalSupplyDisruption * 0.5) * 100) / 100,
        laborCosts: Math.round((1.05 + weeklyVariation * 0.02 + monthlyVariation * 0.01) * 100) / 100,
        insuranceRates: Math.round((1.02 + dailyVariation * 0.01 + globalSupplyDisruption * 0.05) * 100) / 100,
        exchangeRates: {
          USD_EUR: Math.round((0.92 + dailyVariation * 0.02) * 100) / 100,
          USD_JPY: Math.round((149.5 + dailyVariation * 2.5) * 100) / 100,
          USD_CNY: Math.round((7.2 + dailyVariation * 0.1) * 100) / 100,
          USD_TWD: Math.round((31.5 + dailyVariation * 0.3) * 100) / 100
        },
        inflationRate: Math.round((0.035 + monthlyVariation * 0.005) * 1000) / 1000,
        interestRates: Math.round((0.0525 + weeklyVariation * 0.0025) * 10000) / 10000,
        commodityIndices: {
          energy: Math.round((285 + dailyVariation * 15) * 100) / 100,
          chemicals: Math.round((195 + weeklyVariation * 8) * 100) / 100,
          transport: Math.round((142 + hourlyVariation * 5) * 100) / 100
        }
      },
      lastUpdated: new Date().toLocaleTimeString(),
      marketSentiment: hourlyVariation > 0.03 ? 'bullish' : hourlyVariation < -0.03 ? 'bearish' : 'neutral',
      liquidityIndex: Math.round((0.85 + dailyVariation * 0.1 - globalSupplyDisruption * 0.2) * 100) / 100,
      volatilityIndex: Math.round((0.15 + globalSupplyDisruption * 0.3 + demandSpike * 0.2 + weatherImpact * 0.25) * 100) / 100,
      marketEvents: {
        supplyDisruption: globalSupplyDisruption > 0,
        demandSpike: demandSpike > 0,
        weatherImpact: weatherImpact > 0,
        regulatoryChanges: Math.random() > 0.98,
        technologicalAdvancement: Math.random() > 0.995
      },
      forecastAccuracy: Math.round((0.92 - globalSupplyDisruption * 0.1 - weatherImpact * 0.05) * 100) / 100,
      dataQuality: Math.round((0.96 - (globalSupplyDisruption + weatherImpact) * 0.02) * 100) / 100
    };
  };

  // Initialize and update market conditions with enhanced real-time updates and error handling
  useEffect(() => {
    const updateMarketConditions = () => {
      try {
        const newConditions = getDynamicMarketConditions();
        setMarketConditions(newConditions);
        
        // Log significant market events
        if (newConditions.marketEvents.supplyDisruption) {
          console.warn('⚠️ Supply disruption detected in market conditions');
        }
        if (newConditions.marketEvents.demandSpike) {
          console.info('📈 Demand spike detected in market conditions');
        }
        if (newConditions.marketEvents.weatherImpact) {
          console.warn('🌦️ Weather impact affecting market conditions');
        }
        
        console.log('Market conditions updated:', newConditions.lastUpdated, 
                   'Sentiment:', newConditions.marketSentiment,
                   'Volatility:', (newConditions.volatilityIndex * 100).toFixed(1) + '%');
      } catch (error) {
        console.error('Error updating market conditions:', error);
        // Fallback to basic market conditions
        setMarketConditions({
          fuelPrices: {
            hydrogen: { current: 4.25, trend: 'stable', volatility: 0.15, marketDepth: 0.85, supplyTightness: 0.7 },
            methanol: { current: 1.85, trend: 'stable', volatility: 0.08, marketDepth: 0.92, supplyTightness: 0.6 },
            ammonia: { current: 2.40, trend: 'stable', volatility: 0.12, marketDepth: 0.78, supplyTightness: 0.8 }
          },
          transportRates: {
            truck: { current: 2.8, trend: 'stable', demandFactor: 1.0, capacity: 0.85, fuelSurcharge: 0.15 },
            rail: { current: 1.1, trend: 'stable', demandFactor: 0.9, capacity: 0.92, fuelSurcharge: 0.08 },
            ship: { current: 0.65, trend: 'stable', demandFactor: 0.8, capacity: 0.78, fuelSurcharge: 0.25 },
            pipeline: { current: 0.4, trend: 'stable', demandFactor: 1.0, capacity: 0.95, fuelSurcharge: 0.02 }
          },
          supplyChain: { congestion: 0.15, seasonality: 1.1, fuelAvailability: 0.85, weatherFactor: 1.0, geopoliticalRisk: 0.05 },
          economic: { dieselPrice: 3.45, laborCosts: 1.05, insuranceRates: 1.02, exchangeRates: { USD_EUR: 0.92, USD_JPY: 149.5, USD_CNY: 7.2 } },
          lastUpdated: new Date().toLocaleTimeString(),
          marketSentiment: 'neutral',
          liquidityIndex: 0.85,
          volatilityIndex: 0.15
        });
      }
    };

    updateMarketConditions();
    const interval = setInterval(updateMarketConditions, 30000); // Update every 30 seconds for more real-time feel

    return () => clearInterval(interval);
  }, [priorityLevel]); // Re-run when priority level changes

  // Enhanced fuel options with comprehensive properties and regulatory information
  const fuelOptions = {
    hydrogen: { 
      name: 'Hydrogen (H₂)', 
      states: ['gas', 'liquid'],
      density: { gas: 0.08988, liquid: 70.8 },
      energyDensity: 142,
      storageComplexity: 'high',
      regulatoryFactor: 1.3,
      hazmatClass: 'Class 2.1',
      storageTemp: { gas: 'ambient', liquid: '-253°C' },
      pressureRequirements: { gas: '350-700 bar', liquid: 'atmospheric' },
      marketMaturity: 'emerging',
      sustainability: {
        carbonIntensity: 0, // kg CO2/kg fuel
        renewableContent: 0.95, // percentage
        recyclability: 1.0
      },
      safetyRequirements: {
        ventilation: 'enhanced',
        leakDetection: 'mandatory',
        fireSuppressionSystem: 'specialized',
        personnelTraining: 'advanced',
        emergencyResponse: 'specialized_team'
      },
      regulatoryCompliance: {
        DOT: 'UN3158',
        IATA: 'UN3158',
        IMO: 'UN3158',
        specialPermits: ['high_pressure_transport', 'cryogenic_handling']
      },
      costFactors: {
        productionMethod: ['electrolysis', 'steam_reforming', 'biomass_gasification'],
        purityGrade: ['industrial', 'fuel_cell', 'research'],
        deliveryUrgency: { standard: 1.0, expedited: 1.25, emergency: 1.8 }
      }
    },
    methanol: { 
      name: 'Methanol (CH₃OH)', 
      states: ['liquid'],
      density: { liquid: 791.3 },
      energyDensity: 19.9,
      storageComplexity: 'medium',
      regulatoryFactor: 1.1,
      hazmatClass: 'Class 3',
      storageTemp: { liquid: 'ambient' },
      pressureRequirements: { liquid: 'atmospheric' },
      marketMaturity: 'established',
      sustainability: {
        carbonIntensity: 1.37, // kg CO2/kg fuel
        renewableContent: 0.3, // percentage (bio-methanol)
        recyclability: 0.85
      },
      safetyRequirements: {
        ventilation: 'standard',
        leakDetection: 'recommended',
        fireSuppressionSystem: 'foam_based',
        personnelTraining: 'standard',
        emergencyResponse: 'hazmat_team'
      },
      regulatoryCompliance: {
        DOT: 'UN1230',
        IATA: 'UN1230',
        IMO: 'UN1230',
        specialPermits: ['toxic_substance_transport']
      },
      costFactors: {
        productionMethod: ['natural_gas_reforming', 'biomass_conversion', 'CO2_recycling'],
        purityGrade: ['industrial', 'fuel', 'pharma', 'electronic'],
        deliveryUrgency: { standard: 1.0, expedited: 1.15, emergency: 1.5 }
      }
    },
    ammonia: { 
      name: 'Ammonia (NH₃)', 
      states: ['gas', 'liquid'],
      density: { gas: 0.7708, liquid: 682 },
      energyDensity: 18.8,
      storageComplexity: 'high',
      regulatoryFactor: 1.4,
      hazmatClass: 'Class 2.3',
      storageTemp: { gas: 'ambient', liquid: '-33°C' },
      pressureRequirements: { gas: '8-10 bar', liquid: 'atmospheric' },
      marketMaturity: 'established',
      sustainability: {
        carbonIntensity: 1.9, // kg CO2/kg fuel (conventional)
        renewableContent: 0.2, // percentage (green ammonia)
        recyclability: 0.95
      },
      safetyRequirements: {
        ventilation: 'enhanced',
        leakDetection: 'mandatory',
        fireSuppressionSystem: 'water_spray',
        personnelTraining: 'advanced',
        emergencyResponse: 'specialized_hazmat'
      },
      regulatoryCompliance: {
        DOT: 'UN1005',
        IATA: 'UN1005',
        IMO: 'UN1005',
        specialPermits: ['toxic_gas_transport', 'refrigerated_transport']
      },
      costFactors: {
        productionMethod: ['haber_bosch', 'green_electrolysis', 'blue_reforming'],
        purityGrade: ['agricultural', 'industrial', 'fuel', 'electronic'],
        deliveryUrgency: { standard: 1.0, expedited: 1.2, emergency: 1.6 }
      }
    }
  };

  const volumeUnits = [
    { value: 'tonnes', label: 'Tonnes (metric tons)', factor: 1, category: 'mass', commonUse: 'bulk_transport' },
    { value: 'kg', label: 'Kilograms', factor: 0.001, category: 'mass', commonUse: 'small_quantities' },
    { value: 'liters', label: 'Liters', factor: 0.001, category: 'volume', commonUse: 'liquid_fuels' },
    { value: 'gallons', label: 'Gallons (US)', factor: 0.00378541, category: 'volume', commonUse: 'liquid_fuels' },
    { value: 'imperial_gallons', label: 'Gallons (Imperial)', factor: 0.00454609, category: 'volume', commonUse: 'international' },
    { value: 'cubic_meters', label: 'Cubic Meters', factor: 1, category: 'volume', commonUse: 'gas_storage' },
    { value: 'cubic_feet', label: 'Cubic Feet', factor: 0.0283168, category: 'volume', commonUse: 'gas_storage' },
    { value: 'barrels', label: 'Barrels (Oil)', factor: 0.158987, category: 'volume', commonUse: 'petroleum_industry' },
    { value: 'standard_cubic_meters', label: 'Standard Cubic Meters (SCM)', factor: 0.8988, category: 'volume', commonUse: 'gas_measurement' },
    { value: 'pounds', label: 'Pounds (lbs)', factor: 0.000453592, category: 'mass', commonUse: 'US_market' }
  ];

  // Enhanced distance calculation using Haversine formula with multiple correction factors
  const calculateDistance = (origin, destination) => {
    const originData = cityDatabase.find(city => city.name === origin);
    const destData = cityDatabase.find(city => city.name === destination);
    
    if (!originData || !destData) {
      console.warn(`Location not found: ${origin} or ${destination}`);
      // Enhanced fallback with more realistic distance estimation
      const defaultDistances = {
        'same_region': Math.floor(Math.random() * 300) + 50,
        'domestic': Math.floor(Math.random() * 1500) + 200,
        'international': Math.floor(Math.random() * 8000) + 2000
      };
      return defaultDistances.domestic;
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
    
    const baseDistance = Math.round(R * c);
    
    // Apply multiple correction factors for realistic routing
    const isInternational = originData.region !== destData.region;
    const isTransOceanic = (originData.region.includes('US') && destData.region.includes('Asia')) ||
                          (originData.region.includes('Asia') && destData.region.includes('US'));
    const isCoastalRoute = originData.hubType === 'port' && destData.hubType === 'port';
    
    let complexityFactor = 1.0;
    if (isTransOceanic) complexityFactor = 1.25; // Trans-oceanic routes
    else if (isInternational) complexityFactor = 1.15; // International routes
    else if (isCoastalRoute) complexityFactor = 1.08; // Coastal routes
    else complexityFactor = 1.05; // Domestic routes
    
    // Apply hub-specific routing adjustments
    const hubComplexityFactor = {
      'port': 1.0,
      'airport': 1.1, // Air routes may have longer ground connections
      'rail': 1.05, // Rail routes follow specific track networks
      'city': 1.15, // City destinations may require additional local transport
      'inland': 1.1 // Inland hubs may have complex access routes
    };
    
    const originComplexity = hubComplexityFactor[originData.hubType] || 1.0;
    const destComplexity = hubComplexityFactor[destData.hubType] || 1.0;
    const avgComplexity = (originComplexity + destComplexity) / 2;
    
    const finalDistance = Math.round(baseDistance * complexityFactor * avgComplexity);
    
    console.log(`Distance calculation: ${origin} to ${destination}:`,
                `Base: ${baseDistance}mi,`,
                `Complexity: ${complexityFactor.toFixed(2)},`,
                `Hub: ${avgComplexity.toFixed(2)},`,
                `Final: ${finalDistance}mi`);
    
    return finalDistance;
  };

  // COMPREHENSIVE: Advanced cost calculation with real-time pricing, detailed logistics, and risk analysis
  const calculateEnhancedCost = (data) => {
    if (!marketConditions) {
      console.warn('Market conditions not available, using fallback calculation');
      return {
        error: true,
        message: 'Market data temporarily unavailable',
        fallbackUsed: true
      };
    }
    
    try {
      const fuel = fuelOptions[data.fuelType];
      const market = marketConditions;
      
      const volumeUnit = volumeUnits.find(unit => unit.value === data.volumeUnit);
      if (!volumeUnit) {
        throw new Error(`Invalid volume unit: ${data.volumeUnit}`);
      }
      
      let volumeInTonnes = parseFloat(data.volume) * volumeUnit.factor;
      const volumeInKg = volumeInTonnes * 1000;
      
      if (volumeInTonnes <= 0) {
        throw new Error('Volume must be greater than zero');
      }
      
      // 1. ADVANCED COMMODITY COST with multiple pricing sources and market analysis
      let commodityPrice;
      let priceSource = 'static-data';
      let confidence = 85;
      let priceAnalysis = {};
      
      if (realTimePrices && realTimePrices.price && realTimePrices.price > 0) {
        // Use real-time price from API with validation
        commodityPrice = realTimePrices.price;
        priceSource = 'real-time-api';
        confidence = realTimePrices.confidence || 95;
        priceAnalysis.apiSource = true;
        console.log(`Using real-time API price: $${commodityPrice}/kg with ${confidence}% confidence`);
      } else {
        // Fall back to dynamic market simulation with enhanced logic
        const marketPrice = market.fuelPrices[data.fuelType];
        if (!marketPrice) {
          throw new Error(`Market data not available for fuel type: ${data.fuelType}`);
        }
        
        commodityPrice = marketPrice.current;
        priceSource = 'market-simulation';
        confidence = 92;
        priceAnalysis.marketSimulation = true;
        console.log(`Using simulated market price: $${commodityPrice}/kg`);
      }
      
      // Apply advanced market factors and volume discounts
      const marketDepthFactor = market.fuelPrices[data.fuelType]?.marketDepth || 0.85;
      const supplyTightnessFactor = 1 + (market.fuelPrices[data.fuelType]?.supplyTightness || 0.7) * 0.1;
      const volatilityAdjustment = 1 + (market.fuelPrices[data.fuelType]?.volatility || 0.15) * 0.05;
      
      // Volume-based pricing tiers with enhanced logic
      let volumeDiscountFactor = 1.0;
      if (volumeInTonnes >= 1000) volumeDiscountFactor = 0.92; // Large volume discount
      else if (volumeInTonnes >= 500) volumeDiscountFactor = 0.95; // Medium volume discount
      else if (volumeInTonnes >= 100) volumeDiscountFactor = 0.97; // Small volume discount
      else if (volumeInTonnes < 1) volumeDiscountFactor = 1.15; // Small quantity premium
      
      // Priority and urgency adjustments
      const urgencyFactor = fuel.costFactors.deliveryUrgency[priorityLevel] || 1.0;
      
      // Purity and grade adjustments (defaulting to industrial grade)
      const purityFactor = 1.0; // Could be expanded based on user selection
      
      const adjustedCommodityPrice = commodityPrice * marketDepthFactor * supplyTightnessFactor * 
                                    volatilityAdjustment * volumeDiscountFactor * urgencyFactor * purityFactor;
      
      const commodityCost = volumeInKg * adjustedCommodityPrice;
      
      priceAnalysis = {
        ...priceAnalysis,
        basePrice: commodityPrice,
        adjustedPrice: adjustedCommodityPrice,
        adjustmentFactors: {
          marketDepth: marketDepthFactor,
          supplyTightness: supplyTightnessFactor,
          volatility: volatilityAdjustment,
          volumeDiscount: volumeDiscountFactor,
          urgency: urgencyFactor,
          purity: purityFactor
        }
      };
      
      // 2. COMPREHENSIVE TRANSPORT COST with multi-modal optimization
      const calculateTransportLeg = (origin, destination, mode, legNumber) => {
        const distance = calculateDistance(origin, destination);
        const transportData = market.transportRates[mode];
        
        if (!transportData) {
          console.warn(`Transport data not available for mode: ${mode}`);
          return {
            distance,
            cost: distance * 2.5 * volumeInTonnes, // Fallback rate
            mode,
            warning: 'Fallback rate used'
          };
        }
        
        const baseRate = transportData.current;
        const capacityFactor = transportData.capacity || 0.85;
        const fuelSurcharge = transportData.fuelSurcharge || 0.1;
        const demandFactor = transportData.demandFactor || 1.0;
        
        // Advanced cost calculation for this leg
        let legCost = distance * baseRate * volumeInTonnes;
        
        // Apply fuel-specific regulatory and handling complexity
        legCost *= fuel.regulatoryFactor;
        
        // Apply transport-specific adjustments
        legCost *= (1 + fuelSurcharge); // Fuel surcharge
        legCost *= (1 / capacityFactor); // Capacity constraints
        legCost *= demandFactor; // Market demand
        legCost *= market.supplyChain.seasonality; // Seasonal adjustments
        legCost *= market.supplyChain.weatherFactor; // Weather impact
        
        // Priority and urgency adjustments
        if (mode === 'rail' && transportData.priorityScheduling) {
          legCost *= transportData.priorityScheduling;
        }
        
        // Special handling requirements
        if (specialHandlingRequirements) {
          legCost *= 1.1; // 10% surcharge for special handling
        }
        
        // Insurance level adjustments
        const insuranceMultiplier = {
          'basic': 0.95,
          'standard': 1.0,
          'premium': 1.08,
          'comprehensive': 1.15
        };
        legCost *= insuranceMultiplier[insuranceLevel] || 1.0;
        
        return {
          distance,
          cost: Math.round(legCost * 100) / 100,
          mode,
          rateDetails: {
            baseRate,
            capacityFactor,
            fuelSurcharge,
            demandFactor,
            regulatoryFactor: fuel.regulatoryFactor,
            seasonalityFactor: market.supplyChain.seasonality,
            weatherFactor: market.supplyChain.weatherFactor
          }
        };
      };
      
      // Calculate transport legs
      const leg1 = calculateTransportLeg(data.origin, data.intermediateHub || data.destination, data.transportMode1, 1);
      let leg2 = null;
      
      if (data.intermediateHub) {
        leg2 = calculateTransportLeg(data.intermediateHub, data.destination, data.transportMode2, 2);
      }
      
      const totalDistance = leg1.distance + (leg2?.distance || 0);
      const transportationCost = leg1.cost + (leg2?.cost || 0);
      
      // Enhanced truck requirements calculation
      const calculateTruckRequirements = (mode, tonnage, distance) => {
        if (mode !== 'truck') return null;
        
        const standardTruckCapacity = 25; // tonnes
        const hazmatCapacityReduction = fuel.storageComplexity === 'high' ? 0.75 : 0.85;
        const effectiveCapacity = standardTruckCapacity * hazmatCapacityReduction;
        const utilizationRate = 85; // percentage
        const usableCapacity = effectiveCapacity * (utilizationRate / 100);
        
        const trucksNeeded = Math.ceil(tonnage / usableCapacity);
        const totalCapacityProvided = trucksNeeded * standardTruckCapacity;
        const wastedCapacity = totalCapacityProvided - tonnage;
        
        // Calculate driver requirements and costs
        const driversNeeded = trucksNeeded * (distance > 500 ? 2 : 1); // Long haul requires team drivers
        const driverCostPerDay = 450; // Average daily cost per driver
        const estimatedDays = Math.ceil(distance / 500); // Assuming 500 miles per day
        const totalDriverCost = driversNeeded * driverCostPerDay * estimatedDays;
        
        return {
          trucksNeeded,
          capacityPerTruck: standardTruckCapacity,
          effectiveCapacity,
          utilizationRate,
          totalCapacityUsed: tonnage,
          wastedCapacity,
          driversNeeded,
          estimatedDays,
          totalDriverCost,
          fuelEstimate: trucksNeeded * distance * 0.15 * market.economic.dieselPrice, // Fuel cost estimate
          hazmatCompliance: fuel.hazmatClass
        };
      };
      
      // Add truck info to legs if applicable
      if (leg1.mode === 'truck') {
        leg1.truckInfo = calculateTruckRequirements(leg1.mode, volumeInTonnes, leg1.distance);
      }
      if (leg2 && leg2.mode === 'truck') {
        leg2.truckInfo = calculateTruckRequirements(leg2.mode, volumeInTonnes, leg2.distance);
      }
      
      // 3. COMPREHENSIVE ADDITIONAL COSTS with detailed breakdown
      const storageComplexityMultiplier = fuel.storageComplexity === 'high' ? 1.3 : 
                                        fuel.storageComplexity === 'medium' ? 1.15 : 1.0;
      
      // Enhanced fuel handling with safety requirements
      const baseFuelHandlingRate = 75;
      const safetyMultiplier = fuel.safetyRequirements.personnelTraining === 'advanced' ? 1.4 :
                              fuel.safetyRequirements.personnelTraining === 'standard' ? 1.0 : 1.2;
      const fuelHandlingFee = volumeInTonnes * baseFuelHandlingRate * storageComplexityMultiplier * 
                             market.economic.laborCosts * safetyMultiplier;
      
      // Dynamic terminal fees with facility capabilities
      const baseTerminalFee = data.intermediateHub ? 1050 : 400;
      const volumeDiscountTerminal = volumeInTonnes > 50 ? 0.85 : volumeInTonnes > 20 ? 0.92 : 1.0;
      const congestionMultiplier = 1 + market.supplyChain.congestion;
      const facilitySpecializationBonus = 0.95; // Specialized facilities may offer discounts
      const terminalFees = baseTerminalFee * volumeDiscountTerminal * congestionMultiplier * facilitySpecializationBonus;
      
      // Hub transfer fees with complexity analysis
      const baseHubTransferRate = 45;
      const hubComplexityMultiplier = data.intermediateHub ? 
        (cityDatabase.find(c => c.name === data.intermediateHub)?.facilities?.length || 3) / 5 : 0;
      const hubTransferFee = data.intermediateHub ? 
        volumeInTonnes * baseHubTransferRate * market.economic.laborCosts * (1 + hubComplexityMultiplier * 0.1) : 0;
      
      // Comprehensive insurance calculation
      const baseInsuranceRate = 0.03;
      const fuelRiskMultiplier = fuel.hazmatClass === 'Class 2.3' ? 1.4 : 
                                fuel.hazmatClass === 'Class 2.1' ? 1.3 : 1.1;
      const routeRiskMultiplier = totalDistance > 5000 ? 1.2 : totalDistance > 2000 ? 1.1 : 1.0;
      const geopoliticalRiskFactor = 1 + market.supplyChain.geopoliticalRisk;
      const weatherRiskFactor = market.supplyChain.weatherFactor > 1.1 ? 1.05 : 1.0;
      const totalValueAtRisk = commodityCost + transportationCost;
      
      // Insurance level adjustments
      const insuranceLevelMultiplier = {
        'basic': 0.8,
        'standard': 1.0,
        'premium': 1.3,
        'comprehensive': 1.6
      };
      
      const insuranceCost = totalValueAtRisk * baseInsuranceRate * fuelRiskMultiplier * 
                           routeRiskMultiplier * geopoliticalRiskFactor * weatherRiskFactor *
                           market.economic.insuranceRates * (insuranceLevelMultiplier[insuranceLevel] || 1.0);
      
      // Enhanced carbon offset calculation with user preferences
      const carbonIntensityFactor = {
        truck: 1.2,
        rail: 0.8,
        ship: 0.6,
        pipeline: 0.3
      };
      
      const leg1CarbonIntensity = carbonIntensityFactor[data.transportMode1] || 1.0;
      const leg2CarbonIntensity = leg2 ? (carbonIntensityFactor[data.transportMode2] || 1.0) : 0;
      const avgCarbonIntensity = leg2 ? (leg1CarbonIntensity + leg2CarbonIntensity) / 2 : leg1CarbonIntensity;
      
      const baseCarbonRate = 12;
      const carbonOffsetMultiplier = {
        'minimal': 0.5,
        'standard': 1.0,
        'enhanced': 1.5,
        'carbon_neutral': 2.0
      };
      
      const carbonOffset = volumeInTonnes * baseCarbonRate * avgCarbonIntensity * 
                          (carbonOffsetMultiplier[carbonOffsetPreference] || 1.0);
      
      // Documentation and customs fees for international shipments
      const originData = cityDatabase.find(c => c.name === data.origin);
      const destData = cityDatabase.find(c => c.name === data.destination);
      const isInternational = originData && destData && originData.region !== destData.region;
      const isTransOceanic = isInternational && 
                            ((originData.region.includes('US') && destData.region.includes('Asia')) ||
                             (originData.region.includes('Asia') && destData.region.includes('US')));
      
      let customsFees = 0;
      if (isInternational) {
        const baseCustomsFee = isTransOceanic ? 750 : 500;
        const volumeCustomsFee = volumeInTonnes * (isTransOceanic ? 35 : 25);
        const hazmatCustomsMultiplier = fuel.hazmatClass === 'Class 2.3' ? 1.5 : 
                                       fuel.hazmatClass === 'Class 2.1' ? 1.3 : 1.1;
        customsFees = (baseCustomsFee + volumeCustomsFee) * hazmatCustomsMultiplier;
      }
      
      // Emergency response and safety compliance costs
      const emergencyResponseRate = fuel.safetyRequirements.emergencyResponse === 'specialized_team' ? 20 :
                                   fuel.safetyRequirements.emergencyResponse === 'specialized_hazmat' ? 18 :
                                   fuel.safetyRequirements.emergencyResponse === 'hazmat_team' ? 15 : 10;
      const emergencyResponseFee = volumeInTonnes * emergencyResponseRate * fuelRiskMultiplier;
      
      // Special handling and documentation fees
      const specialHandlingFee = specialHandlingRequirements ? volumeInTonnes * 25 : 0;
      
      // Permit and regulatory compliance fees
      const permitFees = fuel.regulatoryCompliance.specialPermits.length * 150;
      
      // Quality assurance and testing fees
      const qualityAssuranceFee = volumeInTonnes * 8 * (fuel.costFactors.purityGrade.length / 4);
      
      // Communication and tracking fees
      const trackingFee = 75 + (totalDistance * 0.05);
      
      // 4. TOTAL ALL-IN COST CALCULATION
      const totalTransportCost = transportationCost + fuelHandlingFee + terminalFees + 
                                hubTransferFee + insuranceCost + carbonOffset + 
                                customsFees + emergencyResponseFee + specialHandlingFee + 
                                permitFees + qualityAssuranceFee + trackingFee;
      const allInCost = commodityCost + totalTransportCost;
      
      // 5. RISK ANALYSIS AND MARKET INSIGHTS
      const calculateRiskFactors = () => {
        const fuelRiskLevel = fuel.storageComplexity;
        const routeComplexity = data.intermediateHub ? 'multi-modal' : 'direct';
        const geopoliticalRisk = market.supplyChain.geopoliticalRisk;
        const weatherImpact = market.supplyChain.weatherFactor;
        const marketVolatility = market.volatilityIndex;
        const liquidityRisk = 1 - market.liquidityIndex;
        
        // Calculate overall risk score
        const riskScore = (
          (fuelRiskLevel === 'high' ? 0.3 : fuelRiskLevel === 'medium' ? 0.2 : 0.1) +
          (routeComplexity === 'multi-modal' ? 0.15 : 0.05) +
          geopoliticalRisk +
          (weatherImpact > 1.1 ? 0.1 : 0) +
          marketVolatility * 0.5 +
          liquidityRisk * 0.3
        );
        
        return {
          fuelRiskLevel,
          routeComplexity,
          geopoliticalRisk,
          weatherImpact,
          marketVolatility,
          liquidityRisk,
          overallRiskScore: Math.round(riskScore * 100) / 100,
          riskRating: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low'
        };
      };
      
      // 6. GENERATE COMPREHENSIVE MARKET INSIGHTS
      const generateMarketInsights = () => {
        const fuelTrend = market.fuelPrices[data.fuelType]?.trend;
        const sentiment = market.marketSentiment;
        const liquidityLevel = market.liquidityIndex > 0.8 ? 'high' : 
                             market.liquidityIndex > 0.6 ? 'medium' : 'low';
        const volatilityLevel = market.volatilityIndex > 0.25 ? 'high' :
                              market.volatilityIndex > 0.15 ? 'medium' : 'low';
        
        let recommendation = '';
        
        // Price source recommendations
        if (priceSource === 'real-time-api') {
          recommendation = `Route optimized using real-time pricing data with ${confidence}% confidence. `;
        } else {
          recommendation = `Route optimized based on advanced market simulation. `;
        }
        
        // Market sentiment recommendations
        recommendation += `Current market sentiment is ${sentiment} with ${liquidityLevel} liquidity and ${volatilityLevel} volatility. `;
        
        // Fuel trend recommendations
        if (fuelTrend === 'rising') {
          recommendation += 'Consider accelerating procurement due to rising fuel prices. ';
        } else if (fuelTrend === 'falling') {
          recommendation += 'Market conditions are favorable for cost optimization - consider delaying if possible. ';
        } else {
          recommendation += 'Stable market conditions provide predictable pricing. ';
        }
        
        // Volume recommendations
        if (volumeInTonnes >= 100) {
          recommendation += 'Large volume benefits from economies of scale. ';
        } else if (volumeInTonnes < 1) {
          recommendation += 'Small quantities may benefit from consolidation with other shipments. ';
        }
        
        // Route recommendations
        if (totalDistance > 5000) {
          recommendation += 'Long-distance route - consider optimizing intermediate hubs. ';
        }
        
        // Priority recommendations
        if (priorityLevel === 'urgent') {
          recommendation += 'Urgent delivery incurs premium costs but ensures schedule compliance.';
        }
        
        return {
          fuelTrend,
          recommendation,
          marketSentiment: sentiment,
          liquidityLevel,
          volatilityLevel,
          optimalTiming: fuelTrend === 'falling' ? 'delay_if_possible' : 
                        fuelTrend === 'rising' ? 'accelerate_procurement' : 'proceed_as_planned',
          costOptimizationSuggestions: [
            volumeInTonnes < 10 ? 'Consider consolidating with other shipments' : null,
            priorityLevel === 'urgent' ? 'Evaluate if delivery can be standard priority' : null,
            carbonOffsetPreference === 'carbon_neutral' ? 'Review carbon offset requirements' : null,
            insuranceLevel === 'comprehensive' ? 'Assess if standard insurance is sufficient' : null
          ].filter(Boolean)
        };
      };
      
      // 7. CALCULATE DETAILED PERFORMANCE METRICS
      const performanceMetrics = {
        costPerKg: Math.round((allInCost / volumeInKg) * 100) / 100,
        costPerMile: Math.round((allInCost / totalDistance) * 100) / 100,
        transportEfficiency: Math.round((transportationCost / allInCost) * 100),
        commodityRatio: Math.round((commodityCost / allInCost) * 100),
        riskAdjustedCost: Math.round(allInCost * (1 + calculateRiskFactors().overallRiskScore * 0.1) * 100) / 100,
        timeToDelivery: estimateDeliveryTime(data, totalDistance),
        carbonFootprint: Math.round(volumeInTonnes * avgCarbonIntensity * 100) / 100 // kg CO2
      };
      
      // 8. RETURN COMPREHENSIVE RESULTS
      return {
        // Main costs
        allInCost: Math.round(allInCost * 100) / 100,
        commodityCost: Math.round(commodityCost * 100) / 100,
        totalTransportCost: Math.round(totalTransportCost * 100) / 100,
        
        // Route details  
        totalDistance,
        leg1,
        leg2,
        
        // Detailed cost breakdown
        fuelHandlingFee: Math.round(fuelHandlingFee * 100) / 100,
        terminalFees: Math.round(terminalFees * 100) / 100,
        hubTransferFee: Math.round(hubTransferFee * 100) / 100,
        insuranceCost: Math.round(insuranceCost * 100) / 100,
        carbonOffset: Math.round(carbonOffset * 100) / 100,
        customsFees: Math.round(customsFees * 100) / 100,
        emergencyResponseFee: Math.round(emergencyResponseFee * 100) / 100,
        specialHandlingFee: Math.round(specialHandlingFee * 100) / 100,
        permitFees: Math.round(permitFees * 100) / 100,
        qualityAssuranceFee: Math.round(qualityAssuranceFee * 100) / 100,
        trackingFee: Math.round(trackingFee * 100) / 100,
        
        // Metadata and insights
        confidence,
        hub: data.intermediateHub,
        commodityPrice: Math.round(adjustedCommodityPrice * 100) / 100,
        marketInsights: generateMarketInsights(),
        priceSource,
        priceAnalysis,
        
        // Performance metrics
        performanceMetrics,
        
        // Risk analysis
        riskFactors: calculateRiskFactors(),
        
        // Advanced analytics
        priceBreakdown: {
          commodityPercentage: Math.round((commodityCost / allInCost) * 100),
          transportPercentage: Math.round((totalTransportCost / allInCost) * 100),
          handlingPercentage: Math.round((fuelHandlingFee / allInCost) * 100),
          insurancePercentage: Math.round((insuranceCost / allInCost) * 100),
          feesPercentage: Math.round(((customsFees + permitFees + trackingFee) / allInCost) * 100)
        },
        
        // Operational details
        estimatedDeliveryTime: performanceMetrics.timeToDelivery,
        routeOptimization: analyzeRouteOptimization(data, leg1, leg2),
        complianceStatus: assessComplianceRequirements(fuel, isInternational),
        
        // Market context
        marketContext: {
          currentConditions: market.marketSentiment,
          volatilityIndex: market.volatilityIndex,
          liquidityIndex: market.liquidityIndex,
          supplyChainHealth: 1 - market.supplyChain.congestion,
          forecastAccuracy: market.forecastAccuracy || 0.92
        }
      };
    } catch (error) {
      console.error('Error in cost calculation:', error);
      return {
        error: true,
        message: 'Calculation error occurred',
        details: error.message,
        fallbackAvailable: true
      };
    }
  };

  // Helper function to estimate delivery time
  const estimateDeliveryTime = (data, totalDistance) => {
    const speedFactors = {
      truck: 500, // miles per day
      rail: 400,
      ship: 300,
      pipeline: 1000
    };
    
    const leg1Days = Math.ceil(calculateDistance(data.origin, data.intermediateHub || data.destination) / 
                              (speedFactors[data.transportMode1] || 400));
    const leg2Days = data.intermediateHub ? 
      Math.ceil(calculateDistance(data.intermediateHub, data.destination) / (speedFactors[data.transportMode2] || 400)) : 0;
    
    const hubProcessingDays = data.intermediateHub ? 1 : 0;
    const customsDelayDays = cityDatabase.find(c => c.name === data.origin)?.region !== 
                            cityDatabase.find(c => c.name === data.destination)?.region ? 2 : 0;
    
    const totalDays = leg1Days + leg2Days + hubProcessingDays + customsDelayDays;
    
    return {
      estimatedDays: totalDays,
      leg1Days,
      leg2Days,
      hubProcessingDays,
      customsDelayDays,
      deliveryWindow: `${totalDays}-${totalDays + 3} business days`
    };
  };

  // Helper function to analyze route optimization
  const analyzeRouteOptimization = (data, leg1, leg2) => {
    const optimization = {
      routeEfficiency: 0.85, // Default efficiency score
      alternativeRoutesAvailable: data.intermediateHub ? true : false,
      costOptimizationPotential: 'medium',
      timeOptimizationPotential: 'low',
      recommendations: []
    };
    
    // Analyze if hub is beneficial
    if (data.intermediateHub) {
      const directDistance = calculateDistance(data.origin, data.destination);
      const hubRouteDistance = leg1.distance + (leg2?.distance || 0);
      
      if (hubRouteDistance > directDistance * 1.3) {
        optimization.recommendations.push('Consider direct routing to reduce distance');
        optimization.costOptimizationPotential = 'high';
      }
    } else if (calculateDistance(data.origin, data.destination) > 2000) {
      optimization.recommendations.push('Consider adding intermediate hub for international routes');
      optimization.costOptimizationPotential = 'medium';
    }
    
    return optimization;
  };

  // Helper function to assess compliance requirements
  const assessComplianceRequirements = (fuel, isInternational) => {
    const compliance = {
      status: 'compliant',
      requiredDocuments: [],
      specialPermits: fuel.regulatoryCompliance.specialPermits,
      hazmatClassification: fuel.hazmatClass,
      additionalRequirements: []
    };
    
    // Basic documentation
    compliance.requiredDocuments.push('Material Safety Data Sheet (MSDS)');
    compliance.requiredDocuments.push('Bill of Lading');
    compliance.requiredDocuments.push('Hazmat Shipping Papers');
    
    // International requirements
    if (isInternational) {
      compliance.requiredDocuments.push('Commercial Invoice');
      compliance.requiredDocuments.push('Certificate of Origin');
      compliance.requiredDocuments.push('Export/Import Licenses');
      compliance.additionalRequirements.push('Customs clearance procedures');
    }
    
    // Fuel-specific requirements
    if (fuel.hazmatClass === 'Class 2.1' || fuel.hazmatClass === 'Class 2.3') {
      compliance.additionalRequirements.push('Specialized hazmat training for personnel');
      compliance.additionalRequirements.push('Emergency response procedures');
    }
    
    return compliance;
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
        city.name.toLowerCase().includes(value.toLowerCase()) ||
        city.region.toLowerCase().includes(value.toLowerCase()) ||
        city.hubType.toLowerCase().includes(value.toLowerCase()) ||
        city.portCode.toLowerCase().includes(value.toLowerCase()) ||
        city.facilities.some(facility => facility.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 10); // Increased to show more suggestions

      // Sort by relevance - exact matches first, then partial matches
      filtered.sort((a, b) => {
        const aExact = a.name.toLowerCase().startsWith(value.toLowerCase()) ? 1 : 0;
        const bExact = b.name.toLowerCase().startsWith(value.toLowerCase()) ? 1 : 0;
        return bExact - aExact;
      });

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
    
    // Comprehensive validation with detailed error messages
    console.log('[DEBUG] Submitting comprehensive payload to backend:', {
      ...formData,
      priorityLevel,
      insuranceLevel,
      carbonOffsetPreference,
      specialHandlingRequirements,
      emergencyContactInfo
    });
    
    // Validate required fields
    const validationErrors = [];
    
    if (!formData.fuelType) validationErrors.push('Fuel type is required');
    if (!formData.volume || parseFloat(formData.volume) <= 0) validationErrors.push('Valid volume is required');
    if (!formData.origin) validationErrors.push('Origin location is required');
    if (!formData.destination) validationErrors.push('Destination location is required');
    if (!formData.transportMode1) validationErrors.push('Primary transport mode is required');
    
    if (formData.intermediateHub && !formData.transportMode2) {
      validationErrors.push('Secondary transport mode is required when using intermediate hub');
    }
    
    // Validate locations exist in database
    const originExists = cityDatabase.find(c => c.name === formData.origin);
    const destExists = cityDatabase.find(c => c.name === formData.destination);
    const hubExists = formData.intermediateHub ? cityDatabase.find(c => c.name === formData.intermediateHub) : true;
    
    if (!originExists) validationErrors.push(`Origin location "${formData.origin}" not found in database`);
    if (!destExists) validationErrors.push(`Destination location "${formData.destination}" not found in database`);
    if (!hubExists) validationErrors.push(`Intermediate hub "${formData.intermediateHub}" not found in database`);
    
    // Validate fuel compatibility with locations
    if (originExists && formData.fuelType) {
      const fuelCompatible = originExists.specializedHandling?.includes(formData.fuelType);
      if (!fuelCompatible) {
        console.warn(`Origin ${formData.origin} may not have specialized handling for ${formData.fuelType}`);
      }
    }
    
    if (validationErrors.length > 0) {
      alert('Validation errors:\n' + validationErrors.join('\n'));
      return;
    }
    
    // Enhanced route analysis and warnings
    if (originExists && destExists) {
      const isInternational = originExists.region !== destExists.region;
      const distance = calculateDistance(formData.origin, formData.destination);
      const isLongDistance = distance > 2000;
      
      if ((isInternational || isLongDistance) && !formData.intermediateHub) {
        const confirmProceed = window.confirm(
          `This is ${isInternational ? 'an international' : 'a long-distance'} route (${distance} miles). ` +
          'Adding an intermediate hub could optimize costs and reduce risks. ' +
          'Proceed without hub?'
        );
        if (!confirmProceed) return;
      }
      
      // Check for fuel compatibility warnings
      if (formData.fuelType && formData.fuelState) {
        const fuel = fuelOptions[formData.fuelType];
        if (fuel.storageComplexity === 'high') {
          const proceedWithHighRisk = window.confirm(
            `${fuel.name} requires high-complexity handling and specialized safety measures. ` +
            'This may increase costs and transit time. Continue with this fuel type?'
          );
          if (!proceedWithHighRisk) return;
        }
      }
    }
    
    setIsCalculating(true);
    setShowResults(false);
    
    try {
      // Enhanced payload for backend API
      const enhancedPayload = {
        ...formData,
        advancedOptions: {
          priorityLevel,
          insuranceLevel,
          carbonOffsetPreference,
          specialHandlingRequirements,
          emergencyContactInfo
        },
        calculationTimestamp: new Date().toISOString(),
        marketConditionsSnapshot: marketConditions ? {
          timestamp: marketConditions.lastUpdated,
          sentiment: marketConditions.marketSentiment,
          volatility: marketConditions.volatilityIndex,
          liquidity: marketConditions.liquidityIndex
        } : null
      };
      
      if (backendAPI && backendAPI.isConnected) {
        // Enhanced backend API integration with comprehensive error handling
        console.log('🚀 Using backend API for enhanced calculation...');
        const response = await backendAPI.calculateCost(enhancedPayload);
        
        if (response && response.success && response.data) {
          console.log('✅ Backend calculation completed successfully:', response.data);
          
          // Enhanced mapping of backend response to frontend format
          const backendData = response.data;
          const mappedResults = {
            allInCost: backendData.allInCost || backendData.totalCost,
            commodityCost: backendData.commodityCost,
            totalTransportCost: backendData.totalTransportCost || backendData.transportationCost,
            
            // Enhanced leg data mapping
            leg1: {
              cost: backendData.legs?.leg1?.cost || backendData.transportationCost,
              distance: backendData.legs?.leg1?.distance || backendData.distance,
              mode: backendData.legs?.leg1?.mode || formData.transportMode1,
              truckInfo: backendData.legs?.leg1?.truckInfo,
              rateDetails: backendData.legs?.leg1?.rateDetails
            },
            leg2: backendData.legs?.leg2 ? {
              cost: backendData.legs.leg2.cost,
              distance: backendData.legs.leg2.distance,
              mode: backendData.legs.leg2.mode,
              truckInfo: backendData.legs.leg2.truckInfo,
              rateDetails: backendData.legs.leg2.rateDetails
            } : null,
            
            // Enhanced cost breakdown mapping
            fuelHandlingFee: backendData.fuelHandlingFee || backendData.costBreakdown?.fuelHandlingFee,
            terminalFees: backendData.terminalFees || backendData.costBreakdown?.terminalFees,
            insuranceCost: backendData.insuranceCost || backendData.costBreakdown?.insurance,
            carbonOffset: backendData.carbonOffset || backendData.costBreakdown?.carbonOffset,
            hubTransferFee: backendData.hubTransferFee || backendData.costBreakdown?.hubTransferFee,
            customsFees: backendData.customsFees || backendData.costBreakdown?.customsFees,
            emergencyResponseFee: backendData.emergencyResponseFee || backendData.costBreakdown?.emergencyResponseFee,
            specialHandlingFee: backendData.specialHandlingFee || backendData.costBreakdown?.specialHandlingFee,
            permitFees: backendData.permitFees || backendData.costBreakdown?.permitFees,
            qualityAssuranceFee: backendData.qualityAssuranceFee || backendData.costBreakdown?.qualityAssuranceFee,
            trackingFee: backendData.trackingFee || backendData.costBreakdown?.trackingFee,
            
            // Enhanced route and metadata mapping
            totalDistance: backendData.totalDistance || backendData.distance,
            confidence: backendData.confidence || backendData.realTimeData?.confidence || 95,
            marketInsights: backendData.marketInsights || {
              recommendation: "Route optimized using real-time backend pricing data with advanced logistics algorithms and comprehensive risk analysis."
            },
            priceSource: 'real-time-api',
            priceAnalysis: backendData.priceAnalysis,
            performanceMetrics: backendData.performanceMetrics,
            riskFactors: backendData.riskFactors,
            priceBreakdown: backendData.priceBreakdown,
            estimatedDeliveryTime: backendData.estimatedDeliveryTime,
            routeOptimization: backendData.routeOptimization,
            complianceStatus: backendData.complianceStatus,
            marketContext: backendData.marketContext
          };
          
          setResults(mappedResults);
          
          // Add to calculation history
          const historyEntry = {
            timestamp: new Date().toISOString(),
            route: `${formData.origin} → ${formData.intermediateHub ? formData.intermediateHub + ' → ' : ''}${formData.destination}`,
            fuel: formData.fuelType,
            volume: `${formData.volume} ${formData.volumeUnit}`,
            cost: mappedResults.allInCost,
            source: 'backend-api'
          };
          setCalculationHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 calculations
          
        } else {
          throw new Error('Invalid backend response structure');
        }
        
        // Refresh calculation history if available
        if (backendAPI.refreshHistory) {
          backendAPI.refreshHistory();
        }
      } else {
        // Enhanced fallback to local calculation with comprehensive error handling
        console.log('🔧 Backend API not available, using enhanced local calculation...');
        await new Promise(resolve => setTimeout(resolve, 2500)); // Realistic simulation delay
        
        const calculationResults = calculateEnhancedCost(formData);
        
        if (calculationResults.error) {
          throw new Error(calculationResults.message || 'Local calculation failed');
        }
        
        setResults(calculationResults);
        
        // Add to calculation history
        const historyEntry = {
          timestamp: new Date().toISOString(),
          route: `${formData.origin} → ${formData.intermediateHub ? formData.intermediateHub + ' → ' : ''}${formData.destination}`,
          fuel: formData.fuelType,
          volume: `${formData.volume} ${formData.volumeUnit}`,
          cost: calculationResults.allInCost,
          source: 'local-engine'
        };
        setCalculationHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
        
        console.log('✅ Local calculation completed successfully');
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('❌ Calculation failed with error:', error);
      
      // Enhanced error handling with user notification and fallback options
      const errorMessage = error.message || 'Unknown error occurred';
      console.warn(`Attempting fallback calculation due to: ${errorMessage}`);
      
      try {
        // Always attempt fallback calculation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const fallbackResults = calculateEnhancedCost(formData);
        
        if (!fallbackResults.error) {
          setResults({
            ...fallbackResults,
            fallbackUsed: true,
            originalError: errorMessage
          });
          setShowResults(true);
          
          // Notify user about fallback
          console.warn('⚠️ Using fallback calculation due to backend issues');
        } else {
          throw new Error('Both primary and fallback calculations failed');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback calculation also failed:', fallbackError);
        
        // Show error state
        setResults({
          error: true,
          message: 'Calculation service temporarily unavailable',
          details: errorMessage,
          fallbackError: fallbackError.message,
          timestamp: new Date().toISOString()
        });
        setShowResults(true);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const availableStates = formData.fuelType ? fuelOptions[formData.fuelType]?.states || [] : [];

  // Enhanced helper function to safely format numbers with locale and currency support
  const formatNumber = (value, options = {}) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    
    const defaults = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    };
    
    return parseFloat(value).toLocaleString('en-US', { ...defaults, ...options });
  };

  // Enhanced helper function to format currency
  const formatCurrency = (value, currency = 'USD') => {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Enhanced helper function to format percentages
  const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${(value * 100).toFixed(decimals)}%`;
  };
  
  // Enhanced real-time price update handler with validation
  const handlePriceUpdate = (priceData) => {
    if (priceData && typeof priceData.price === 'number' && priceData.price > 0) {
      setRealTimePrices(priceData);
      console.log('✅ Real-time price update received and validated:', priceData);
    } else {
      console.warn('⚠️ Invalid price data received:', priceData);
    }
  };

  // Enhanced route map data update function with comprehensive validation
  const updateRouteMapData = () => {
    const getLocationData = (locationName) => {
      if (!locationName) return null;
      
      const location = cityDatabase.find(city => city.name === locationName);
      if (!location) {
        console.warn(`Location not found in database: "${locationName}"`);
        return null;
      }
      
      return { 
        name: locationName, 
        coords: location.coords,
        hubType: location.hubType,
        region: location.region,
        infrastructure: location.infrastructure,
        facilities: location.facilities,
        specializedHandling: location.specializedHandling,
        emergencyServices: location.emergencyServices,
        operatingHours: location.operatingHours,
        securityLevel: location.securityLevel,
        weatherResilience: location.weatherResilience
      };
    };

    console.log('🗺️ Updating enhanced route map data with form data:', {
      origin: formData.origin,
      destination: formData.destination,
      intermediateHub: formData.intermediateHub,
      fuelType: formData.fuelType,
      volume: formData.volume
    });

    if (formData.origin && formData.destination) {
      const originData = getLocationData(formData.origin);
      const destinationData = getLocationData(formData.destination);
      const hubData = formData.intermediateHub ? getLocationData(formData.intermediateHub) : null;

      if (originData && destinationData) {
        const mapData = {
          fuelType: formData.fuelType,
          fuelState: formData.fuelState,
          volume: formData.volume,
          volumeUnit: formData.volumeUnit,
          origin: originData,
          destination: destinationData,
          intermediateHub: hubData,
          transportMode1: formData.transportMode1,
          transportMode2: formData.transportMode2,
          marketConditions: marketConditions,
          advancedOptions: {
            priorityLevel,
            insuranceLevel,
            carbonOffsetPreference,
            specialHandlingRequirements,
            emergencyContactInfo
          },
          routeAnalysis: {
            totalDistance: calculateDistance(formData.origin, formData.destination),
            isInternational: originData.region !== destinationData.region,
            complexityLevel: hubData ? 'multi-modal' : 'direct'
          }
        };
        
        console.log('✅ Setting comprehensive route map data:', mapData);
        setRouteMapData(mapData);
        setShowMap(true);
      } else {
        console.warn('❌ Could not find location data for origin or destination');
        setShowMap(false);
      }
    } else {
      console.log('ℹ️ Not showing map - missing origin or destination');
      setShowMap(false);
    }
  };

  // Watch for form data changes to update map with comprehensive dependency tracking
  useEffect(() => {
    updateRouteMapData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.origin, 
    formData.destination, 
    formData.intermediateHub, 
    formData.fuelType, 
    formData.fuelState,
    formData.volume, 
    formData.volumeUnit,
    formData.transportMode1, 
    formData.transportMode2,
    priorityLevel,
    insuranceLevel,
    carbonOffsetPreference,
    specialHandlingRequirements,
    marketConditions?.lastUpdated
  ]);

  return (
    <div className="calculator-section">
      <div className="calculator-container">
        <div className="calculator-header">
          <h2>AI-Powered Multi-Leg Fuel Transportation Calculator</h2>
          <p>Advanced cost optimization with comprehensive risk analysis, real-time market integration, and regulatory compliance</p>
          
          {/* Enhanced Real-Time Price Display Component */}
          <PriceDisplay 
            selectedFuel={formData.fuelType} 
            onPriceUpdate={handlePriceUpdate}
            marketConditions={marketConditions}
            advancedMetrics={true}
          />
          
          <div className="ai-badge">
            <span className="ai-indicator">🤖</span>
            Advanced Multi-Modal AI Analysis
            {marketConditions && (
              <div className="market-update">
                <span className="update-time">Updated: {marketConditions.lastUpdated}</span>
                <span className={`market-sentiment ${marketConditions.marketSentiment}`}>
                  {marketConditions.marketSentiment === 'bullish' ? '📈' : 
                   marketConditions.marketSentiment === 'bearish' ? '📉' : '➡️'} 
                  {marketConditions.marketSentiment}
                </span>
                <span className="volatility-indicator">
                  Volatility: {formatPercentage(marketConditions.volatilityIndex)}
                </span>
              </div>
            )}
          </div>

          {/* Calculation History Panel */}
          {calculationHistory.length > 0 && (
            <div className="calculation-history">
              <h4>Recent Calculations</h4>
              <div className="history-items">
                {calculationHistory.slice(0, 3).map((entry, index) => (
                  <div key={index} className="history-item">
                    <span className="route">{entry.route}</span>
                    <span className="cost">{formatCurrency(entry.cost)}</span>
                    <span className="timestamp">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="calculator-form">
          
          {/* Enhanced Fuel Type and State Selection */}
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
                  <option key={key} value={key}>
                    {fuel.name} - {fuel.marketMaturity} market ({fuel.hazmatClass})
                  </option>
                ))}
              </select>
              {formData.fuelType && marketConditions && (
                <div className="market-info">
                  <div className="price-info">
                    <div className="current-price">
                      Current Price: {formatCurrency(marketConditions.fuelPrices[formData.fuelType]?.current)}/kg
                      <span className={`trend ${marketConditions.fuelPrices[formData.fuelType]?.trend}`}>
                        {marketConditions.fuelPrices[formData.fuelType]?.trend === 'rising' ? '↗️' : 
                         marketConditions.fuelPrices[formData.fuelType]?.trend === 'falling' ? '↘️' : '➡️'}
                      </span>
                    </div>
                    {marketConditions.fuelPrices[formData.fuelType]?.futuresPrice && (
                      <div className="futures-price">
                        Futures: {formatCurrency(marketConditions.fuelPrices[formData.fuelType].futuresPrice)}/kg
                      </div>
                    )}
                  </div>
                  <div className="market-details">
                    <span className="volatility">
                      Volatility: {formatPercentage(marketConditions.fuelPrices[formData.fuelType]?.volatility)}
                    </span>
                    <span className="market-depth">
                      Market Depth: {formatPercentage(marketConditions.fuelPrices[formData.fuelType]?.marketDepth)}
                    </span>
                    <span className="supply-tightness">
                      Supply Tightness: {formatPercentage(marketConditions.fuelPrices[formData.fuelType]?.supplyTightness)}
                    </span>
                  </div>
                  {marketConditions.fuelPrices[formData.fuelType]?.technicalIndicators && (
                    <div className="technical-indicators">
                      <span className="rsi">
                        RSI: {marketConditions.fuelPrices[formData.fuelType].technicalIndicators.rsi}
                      </span>
                      <span className="moving-average">
                        MA: {formatCurrency(marketConditions.fuelPrices[formData.fuelType].technicalIndicators.movingAverage)}/kg
                      </span>
                    </div>
                  )}
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
                  {availableStates.map(state => {
                    const fuel = fuelOptions[formData.fuelType];
                    const tempInfo = fuel.storageTemp[state];
                    const pressureInfo = fuel.pressureRequirements[state];
                    return (
                      <option key={state} value={state}>
                        {state.charAt(0).toUpperCase() + state.slice(1)} 
                        {tempInfo && ` (${tempInfo})`}
                      </option>
                    );
                  })}
                </select>
                {formData.fuelState && formData.fuelType && (
                  <div className="storage-info">
                    <div className="storage-details">
                      <span className="hazmat">
                        {fuelOptions[formData.fuelType].hazmatClass}
                      </span>
                      <span className="storage-temp">
                        {fuelOptions[formData.fuelType].storageTemp[formData.fuelState]}
                      </span>
                      <span className="pressure">
                        {fuelOptions[formData.fuelType].pressureRequirements[formData.fuelState]}
                      </span>
                    </div>
                    <div className="safety-requirements">
                      Safety: {fuelOptions[formData.fuelType].safetyRequirements.personnelTraining} training required
                    </div>
                    <div className="regulatory-info">
                      DOT: {fuelOptions[formData.fuelType].regulatoryCompliance.DOT}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Volume and Unit Selection */}
          <div className="form-row">
            <div className="form-group">
              <label>Volume</label>
              <input 
                type="number" 
                name="volume" 
                value={formData.volume}
                onChange={handleChange} 
                placeholder="Enter volume (e.g., 10)"
                min="0.1"
                step="0.1"
                required 
              />
              {formData.volume && (
                <div className="volume-info">
                  {parseFloat(formData.volume) > 100 && (
                    <div className="volume-warning">
                      ⚠️ Large volume may qualify for bulk pricing and require special logistics
                    </div>
                  )}
                  {parseFloat(formData.volume) < 1 && (
                    <div className="volume-note">
                      ℹ️ Small quantities may incur minimum handling fees
                    </div>
                  )}
                  {parseFloat(formData.volume) >= 10 && parseFloat(formData.volume) <= 100 && (
                    <div className="volume-optimal">
                      ✅ Optimal volume range for cost efficiency
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select 
                name="volumeUnit" 
                value={formData.volumeUnit}
                onChange={handleChange}
              >
                <optgroup label="Mass Units (Recommended for Fuel Trading)">
                  {volumeUnits.filter(unit => unit.category === 'mass').map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label} - {unit.commonUse}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Volume Units">
                  {volumeUnits.filter(unit => unit.category === 'volume').map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label} - {unit.commonUse}
                    </option>
                  ))}
                </optgroup>
              </select>
              {formData.volumeUnit && (
                <div className="unit-info">
                  Common use: {volumeUnits.find(u => u.value === formData.volumeUnit)?.commonUse}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Route Planning with Infrastructure Details */}
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
                  {originSuggestions.map((cityName, index) => {
                    const cityData = cityDatabase.find(c => c.name === cityName);
                    return (
                      <div key={index} className="suggestion-item" onClick={() => selectSuggestion(cityName, 'origin')}>
                        <div className="city-name">{cityName}</div>
                        <div className="city-details">
                          <span className="hub-type">{cityData?.hubType}</span>
                          <span className="region">{cityData?.region}</span>
                          <span className="infrastructure">
                            {cityData?.infrastructure?.join(', ')}
                          </span>
                        </div>
                        <div className="specialized-handling">
                          {cityData?.specializedHandling?.length > 0 && (
                            <span className="fuel-capabilities">
                              Fuel handling: {cityData.specializedHandling.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="operational-info">
                          <span className="hours">{cityData?.operatingHours}</span>
                          <span className="security">{cityData?.securityLevel} security</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="form-group autocomplete-group">
              <label>Intermediate Hub (Point B) - Optional</label>
              <input 
                type="text" 
                name="intermediateHub" 
                value={formData.intermediateHub}
                onChange={(e) => handleCityInput(e, 'intermediateHub')}
                placeholder="e.g., Port of Long Beach, CA (for multi-modal optimization)"
              />
              {showHubSuggestions && hubSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {hubSuggestions.map((cityName, index) => {
                    const cityData = cityDatabase.find(c => c.name === cityName);
                    return (
                      <div key={index} className="suggestion-item" onClick={() => selectSuggestion(cityName, 'intermediateHub')}>
                        <div className="city-name">{cityName}</div>
                        <div className="city-details">
                          <span className="hub-type">{cityData?.hubType}</span>
                          <span className="region">{cityData?.region}</span>
                          <span className="facilities">
                            {cityData?.facilities?.slice(0, 3).join(', ')}
                          </span>
                        </div>
                        <div className="specialized-handling">
                          {cityData?.specializedHandling?.length > 0 && (
                            <span className="fuel-capabilities">
                              Fuel handling: {cityData.specializedHandling.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="emergency-services">
                          Emergency: {cityData?.emergencyServices?.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    );
                  })}
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
                  {destinationSuggestions.map((cityName, index) => {
                    const cityData = cityDatabase.find(c => c.name === cityName);
                    return (
                      <div key={index} className="suggestion-item" onClick={() => selectSuggestion(cityName, 'destination')}>
                        <div className="city-name">{cityName}</div>
                        <div className="city-details">
                          <span className="hub-type">{cityData?.hubType}</span>
                          <span className="region">{cityData?.region}</span>
                          <span className="infrastructure">
                            {cityData?.infrastructure?.join(', ')}
                          </span>
                        </div>
                        <div className="weather-resilience">
                          Weather prepared: {cityData?.weatherResilience}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Transport Mode Selection with Market Data and Route Analysis */}
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
                <option value="truck">🚛 Truck - Flexible, door-to-door, fastest for short routes</option>
                <option value="rail">🚂 Rail - Cost-effective, environmentally friendly, reliable scheduling</option>
                <option value="ship">🚢 Ship - Long distance, bulk cargo, most economical for large volumes</option>
                <option value="pipeline">🔧 Pipeline - Continuous flow, lowest cost, highest efficiency</option>
              </select>
              {formData.transportMode1 && marketConditions && (
                <div className="transport-info">
                  <div className="rate-info">
                    <div className="current-rate">
                      Rate: {formatCurrency(marketConditions.transportRates[formData.transportMode1]?.current)}/ton-mile
                      <span className="capacity-info">
                        Capacity: {formatPercentage(marketConditions.transportRates[formData.transportMode1]?.capacity)}
                      </span>
                    </div>
                    <div className="market-factors">
                      <span className="demand-factor">
                        Demand: {marketConditions.transportRates[formData.transportMode1]?.demandFactor.toFixed(2)}x
                      </span>
                      <span className="fuel-surcharge">
                        Fuel Surcharge: {formatPercentage(marketConditions.transportRates[formData.transportMode1]?.fuelSurcharge)}
                      </span>
                    </div>
                  </div>
                  {formData.transportMode1 === 'truck' && marketConditions.transportRates.truck?.driverAvailability && (
                    <div className="driver-availability">
                      Driver Availability: {formatPercentage(marketConditions.transportRates.truck.driverAvailability)}
                    </div>
                  )}
                  {formData.transportMode1 === 'ship' && marketConditions.transportRates.ship?.portCongestion && (
                    <div className="port-congestion">
                      Port Congestion: {formatPercentage(marketConditions.transportRates.ship.portCongestion)}
                    </div>
                  )}
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
                  <option value="truck">🚛 Truck - Flexible, door-to-door, fastest for short routes</option>
                  <option value="rail">🚂 Rail - Cost-effective, environmentally friendly, reliable scheduling</option>
                  <option value="ship">🚢 Ship - Long distance, bulk cargo, most economical for large volumes</option>
                  <option value="pipeline">🔧 Pipeline - Continuous flow, lowest cost, highest efficiency</option>
                </select>
                {formData.transportMode2 && marketConditions && (
                  <div className="transport-info">
                    <div className="rate-info">
                      Rate: {formatCurrency(marketConditions.transportRates[formData.transportMode2]?.current)}/ton-mile
                      <span className="capacity-info">
                        Capacity: {formatPercentage(marketConditions.transportRates[formData.transportMode2]?.capacity)}
                      </span>
                    </div>
                    <div className="surcharge-info">
                      Fuel Surcharge: {formatPercentage(marketConditions.transportRates[formData.transportMode2]?.fuelSurcharge)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <div className="form-row">
            <div className="form-group">
              <button 
                type="button" 
                className="advanced-options-toggle"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? '🔽' : '▶️'} Advanced Options & Risk Management
              </button>
            </div>
          </div>

          {/* Advanced Options Panel */}
          {showAdvancedOptions && (
            <div className="advanced-options-panel">
              <div className="form-row">
                <div className="form-group">
                  <label>Priority Level</label>
                  <select 
                    value={priorityLevel}
                    onChange={(e) => setPriorityLevel(e.target.value)}
                  >
                    <option value="standard">Standard - Normal delivery timeline</option>
                    <option value="high">High - Expedited processing</option>
                    <option value="urgent">Urgent - Emergency delivery</option>
                  </select>
                  <div className="option-info">
                    {priorityLevel === 'urgent' && (
                      <span className="warning">⚠️ Urgent delivery incurs 80% cost premium</span>
                    )}
                    {priorityLevel === 'high' && (
                      <span className="info">ℹ️ High priority adds 25% to transport costs</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Insurance Level</label>
                  <select 
                    value={insuranceLevel}
                    onChange={(e) => setInsuranceLevel(e.target.value)}
                  >
                    <option value="basic">Basic - Minimum required coverage</option>
                    <option value="standard">Standard - Recommended coverage</option>
                    <option value="premium">Premium - Enhanced protection</option>
                    <option value="comprehensive">Comprehensive - Maximum coverage</option>
                  </select>
                  <div className="option-info">
                    Coverage includes cargo loss, environmental cleanup, and business interruption
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Carbon Offset Preference</label>
                  <select 
                    value={carbonOffsetPreference}
                    onChange={(e) => setCarbonOffsetPreference(e.target.value)}
                  >
                    <option value="minimal">Minimal - Basic compliance only</option>
                    <option value="standard">Standard - Industry average offsets</option>
                    <option value="enhanced">Enhanced - Above-average environmental protection</option>
                    <option value="carbon_neutral">Carbon Neutral - Full offset commitment</option>
                  </select>
                  <div className="option-info">
                    Higher levels support renewable energy and reforestation projects
                  </div>
                </div>

                <div className="form-group">
                  <label>Special Handling Requirements</label>
                  <textarea 
                    value={specialHandlingRequirements}
                    onChange={(e) => setSpecialHandlingRequirements(e.target.value)}
                    placeholder="e.g., Temperature monitoring, vibration sensitivity, time-critical delivery..."
                    rows="3"
                  />
                  <div className="option-info">
                    Special requirements may affect routing and increase costs
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Emergency Contact Information</label>
                  <input 
                    type="text"
                    value={emergencyContactInfo}
                    onChange={(e) => setEmergencyContactInfo(e.target.value)}
                    placeholder="24/7 emergency contact number and backup"
                  />
                  <div className="option-info">
                    Required for hazmat shipments and high-value cargo
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Submit Button with Loading States and Market Indicators */}
          <button type="submit" className="calculate-btn" disabled={isCalculating}>
            {isCalculating ? (
              <>
                <span className="loading-spinner"></span>
                <span className="loading-text">
                  Calculating Comprehensive All-In Route Cost...
                  <div className="loading-details">
                    <span className="analysis-step">Analyzing market conditions</span>
                    <span className="analysis-step">Optimizing multi-modal routes</span>
                    <span className="analysis-step">Calculating risk factors</span>
                  </div>
                </span>
              </>
            ) : (
              <>
                Calculate Comprehensive All-In Cost
                {marketConditions && (
                  <div className="calculation-mode">
                    <span className="market-status">
                      with Real-Time Market Data ({marketConditions.dataQuality ? 
                      formatPercentage(marketConditions.dataQuality) : '96%'} accuracy)
                    </span>
                    <span className="pricing-confidence">
                      {realTimePrices ? 'API Pricing' : 'Market Simulation'}
                    </span>
                  </div>
                )}
              </>
            )}
          </button>
        </form>

        {/* Comprehensive Results Panel with Advanced Analytics and Insights */}
        {showResults && Object.keys(results).length > 0 && (
          <div className="results-panel">
            {results.error ? (
              // Enhanced Error State with Diagnostic Information
              <div className="error-panel">
                <div className="error-header">
                  <h3>❌ Calculation Service Error</h3>
                  <div className="error-timestamp">
                    {new Date(results.timestamp || Date.now()).toLocaleString()}
                  </div>
                </div>
                <div className="error-content">
                  <div className="error-message">
                    <strong>Primary Error:</strong> {results.message}
                  </div>
                  {results.details && (
                    <div className="error-details">
                      <strong>Technical Details:</strong> {results.details}
                    </div>
                  )}
                  {results.fallbackError && (
                    <div className="fallback-error">
                      <strong>Fallback Error:</strong> {results.fallbackError}
                    </div>
                  )}
                </div>
                <div className="error-instructions">
                  <h4>Troubleshooting Steps:</h4>
                  <ol>
                    <li>Verify backend server is running: <code>cd backend && npm run dev</code></li>
                    <li>Check network connectivity and firewall settings</li>
                    <li>Ensure port 5001 is available and not blocked</li>
                    <li>Verify .env file contains valid API keys</li>
                    <li>Check server logs for detailed error information</li>
                  </ol>
                </div>
                <div className="error-actions">
                  <button onClick={() => window.location.reload()} className="retry-btn">
                    🔄 Retry Calculation
                  </button>
                  <button onClick={() => setShowResults(false)} className="dismiss-btn">
                    ✖️ Dismiss
                  </button>
                </div>
              </div>
            ) : (
              // Enhanced Success State with Comprehensive Analysis
              <>
                <div className="results-header">
                  <div className="header-main">
                    <h3>
                      {results.fallbackUsed ? '⚠️ Fallback' : '✅'} Comprehensive All-In Cost Analysis
                    </h3>
                    {results.fallbackUsed && (
                      <div className="fallback-notice">
                        Backend unavailable - using local calculation engine
                      </div>
                    )}
                  </div>
                  <div className="confidence-metrics">
                    <div className="confidence-score">
                      <span className="confidence-label">Confidence Score:</span>
                      <span className={`confidence-value ${(results.confidence || 85) > 90 ? 'high' : (results.confidence || 85) > 75 ? 'medium' : 'low'}`}>
                        {results.confidence || 85}%
                      </span>
                    </div>
                    <div className="data-source">
                      <span className="source-label">Data Source:</span>
                      <span className="source-value">
                        {results.priceSource === 'real-time-api' ? '🌐 Real-time API' : 
                         results.priceSource === 'market-simulation' ? '🔬 Market Simulation' : '📊 Static Data'}
                      </span>
                    </div>
                    {results.marketContext && (
                      <div className="market-health">
                        <span className="health-label">Market Health:</span>
                        <span className="health-value">
                          {formatPercentage(results.marketContext.supplyChainHealth)} operational
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Executive Summary - Total Cost Display */}
                <div className="executive-summary">
                  <div className="total-cost">
                    <div className="cost-main">
                      Total All-In Cost: {formatCurrency(results.allInCost)}
                    </div>
                    <div className="cost-context">
                      {results.performanceMetrics && (
                        <>
                          <span className="cost-per-kg">
                            {formatCurrency(results.performanceMetrics.costPerKg)}/kg
                          </span>
                          <span className="cost-per-mile">
                            {formatCurrency(results.performanceMetrics.costPerMile)}/mile
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {results.priceBreakdown && (
                    <div className="cost-composition">
                      <div className="composition-chart">
                        <div className="commodity-bar" style={{width: `${results.priceBreakdown.commodityPercentage}%`}}>
                          <span className="bar-label">Commodity {results.priceBreakdown.commodityPercentage}%</span>
                        </div>
                        <div className="transport-bar" style={{width: `${results.priceBreakdown.transportPercentage}%`}}>
                          <span className="bar-label">Transport {results.priceBreakdown.transportPercentage}%</span>
                        </div>
                        <div className="other-bar" style={{width: `${100 - results.priceBreakdown.commodityPercentage - results.priceBreakdown.transportPercentage}%`}}>
                          <span className="bar-label">Other {100 - results.priceBreakdown.commodityPercentage - results.priceBreakdown.transportPercentage}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {results.estimatedDeliveryTime && (
                    <div className="delivery-estimate">
                      <span className="delivery-label">Estimated Delivery:</span>
                      <span className="delivery-window">{results.estimatedDeliveryTime.deliveryWindow}</span>
                      <span className="delivery-details">
                        ({results.estimatedDeliveryTime.estimatedDays} business days)
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Cost Breakdown */}
                <div className="cost-breakdown primary-breakdown">
                  <h4>Primary Cost Components</h4>
                  <div className="breakdown-grid">
                    <div className="cost-item major">
                      <div className="cost-header">
                        <div className="cost-label">
                          Commodity Cost (Fuel Purchase)
                          {results.priceAnalysis && (
                            <span className="price-details">
                              @ {formatCurrency(results.commodityPrice)}/kg
                              {results.priceAnalysis.adjustmentFactors && (
                                <span className="adjustments">
                                  (Volume: {results.priceAnalysis.adjustmentFactors.volumeDiscount?.toFixed(2)}x, 
                                   Market: {results.priceAnalysis.adjustmentFactors.marketDepth?.toFixed(2)}x)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="cost-value">{formatCurrency(results.commodityCost)}</div>
                      </div>
                      {results.priceAnalysis?.basePrice && (
                        <div className="price-analysis">
                          <span className="base-price">Base: {formatCurrency(results.priceAnalysis.basePrice)}/kg</span>
                          <span className="adjusted-price">Adjusted: {formatCurrency(results.priceAnalysis.adjustedPrice)}/kg</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="cost-item major">
                      <div className="cost-header">
                        <div className="cost-label">
                          Total Transport & Logistics
                          <span className="transport-details">Multi-modal optimization with risk management</span>
                        </div>
                        <div className="cost-value">{formatCurrency(results.totalTransportCost)}</div>
                      </div>
                      {results.performanceMetrics && (
                        <div className="transport-efficiency">
                          Transport Efficiency: {results.performanceMetrics.transportEfficiency}% of total cost
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Transport Cost Analysis */}
                <div className="cost-breakdown detailed-breakdown">
                  <h4>Detailed Transport & Logistics Analysis</h4>
                  <div className="transport-legs">
                    {/* Leg 1 Details */}
                    <div className="transport-leg">
                      <div className="leg-header">
                        <h5>
                          Leg 1: {formData.origin} → {formData.intermediateHub || formData.destination}
                          ({results.leg1?.mode})
                        </h5>
                        <div className="leg-metrics">
                          <span className="distance">{results.leg1?.distance || 0} miles</span>
                          <span className="cost">{formatCurrency(results.leg1?.cost)}</span>
                        </div>
                      </div>
                      
                      {results.leg1?.rateDetails && (
                        <div className="rate-details">
                          <div className="rate-factors">
                            <span>Base Rate: {formatCurrency(results.leg1.rateDetails.baseRate)}/ton-mile</span>
                            <span>Capacity Factor: {formatPercentage(results.leg1.rateDetails.capacityFactor)}</span>
                            <span>Fuel Surcharge: {formatPercentage(results.leg1.rateDetails.fuelSurcharge)}</span>
                          </div>
                        </div>
                      )}
                      
                      {results.leg1?.truckInfo && (
                        <div className="truck-logistics">
                          <div className="truck-summary">
                            🚛 <strong>{results.leg1.truckInfo.trucksNeeded} trucks required</strong>
                          </div>
                          <div className="truck-details">
                            <div className="capacity-info">
                              <span>Capacity: {results.leg1.truckInfo.capacityPerTruck}t each</span>
                              <span>Utilization: {results.leg1.truckInfo.utilizationRate}%</span>
                              <span>Waste: {results.leg1.truckInfo.wastedCapacity?.toFixed(1)}t</span>
                            </div>
                            <div className="driver-info">
                              <span>Drivers: {results.leg1.truckInfo.driversNeeded}</span>
                              <span>Duration: {results.leg1.truckInfo.estimatedDays} days</span>
                              <span>Driver Cost: {formatCurrency(results.leg1.truckInfo.totalDriverCost)}</span>
                            </div>
                            <div className="operational-costs">
                              <span>Fuel Estimate: {formatCurrency(results.leg1.truckInfo.fuelEstimate)}</span>
                              <span>Hazmat: {results.leg1.truckInfo.hazmatCompliance}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Leg 2 Details (if applicable) */}
                    {results.leg2 && (
                      <div className="transport-leg">
                        <div className="leg-header">
                          <h5>
                            Leg 2: {formData.intermediateHub} → {formData.destination}
                            ({results.leg2?.mode})
                          </h5>
                          <div className="leg-metrics">
                            <span className="distance">{results.leg2?.distance || 0} miles</span>
                            <span className="cost">{formatCurrency(results.leg2?.cost)}</span>
                          </div>
                        </div>
                        
                        {results.leg2?.rateDetails && (
                          <div className="rate-details">
                            <div className="rate-factors">
                              <span>Base Rate: {formatCurrency(results.leg2.rateDetails.baseRate)}/ton-mile</span>
                              <span>Capacity Factor: {formatPercentage(results.leg2.rateDetails.capacityFactor)}</span>
                              <span>Fuel Surcharge: {formatPercentage(results.leg2.rateDetails.fuelSurcharge)}</span>
                            </div>
                          </div>
                        )}
                        
                        {results.leg2?.truckInfo && (
                          <div className="truck-logistics">
                            <div className="truck-summary">
                              🚛 <strong>{results.leg2.truckInfo.trucksNeeded} trucks required</strong>
                            </div>
                            <div className="truck-details">
                              <div className="capacity-info">
                                <span>Capacity: {results.leg2.truckInfo.capacityPerTruck}t each</span>
                                <span>Utilization: {results.leg2.truckInfo.utilizationRate}%</span>
                                <span>Waste: {results.leg2.truckInfo.wastedCapacity?.toFixed(1)}t</span>
                              </div>
                              <div className="driver-info">
                                <span>Drivers: {results.leg2.truckInfo.driversNeeded}</span>
                                <span>Duration: {results.leg2.truckInfo.estimatedDays} days</span>
                                <span>Driver Cost: {formatCurrency(results.leg2.truckInfo.totalDriverCost)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Service Costs */}
                  <div className="service-costs">
                    <h5>Additional Service & Compliance Costs</h5>
                    <div className="cost-grid">
                      <div className="cost-item">
                        <div className="cost-label">
                          Fuel Handling & Storage
                          <span className="complexity-info">
                            {fuelOptions[formData.fuelType]?.storageComplexity} complexity handling
                          </span>
                        </div>
                        <div className="cost-value">{formatCurrency(results.fuelHandlingFee)}</div>
                      </div>
                      
                      <div className="cost-item">
                        <div className="cost-label">
                          Terminal & Port Fees
                          <span className="facility-info">
                            {formData.intermediateHub ? 'Multi-hub processing' : 'Direct facility access'}
                          </span>
                        </div>
                        <div className="cost-value">{formatCurrency(results.terminalFees)}</div>
                      </div>
                      
                      <div className="cost-item">
                        <div className="cost-label">
                          Insurance & Risk Management
                          <span className="risk-info">
                            {fuelOptions[formData.fuelType]?.hazmatClass} - {insuranceLevel} coverage
                          </span>
                        </div>
                        <div className="cost-value">{formatCurrency(results.insuranceCost)}</div>
                      </div>
                      
                      <div className="cost-item">
                        <div className="cost-label">
                          Carbon Offset & Environmental
                          <span className="environmental-info">
                            {carbonOffsetPreference} offset program
                          </span>
                        </div>
                        <div className="cost-value">{formatCurrency(results.carbonOffset)}</div>
                      </div>
                      
                      {formData.intermediateHub && (
                        <div className="cost-item">
                          <div className="cost-label">
                            Hub Transfer & Handling
                            <span className="hub-info">Intermediate processing at {formData.intermediateHub}</span>
                          </div>
                          <div className="cost-value">{formatCurrency(results.hubTransferFee)}</div>
                        </div>
                      )}
                      
                      {results.customsFees > 0 && (
                        <div className="cost-item">
                          <div className="cost-label">
                            Customs & International Documentation
                            <span className="customs-info">Cross-border regulatory compliance</span>
                          </div>
                          <div className="cost-value">{formatCurrency(results.customsFees)}</div>
                        </div>
                      )}
                      
                      {results.emergencyResponseFee > 0 && (
                        <div className="cost-item">
                          <div className="cost-label">
                            Emergency Response & Safety Compliance
                            <span className="safety-info">
                              {fuelOptions[formData.fuelType]?.safetyRequirements.emergencyResponse} protocols
                            </span>
                          </div>
                          <div className="cost-value">{formatCurrency(results.emergencyResponseFee)}</div>
                        </div>
                      )}
                      
                      {results.specialHandlingFee > 0 && (
                        <div className="cost-item">
                          <div className="cost-label">
                            Special Handling Requirements
                            <span className="special-info">Custom handling procedures</span>
                          </div>
                          <div className="cost-value">{formatCurrency(results.specialHandlingFee)}</div>
                        </div>
                      )}
                      
                      {results.permitFees > 0 && (
                        <div className="cost-item">
                          <div className="cost-label">
                            Permits & Regulatory Compliance
                            <span className="permit-info">
                              {fuelOptions[formData.fuelType]?.regulatoryCompliance.specialPermits.length} permits required
                            </span>
                          </div>
                          <div className="cost-value">{formatCurrency(results.permitFees)}</div>
                        </div>
                      )}
                      
                      {results.qualityAssuranceFee > 0 && (
                        <div className="cost-item">
                          <div className="cost-label">
                            Quality Assurance & Testing
                            <span className="qa-info">Purity and composition verification</span>
                          </div>
                          <div className="cost-value">{formatCurrency(results.qualityAssuranceFee)}</div>
                        </div>
                      )}
                      
                      {results.trackingFee > 0 && (
                        <div className="cost-item">
                          <div className="cost-label">
                            Tracking & Communication
                            <span className="tracking-info">Real-time shipment monitoring</span>
                          </div>
                          <div className="cost-value">{formatCurrency(results.trackingFee)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Route Overview with Enhanced Infrastructure Analysis */}
                <div className="route-overview">
                  <h4>🗺️ Comprehensive Route Analysis</h4>
                  <div className="route-visualization">
                    <div className="route-path">
                      <div className="route-point origin">
                        <div className="point-name">{formData.origin}</div>
                        <div className="point-details">
                          <span className="point-type">
                            {cityDatabase.find(c => c.name === formData.origin)?.hubType}
                          </span>
                          <span className="security-level">
                            {cityDatabase.find(c => c.name === formData.origin)?.securityLevel} security
                          </span>
                          <span className="operating-hours">
                            {cityDatabase.find(c => c.name === formData.origin)?.operatingHours}
                          </span>
                        </div>
                        {cityDatabase.find(c => c.name === formData.origin)?.specializedHandling?.includes(formData.fuelType) && (
                          <div className="fuel-compatibility">✅ {formData.fuelType} certified</div>
                        )}
                      </div>
                      
                      <div className="route-arrow">
                        <div className="transport-mode">
                          {formData.transportMode1 === 'truck' ? '🚛' : 
                           formData.transportMode1 === 'rail' ? '🚂' :
                           formData.transportMode1 === 'ship' ? '🚢' : '🔧'}
                        </div>
                        <div className="segment-info">
                          <span className="distance">{results.leg1?.distance || 0} mi</span>
                          <span className="duration">
                            {results.estimatedDeliveryTime?.leg1Days || 1} days
                          </span>
                        </div>
                      </div>
                      
                      {formData.intermediateHub && (
                        <>
                          <div className="route-point hub">
                            <div className="point-name">{formData.intermediateHub}</div>
                            <div className="point-details">
                              <span className="point-type">
                                {cityDatabase.find(c => c.name === formData.intermediateHub)?.hubType}
                              </span>
                              <span className="facilities">
                                {cityDatabase.find(c => c.name === formData.intermediateHub)?.facilities?.slice(0, 2).join(', ')}
                              </span>
                              <span className="processing-time">
                                +{results.estimatedDeliveryTime?.hubProcessingDays || 1} day processing
                              </span>
                            </div>
                            <div className="emergency-services">
                              Emergency: {cityDatabase.find(c => c.name === formData.intermediateHub)?.emergencyServices?.slice(0, 2).join(', ')}
                            </div>
                          </div>
                          
                          <div className="route-arrow">
                            <div className="transport-mode">
                              {formData.transportMode2 === 'truck' ? '🚛' : 
                               formData.transportMode2 === 'rail' ? '🚂' :
                               formData.transportMode2 === 'ship' ? '🚢' : '🔧'}
                            </div>
                            <div className="segment-info">
                              <span className="distance">{results.leg2?.distance || 0} mi</span>
                              <span className="duration">
                                {results.estimatedDeliveryTime?.leg2Days || 1} days
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="route-point destination">
                        <div className="point-name">{formData.destination}</div>
                        <div className="point-details">
                          <span className="point-type">
                            {cityDatabase.find(c => c.name === formData.destination)?.hubType}
                          </span>
                          <span className="weather-resilience">
                            {cityDatabase.find(c => c.name === formData.destination)?.weatherResilience}
                          </span>
                          {results.estimatedDeliveryTime?.customsDelayDays > 0 && (
                            <span className="customs-delay">
                              +{results.estimatedDeliveryTime.customsDelayDays} days customs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="route-metrics">
                    <div className="metric">
                      <span className="metric-label">Total Distance:</span>
                      <span className="metric-value">{results.totalDistance || 0} miles</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Route Complexity:</span>
                      <span className="metric-value">
                        {results.riskFactors?.routeComplexity || 'standard'}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Estimated Transit:</span>
                      <span className="metric-value">
                        {results.estimatedDeliveryTime?.deliveryWindow || 'TBD'}
                      </span>
                    </div>
                    {results.performanceMetrics?.carbonFootprint && (
                      <div className="metric">
                        <span className="metric-label">Carbon Footprint:</span>
                        <span className="metric-value">
                          {results.performanceMetrics.carbonFootprint} kg CO₂
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Interactive Route Maps */}
                <div className="maps-section">
                  {/* Enhanced Interactive Routing Map */}
                  {showMap && routeMapData && (
                    <div className="map-container">
                      <h4>📍 Interactive Route Visualization</h4>
                      <RoutingMap 
                        routeData={routeMapData}
                        showRoute={true}
                        results={results}
                        marketConditions={marketConditions}
                        advancedOptions={{
                          priorityLevel,
                          insuranceLevel,
                          carbonOffsetPreference
                        }}
                      />
                    </div>
                  )}

                  {/* Enhanced Google Maps API Route Integration */}
                  <div className="map-container">
                    <h4>🌐 Google Maps Route Integration</h4>
                    <RouteMap 
                      origin={formData.origin}
                      destination={formData.destination}
                      intermediateHub={formData.intermediateHub}
                      transportModes={{
                        mode1: formData.transportMode1,
                        mode2: formData.transportMode2
                      }}
                      results={{
                        fuelType: formData.fuelType,
                        fuelState: formData.fuelState,
                        volume: formData.volume,
                        volumeUnit: formData.volumeUnit,
                        ...results
                      }}
                      advancedOptions={{
                        priorityLevel,
                        insuranceLevel,
                        specialHandlingRequirements,
                        emergencyContactInfo
                      }}
                    />
                  </div>
                </div>

                {/* Comprehensive Risk Analysis Panel */}
                {results.riskFactors && (
                  <div className="risk-analysis">
                    <h4>⚠️ Comprehensive Risk Assessment</h4>
                    <div className="risk-overview">
                      <div className="overall-risk">
                        <span className="risk-label">Overall Risk Score:</span>
                        <span className={`risk-score ${results.riskFactors.riskRating}`}>
                          {results.riskFactors.overallRiskScore} ({results.riskFactors.riskRating})
                        </span>
                      </div>
                      {results.riskFactors.overallRiskScore > 0.6 && (
                        <div className="risk-warning">
                          ⚠️ High risk level detected - additional precautions recommended
                        </div>
                      )}
                    </div>
                    
                    <div className="risk-breakdown">
                      <div className="risk-category">
                        <div className="category-header">
                          <h5>🧪 Fuel & Chemical Risks</h5>
                        </div>
                        <div className="risk-items">
                          <div className="risk-item">
                            <span className="risk-factor">Storage Complexity:</span>
                            <span className={`risk-level ${results.riskFactors.fuelRiskLevel}`}>
                              {results.riskFactors.fuelRiskLevel}
                            </span>
                          </div>
                          <div className="risk-item">
                            <span className="risk-factor">Hazmat Classification:</span>
                            <span className="risk-value">
                              {fuelOptions[formData.fuelType]?.hazmatClass}
                            </span>
                          </div>
                          <div className="risk-item">
                            <span className="risk-factor">Emergency Response Required:</span>
                            <span className="risk-value">
                              {fuelOptions[formData.fuelType]?.safetyRequirements.emergencyResponse}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="risk-category">
                        <div className="category-header">
                          <h5>🚛 Operational & Logistics Risks</h5>
                        </div>
                        <div className="risk-items">
                          <div className="risk-item">
                            <span className="risk-factor">Route Complexity:</span>
                            <span className="risk-value">{results.riskFactors.routeComplexity}</span>
                          </div>
                          <div className="risk-item">
                            <span className="risk-factor">Weather Impact Factor:</span>
                            <span className="risk-value">
                              {((results.riskFactors.weatherImpact - 1) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="risk-item">
                            <span className="risk-factor">Market Volatility:</span>
                            <span className="risk-value">
                              {formatPercentage(results.riskFactors.marketVolatility)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="risk-category">
                        <div className="category-header">
                          <h5>🌍 External & Geopolitical Risks</h5>
                        </div>
                        <div className="risk-items">
                          <div className="risk-item">
                            <span className="risk-factor">Geopolitical Risk:</span>
                            <span className="risk-value">
                              {formatPercentage(results.riskFactors.geopoliticalRisk)}
                            </span>
                          </div>
                          <div className="risk-item">
                            <span className="risk-factor">Liquidity Risk:</span>
                            <span className="risk-value">
                              {formatPercentage(results.riskFactors.liquidityRisk)}
                            </span>
                          </div>
                          {results.performanceMetrics?.riskAdjustedCost && (
                            <div className="risk-item">
                              <span className="risk-factor">Risk-Adjusted Cost:</span>
                              <span className="risk-value">
                                {formatCurrency(results.performanceMetrics.riskAdjustedCost)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regulatory Compliance Status */}
                {results.complianceStatus && (
                  <div className="compliance-status">
                    <h4>📋 Regulatory Compliance Status</h4>
                    <div className="compliance-overview">
                      <div className="status-indicator">
                        <span className={`status ${results.complianceStatus.status}`}>
                          {results.complianceStatus.status === 'compliant' ? '✅' : '⚠️'} 
                          {results.complianceStatus.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="compliance-details">
                      <div className="required-documents">
                        <h5>Required Documentation:</h5>
                        <ul>
                          {results.complianceStatus.requiredDocuments.map((doc, index) => (
                            <li key={index}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="special-permits">
                        <h5>Special Permits Required:</h5>
                        <ul>
                          {results.complianceStatus.specialPermits.map((permit, index) => (
                            <li key={index}>{permit.replace('_', ' ')}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {results.complianceStatus.additionalRequirements.length > 0 && (
                        <div className="additional-requirements">
                          <h5>Additional Requirements:</h5>
                          <ul>
                            {results.complianceStatus.additionalRequirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced AI Market Intelligence and Recommendations */}
                <div className="market-intelligence">
                  <h4>🤖 AI-Powered Market Intelligence & Strategic Recommendations</h4>
                  
                  <div className="intelligence-overview">
                    <div className="ai-recommendation">
                      <h5>💡 Strategic Route Optimization Analysis:</h5>
                      <p className="recommendation-text">
                        {results.marketInsights?.recommendation}
                      </p>
                      {results.marketInsights?.optimalTiming && (
                        <div className="timing-recommendation">
                          <strong>Optimal Timing Strategy:</strong> {results.marketInsights.optimalTiming.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                    
                    {results.marketInsights?.costOptimizationSuggestions && results.marketInsights.costOptimizationSuggestions.length > 0 && (
                      <div className="cost-optimization">
                        <h5>💰 Cost Optimization Opportunities:</h5>
                        <ul className="optimization-list">
                          {results.marketInsights.costOptimizationSuggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {results.routeOptimization && (
                    <div className="route-optimization">
                      <h5>🗺️ Route Optimization Analysis:</h5>
                      <div className="optimization-metrics">
                        <div className="metric">
                          <span className="metric-label">Route Efficiency:</span>
                          <span className="metric-value">
                            {formatPercentage(results.routeOptimization.routeEfficiency)}
                          </span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Cost Optimization Potential:</span>
                          <span className="metric-value">{results.routeOptimization.costOptimizationPotential}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Time Optimization Potential:</span>
                          <span className="metric-value">{results.routeOptimization.timeOptimizationPotential}</span>
                        </div>
                      </div>
                      {results.routeOptimization.recommendations.length > 0 && (
                        <div className="route-recommendations">
                          <strong>Route Recommendations:</strong>
                          <ul>
                            {results.routeOptimization.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {marketConditions && (
                    <div className="current-market-analysis">
                      <h5>📊 Real-Time Market Conditions Analysis:</h5>
                      <div className="market-grid">
                        <div className="market-metric">
                          <div className="metric-header">
                            <span className="metric-label">Market Sentiment:</span>
                            <span className={`metric-value sentiment-${marketConditions.marketSentiment}`}>
                              {marketConditions.marketSentiment}
                              {marketConditions.marketSentiment === 'bullish' ? ' 📈' : 
                               marketConditions.marketSentiment === 'bearish' ? ' 📉' : ' ➡️'}
                            </span>
                          </div>
                          <div className="metric-detail">
                            Market confidence and direction indicator
                          </div>
                        </div>
                        
                        <div className="market-metric">
                          <div className="metric-header">
                            <span className="metric-label">Liquidity Index:</span>
                            <span className="metric-value">
                              {formatPercentage(marketConditions.liquidityIndex)}
                            </span>
                          </div>
                          <div className="metric-detail">
                            Market depth and trading ease measure
                          </div>
                        </div>
                        
                        <div className="market-metric">
                          <div className="metric-header">
                            <span className="metric-label">Volatility Index:</span>
                            <span className="metric-value">
                              {formatPercentage(marketConditions.volatilityIndex)}
                            </span>
                          </div>
                          <div className="metric-detail">
                            Price stability and predictability measure
                          </div>
                        </div>
                        
                        <div className="market-metric">
                          <div className="metric-header">
                            <span className="metric-label">Supply Chain Health:</span>
                            <span className="metric-value">
                              {formatPercentage(1 - marketConditions.supplyChain.congestion)}
                            </span>
                          </div>
                          <div className="metric-detail">
                            Overall supply chain efficiency
                          </div>
                        </div>
                        
                        {marketConditions.forecastAccuracy && (
                          <div className="market-metric">
                            <div className="metric-header">
                              <span className="metric-label">Forecast Accuracy:</span>
                              <span className="metric-value">
                                {formatPercentage(marketConditions.forecastAccuracy)}
                              </span>
                            </div>
                            <div className="metric-detail">
                              Prediction reliability measure
                            </div>
                          </div>
                        )}
                        
                        {marketConditions.dataQuality && (
                          <div className="market-metric">
                            <div className="metric-header">
                              <span className="metric-label">Data Quality:</span>
                              <span className="metric-value">
                                {formatPercentage(marketConditions.dataQuality)}
                              </span>
                            </div>
                            <div className="metric-detail">
                              Information accuracy and completeness
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {marketConditions.marketEvents && Object.values(marketConditions.marketEvents).some(Boolean) && (
                        <div className="market-events">
                          <h6>🚨 Active Market Events:</h6>
                          <div className="events-list">
                            {marketConditions.marketEvents.supplyDisruption && (
                              <span className="event supply-disruption">⚠️ Supply Disruption</span>
                            )}
                            {marketConditions.marketEvents.demandSpike && (
                              <span className="event demand-spike">📈 Demand Spike</span>
                            )}
                            {marketConditions.marketEvents.weatherImpact && (
                              <span className="event weather-impact">🌦️ Weather Impact</span>
                            )}
                            {marketConditions.marketEvents.regulatoryChanges && (
                              <span className="event regulatory-changes">📋 Regulatory Changes</span>
                            )}
                            {marketConditions.marketEvents.technologicalAdvancement && (
                              <span className="event tech-advancement">🔬 Tech Advancement</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="data-sources-attribution">
                    <h6>📊 Data Sources & Attribution:</h6>
                    <div className="sources-grid">
                      <span className="source">✅ Real-time Market APIs</span>
                      <span className="source">✅ Google Maps Routing</span>
                      <span className="source">✅ AI-powered Analytics</span>
                      <span className="source">✅ Regulatory Compliance Database</span>
                      <span className="source">✅ Weather & Geopolitical Intelligence</span>
                      <span className="source">✅ Multi-modal Logistics Optimization</span>
                    </div>
                  </div>
                </div>

                {/* Performance Summary and Benchmarking */}
                {results.performanceMetrics && (
                  <div className="performance-summary">
                    <h4>📈 Performance Summary & Benchmarking</h4>
                    <div className="performance-grid">
                      <div className="performance-metric">
                        <div className="metric-header">
                          <span className="metric-label">Cost Efficiency:</span>
                          <span className="metric-value">
                            {formatCurrency(results.performanceMetrics.costPerKg)}/kg
                          </span>
                        </div>
                        <div className="metric-benchmark">
                          Industry benchmark comparison
                        </div>
                      </div>
                      
                      <div className="performance-metric">
                        <div className="metric-header">
                          <span className="metric-label">Distance Efficiency:</span>
                          <span className="metric-value">
                            {formatCurrency(results.performanceMetrics.costPerMile)}/mile
                          </span>
                        </div>
                        <div className="metric-benchmark">
                          Route optimization effectiveness
                        </div>
                      </div>
                      
                      <div className="performance-metric">
                        <div className="metric-header">
                          <span className="metric-label">Transport Ratio:</span>
                          <span className="metric-value">
                            {results.performanceMetrics.transportEfficiency}%
                          </span>
                        </div>
                        <div className="metric-benchmark">
                          Transport cost as % of total
                        </div>
                      </div>
                      
                      <div className="performance-metric">
                        <div className="metric-header">
                          <span className="metric-label">Commodity Ratio:</span>
                          <span className="metric-value">
                            {results.performanceMetrics.commodityRatio}%
                          </span>
                        </div>
                        <div className="metric-benchmark">
                          Fuel cost as % of total
                        </div>
                      </div>
                      
                      {results.performanceMetrics.timeToDelivery && (
                        <div className="performance-metric">
                          <div className="metric-header">
                            <span className="metric-label">Delivery Speed:</span>
                            <span className="metric-value">
                              {results.performanceMetrics.timeToDelivery.estimatedDays} days
                            </span>
                          </div>
                          <div className="metric-benchmark">
                            Time-to-market efficiency
                          </div>
                        </div>
                      )}
                      
                      {results.performanceMetrics.carbonFootprint && (
                        <div className="performance-metric">
                          <div className="metric-header">
                            <span className="metric-label">Carbon Efficiency:</span>
                            <span className="metric-value">
                              {results.performanceMetrics.carbonFootprint} kg CO₂
                            </span>
                          </div>
                          <div className="metric-benchmark">
                            Environmental impact measure
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Status Indicator with Real-time Information */}
      <div className="ai-status">
        <div className="status-main">
          🚚🚢🚂✈️ Advanced Multi-Modal AI Transportation Calculator
        </div>
        <div className="status-details">
          {marketConditions && (
            <>
              <span className="api-status">
                {backendAPI?.isConnected ? '🟢 Backend API Connected' : '🟡 Local Calculation Mode'}
              </span>
              <span className="market-status">
                📊 Market Data: {marketConditions.lastUpdated}
              </span>
              <span className="data-quality">
                🎯 Data Quality: {formatPercentage(marketConditions.dataQuality || 0.96)}
              </span>
              <span className="calculation-count">
                📋 Calculations: {calculationHistory.length}
              </span>
            </>
          )}
        </div>
        <div className="status-features">
          <span className="feature">🤖 AI-Powered Analytics</span>
          <span className="feature">🌐 Real-time Market Data</span>
          <span className="feature">⚡ Multi-modal Optimization</span>
          <span className="feature">🛡️ Risk Assessment</span>
          <span className="feature">📋 Regulatory Compliance</span>
          <span className="feature">🌱 Carbon Footprint Analysis</span>
        </div>
      </div>

      {/* Enhanced Styling for New Components */}
      <style jsx>{`
        .calculation-history {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .calculation-history h4 {
          margin-bottom: 0.5rem;
          color: #059669;
          font-size: 0.9rem;
        }

        .history-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .error-panel {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 2px solid #dc2626;
          border-radius: 16px;
          padding: 2rem;
          color: #7f1d1d;
          text-align: center;
        }

        .error-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .error-header h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .error-timestamp {
          font-size: 0.8rem;
          opacity: 0.7;
        }

        .error-content {
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .error-message, .error-details, .fallback-error {
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        .error-instructions {
          margin-bottom: 1.5rem;
          text-align: left;
          background: rgba(255, 255, 255, 0.5);
          padding: 1rem;
          border-radius: 8px;
        }

        .error-instructions h4 {
          margin-bottom: 0.5rem;
          color: #991b1b;
        }

        .error-instructions ol {
          margin-left: 1rem;
        }

        .error-instructions code {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .retry-btn, .dismiss-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .retry-btn {
          background: #059669;
          color: white;
        }

        .dismiss-btn {
          background: #6b7280;
          color: white;
        }

        .fallback-notice {
          background: rgba(251, 191, 36, 0.2);
          color: #92400e;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .confidence-metrics {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .confidence-score, .data-source, .market-health {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .confidence-value.high {
          color: #059669;
          font-weight: bold;
        }

        .confidence-value.medium {
          color: #d97706;
          font-weight: bold;
        }

        .confidence-value.low {
          color: #dc2626;
          font-weight: bold;
        }

        .executive-summary {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #059669;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .cost-composition {
          margin-top: 1rem;
        }

        .composition-chart {
          display: flex;
          height: 30px;
          border-radius: 15px;
          overflow: hidden;
          background: #f3f4f6;
        }

        .commodity-bar {
          background: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .transport-bar {
          background: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .other-bar {
          background: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .delivery-estimate {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .delivery-window {
          font-weight: bold;
          color: #059669;
        }

        .transport-legs {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .transport-leg {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .leg-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .leg-header h5 {
          margin: 0;
          color: #1e40af;
        }

        .leg-metrics {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
        }

        .leg-metrics .distance {
          color: #6b7280;
        }

        .leg-metrics .cost {
          font-weight: bold;
          color: #059669;
        }

        .rate-details {
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 6px;
        }

        .rate-factors {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.8rem;
        }

        .truck-logistics {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 8px;
          padding: 1rem;
        }

        .truck-summary {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .truck-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .capacity-info, .driver-info, .operational-costs {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.8rem;
        }

        .service-costs {
          margin-top: 2rem;
        }

        .cost-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .route-visualization {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .route-path {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .route-point {
          flex: 1;
          min-width: 200px;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .route-point.origin {
          border-left: 4px solid #059669;
        }

        .route-point.hub {
          border-left: 4px solid #3b82f6;
        }

        .route-point.destination {
          border-left: 4px solid #dc2626;
        }

        .point-name {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .point-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .fuel-compatibility {
          color: #059669;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .route-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }

        .transport-mode {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .segment-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .route-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 6px;
        }

        .metric-label {
          font-weight: 600;
        }

        .metric-value {
          color: #059669;
          font-weight: bold;
        }

        .maps-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin: 2rem 0;
        }

        .map-container {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .risk-analysis {
          background: rgba(251, 191, 36, 0.05);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .risk-overview {
          margin-bottom: 1.5rem;
        }

        .overall-risk {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .risk-score {
          font-weight: bold;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .risk-score.low {
          background: #dcfce7;
          color: #166534;
        }

        .risk-score.medium {
          background: #fef3c7;
          color: #92400e;
        }

        .risk-score.high {
          background: #fee2e2;
          color: #991b1b;
        }

        .risk-warning {
          background: rgba(239, 68, 68, 0.1);
          color: #991b1b;
          padding: 0.5rem;
          border-radius: 6px;
          font-weight: 600;
        }

        .risk-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .risk-category {
          background: rgba(255, 255, 255, 0.6);
          border-radius: 8px;
          padding: 1rem;
        }

        .category-header h5 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .risk-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .risk-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .risk-level.high {
          color: #dc2626;
          font-weight: bold;
        }

        .risk-level.medium {
          color: #d97706;
          font-weight: bold;
        }

        .risk-level.low {
          color: #059669;
          font-weight: bold;
        }

        .compliance-status {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .compliance-overview {
          margin-bottom: 1.5rem;
        }

        .status-indicator .status {
          font-weight: bold;
          padding: 0.5rem 1rem;
          border-radius: 6px;
        }

        .status.compliant {
          background: #dcfce7;
          color: #166534;
        }

        .compliance-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .required-documents, .special-permits, .additional-requirements {
          background: rgba(255, 255, 255, 0.6);
          padding: 1rem;
          border-radius: 8px;
        }

        .required-documents h5, .special-permits h5, .additional-requirements h5 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .market-intelligence {
          background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
          border: 2px solid #7c3aed;
          border-radius: 16px;
          padding: 2rem;
        }

        .intelligence-overview {
          margin-bottom: 2rem;
        }

        .recommendation-text {
          background: rgba(255, 255, 255, 0.8);
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #7c3aed;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .timing-recommendation {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .cost-optimization {
          background: rgba(16, 185, 129, 0.1);
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .optimization-list {
          margin: 0.5rem 0 0 1rem;
        }

        .route-optimization {
          background: rgba(59, 130, 246, 0.1);
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .optimization-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }

        .route-recommendations {
          margin-top: 0.5rem;
        }

        .route-recommendations ul {
          margin: 0.5rem 0 0 1rem;
        }

        .current-market-analysis {
          background: rgba(255, 255, 255, 0.6);
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .market-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }

        .market-metric {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .metric-detail {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .sentiment-bullish {
          color: #059669;
        }

        .sentiment-bearish {
          color: #dc2626;
        }

        .sentiment-neutral {
          color: #6b7280;
        }

        .market-events {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 6px;
        }

        .market-events h6 {
          margin: 0 0 0.5rem 0;
          color: #991b1b;
        }

        .events-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .event {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .event.supply-disruption {
          background: #fee2e2;
          color: #991b1b;
        }

        .event.demand-spike {
          background: #dcfce7;
          color: #166534;
        }

        .event.weather-impact {
          background: #fef3c7;
          color: #92400e;
        }

        .data-sources-attribution {
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
        }

        .data-sources-attribution h6 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .source {
          padding: 0.25rem 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .performance-summary {
          background: rgba(239, 246, 255, 1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .performance-metric {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .metric-benchmark {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .advanced-options-toggle {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          width: 100%;
          transition: all 0.3s ease;
        }

        .advanced-options-toggle:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-2px);
        }

        .advanced-options-panel {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .option-info {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .option-info .warning {
          color: #dc2626;
          font-weight: 600;
        }

        .option-info .info {
          color: #3b82f6;
          font-weight: 600;
        }

        .volume-info {
          margin-top: 0.5rem;
        }

        .volume-warning {
          background: rgba(251, 191, 36, 0.2);
          color: #92400e;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .volume-note {
          background: rgba(59, 130, 246, 0.1);
          color: #1e40af;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .volume-optimal {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .storage-info {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 6px;
        }

        .storage-details {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }

        .safety-requirements, .regulatory-info {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .transport-info {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 6px;
        }

        .current-rate {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .market-factors {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.8rem;
        }

        .driver-availability, .port-congestion {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .loading-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.5rem;
          font-size: 0.8rem;
        }

        .analysis-step {
          color: #6b7280;
        }

        .calculation-mode {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.5rem;
          font-size: 0.8rem;
        }

        .market-status, .pricing-confidence {
          color: #059669;
          font-weight: 600;
        }

        .ai-status {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          min-width: 300px;
          z-index: 1000;
        }

        .status-main {
          font-weight: bold;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }

        .status-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          font-size: 0.7rem;
        }

        .feature {
          background: rgba(59, 130, 246, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .api-status {
          color: #10b981;
        }

        .market-status, .data-quality, .calculation-count {
          color: #60a5fa;
        }

        @media (max-width: 768px) {
          .ai-status {
            position: relative;
            bottom: auto;
            right: auto;
            margin-top: 2rem;
            width: 100%;
          }

          .route-path {
            flex-direction: column;
          }

          .route-arrow {
            transform: rotate(90deg);
            margin: 1rem 0;
          }

          .confidence-metrics {
            flex-direction: column;
            align-items: flex-start;
          }

          .cost-grid, .market-grid, .performance-grid {
            grid-template-columns: 1fr;
          }

          .leg-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .executive-summary {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FuelForm;