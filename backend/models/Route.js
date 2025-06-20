const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
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
  transportMode1: { 
    type: String,
    enum: ['truck', 'rail', 'ship', 'pipeline']
  },
  transportMode2: { 
    type: String,
    enum: ['truck', 'rail', 'ship', 'pipeline'] 
  },
  calculatedCost: { 
    type: Number, 
    min: 0 
  },
  baseCost: { 
    type: Number, 
    min: 0 
  },
  distance: { 
    type: Number, 
    min: 0 
  },
  confidence: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Route', RouteSchema);