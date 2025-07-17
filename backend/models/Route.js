// Enhanced Route.js model with commodity pricing fields

const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  // Basic route information
  origin: { 
    type: String, 
    required: true, 
    trim: true 
  },
  intermediateHub: { 
    type: String, 
    trim: true 
  },
  destination: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  // Fuel details
  fuelType: { 
    type: String, 
    required: true,
    enum: ['hydrogen', 'methanol', 'ammonia']
  },
  fuelState: { 
    type: String, 
    enum: ['gas', 'liquid'] 
  },
  volume: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  volumeUnit: { 
    type: String,
    enum: ['tonnes', 'kg', 'liters', 'gallons', 'cubic_meters'],
    default: 'tonnes'
  },
  
  // Transport modes (manual or AI-optimized)
  transportMode1: { 
    type: String,
    enum: ['truck', 'rail', 'ship', 'pipeline']
  },
  transportMode2: { 
    type: String,
    enum: ['truck', 'rail', 'ship', 'pipeline'] 
  },
  
  // AI optimization
  optimizationMode: {
    type: String,
    enum: ['cost', 'time', 'manual'],
    default: 'manual'
  },
  optimizedModes: {
    mode1: String,
    mode2: String
  },
  
  // Enhanced cost structure
  calculatedCost: { 
    type: Number, 
    min: 0,
    description: 'Total all-in cost (commodity + transport)'
  },
  commodityCost: {
    type: Number,
    min: 0,
    description: 'Cost of the fuel commodity itself'
  },
  transportationCost: { 
    type: Number, 
    min: 0,
    description: 'Base transportation cost'
  },
  totalTransportCost: {
    type: Number,
    min: 0,
    description: 'Transportation cost including all fees'
  },
  baseCost: { 
    type: Number, 
    min: 0 
  },
  
  // Cost breakdown
  costBreakdown: {
    commodity: { type: Number, min: 0 },
    transport: { type: Number, min: 0 },
    handling: { type: Number, min: 0 },
    terminal: { type: Number, min: 0 },
    transfer: { type: Number, min: 0 },
    insurance: { type: Number, min: 0 },
    carbon: { type: Number, min: 0 },
    regulatory: { type: Number, min: 0 }
  },
  
  // Route metrics
  distance: { 
    type: Number, 
    min: 0 
  },
  confidence: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  
  // Market conditions at time of calculation
  marketConditions: {
    commodityPrice: { type: Number },
    fuelTrend: { type: String, enum: ['rising', 'falling', 'stable'] },
    calculationDate: { type: Date, default: Date.now }
  },
  
  // Route legs (for multi-modal transport)
  legs: {
    leg1: {
      distance: Number,
      mode: String,
      cost: Number
    },
    leg2: {
      distance: Number,
      mode: String,
      cost: Number
    }
  },
  
  // Metadata
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  calculationVersion: {
    type: String,
    default: 'v2.0-enhanced'
  }
});

// Add indexes for better query performance
RouteSchema.index({ timestamp: -1 });
RouteSchema.index({ fuelType: 1, timestamp: -1 });
RouteSchema.index({ origin: 1, destination: 1 });
RouteSchema.index({ optimizationMode: 1 });

// Virtual for cost per unit
RouteSchema.virtual('costPerTonne').get(function() {
  if (this.volume && this.calculatedCost) {
    const volumeInTonnes = this.volumeUnit === 'tonnes' ? this.volume : 
                          this.volumeUnit === 'kg' ? this.volume / 1000 : this.volume;
    return this.calculatedCost / volumeInTonnes;
  }
  return 0;
});

// Method to get cost efficiency rating
RouteSchema.methods.getCostEfficiencyRating = function() {
  const costPerTonne = this.costPerTonne;
  if (costPerTonne < 1000) return 'Excellent';
  if (costPerTonne < 2000) return 'Good';
  if (costPerTonne < 5000) return 'Fair';
  return 'Expensive';
};

// Static method to find similar routes
RouteSchema.statics.findSimilarRoutes = function(origin, destination, fuelType, limit = 5) {
  return this.find({
    origin: origin,
    destination: destination,
    fuelType: fuelType
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Route', RouteSchema);