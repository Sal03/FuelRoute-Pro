// Simple and Robust Fuel Price Service
const axios = require('axios');

class SimpleFuelPriceService {
  constructor() {
    this.apiKeys = {
      eia: process.env.EIA_API_KEY,
    };
    
    // Cache prices for 1 hour
    this.priceCache = {
      data: null,
      timestamp: null,
      ttl: 3600000 // 1 hour in milliseconds
    };

    // Current market prices (updated regularly)
    this.marketPrices = {
      gasoline: 3.15,
      diesel: 3.50,
      jetFuel: 3.75,
      heating_oil: 3.40,
      hydrogen: 4.50,
      methanol: 2.25,
      ammonia: 1.85,
      naturalGas: 2.15,
      lastUpdated: new Date().toISOString()
    };
  }

  // Quick method to get current fuel prices
  async getCurrentFuelPrices() {
    // Check cache first
    if (this.priceCache.data && 
        this.priceCache.timestamp && 
        Date.now() - this.priceCache.timestamp < this.priceCache.ttl) {
      return this.priceCache.data;
    }

    // Try to get fresh data, but fallback quickly
    let priceData = null;
    
    try {
      // Quick EIA API call with short timeout
      priceData = await this.getEIAFuelPricesQuick();
    } catch (error) {
      // Only log during non-startup conditions to avoid startup noise
      if (process.uptime() > 5) { // Only log if server has been running for more than 5 seconds
        console.log('⚠️  EIA API unavailable, using market prices:', error.message);
      }
    }

    // Use market prices if API fails
    if (!priceData) {
      priceData = this.getMarketPrices();
    }

    // Cache the result
    this.priceCache.data = priceData;
    this.priceCache.timestamp = Date.now();
    
    return priceData;
  }

  // Quick EIA API call with short timeout
  async getEIAFuelPricesQuick() {
    const response = await axios.get('https://api.eia.gov/v2/petroleum/pri/gnd/data/', {
      params: {
        'api_key': this.apiKeys.eia,
        'frequency': 'weekly',
        'data[0]': 'value',
        'facets[product][]': 'EPD2D',
        'sort[0][column]': 'period',
        'sort[0][direction]': 'desc',
        'offset': 0,
        'length': 2
      },
      timeout: 10000 // Match the timeout mentioned in the error
    });

    if (response.data.response && response.data.response.data.length > 0) {
      const latestPrice = response.data.response.data[0].value;
      
      return {
        gasoline: latestPrice,
        diesel: latestPrice * 1.15,
        jetFuel: latestPrice * 1.25,
        heating_oil: latestPrice * 1.10,
        hydrogen: 4.50,
        methanol: 2.25,
        ammonia: 1.85,
        naturalGas: 2.15,
        source: 'eia-api-quick',
        timestamp: new Date(),
        currency: 'USD',
        unit: 'per_gallon'
      };
    }
    
    throw new Error('No EIA data available');
  }

  // Reliable market prices (fallback)
  getMarketPrices() {
    return {
      gasoline: this.marketPrices.gasoline,
      diesel: this.marketPrices.diesel,
      jetFuel: this.marketPrices.jetFuel,
      heating_oil: this.marketPrices.heating_oil,
      hydrogen: this.marketPrices.hydrogen,
      methanol: this.marketPrices.methanol,
      ammonia: this.marketPrices.ammonia,
      naturalGas: this.marketPrices.naturalGas,
      source: 'market-prices',
      timestamp: new Date(),
      currency: 'USD',
      unit: 'per_gallon'
    };
  }

  // Get fuel prices for alternative fuels
  async getAlternativeFuelPrices() {
    return {
      hydrogen: 4.50,
      methanol: 2.25,
      ammonia: 1.85,
      naturalGas: 2.15,
      source: 'market-data',
      timestamp: new Date(),
      currency: 'USD'
    };
  }

  // Calculate fuel cost for transportation
  calculateFuelCost(distance, fuelType, volume, fuelEfficiency) {
    const prices = this.priceCache.data || this.getMarketPrices();
    const fuelPrice = prices[fuelType] || 3.25;
    const fuelNeeded = distance / fuelEfficiency;
    
    return {
      fuelCost: fuelNeeded * fuelPrice,
      fuelPrice: fuelPrice,
      fuelNeeded: fuelNeeded,
      priceSource: prices.source,
      timestamp: prices.timestamp
    };
  }

  // Get fuel efficiency by transportation mode
  getFuelEfficiency(mode, fuelType) {
    const efficiencies = {
      truck: {
        gasoline: 6.5,
        diesel: 7.2,
        hydrogen: 5.8,
        methanol: 4.2,
        ammonia: 3.8
      },
      rail: {
        diesel: 480,
        gasoline: 420,
        hydrogen: 380,
        methanol: 320,
        ammonia: 290
      },
      ship: {
        diesel: 0.12,
        gasoline: 0.15,
        hydrogen: 0.18,
        methanol: 0.20,
        ammonia: 0.22
      },
      pipeline: {
        naturalGas: 0.05,
        hydrogen: 0.08,
        methanol: 0.06,
        ammonia: 0.07
      }
    };

    return efficiencies[mode]?.[fuelType] || 5.0;
  }

  // Clear cache
  clearCache() {
    this.priceCache.data = null;
    this.priceCache.timestamp = null;
  }

  // Update market prices manually
  updateMarketPrices(newPrices) {
    this.marketPrices = { ...this.marketPrices, ...newPrices };
    this.clearCache();
  }
}

module.exports = SimpleFuelPriceService;