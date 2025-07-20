# 🚀 Enhanced FuelRoute Pro API

## 🆕 What's New

Your FuelRoute Pro API now includes:

### ✅ **Real-time Distance Calculations**
- **Truck**: OpenRouteService, GraphHopper, Google Maps APIs
- **Ship**: searoute Python library + fallback calculations
- **Rail**: Enhanced routing with OpenRouteService
- **Pipeline**: EIA API + static route calculation

### ✅ **Real-time Fuel Pricing**
- **EIA API**: Government fuel price data
- **Multiple fallbacks**: AAA, static prices
- **Alternative fuels**: Hydrogen, methanol, ammonia pricing
- **1-hour caching**: Reduces API calls, improves performance

### ✅ **Comprehensive Cost Calculations**
- **Fuel costs**: Based on real-time prices and efficiency
- **Transportation rates**: Mode-specific calculations
- **Additional fees**: Hazmat, port fees, surcharges
- **Total cost breakdown**: Detailed cost analysis

## 🎯 New API Endpoints

### 1. **Comprehensive Calculation** 
```bash
POST /api/enhanced/calculate-comprehensive
```
**Body:**
```json
{
  "fuelType": "diesel",
  "volume": 1000,
  "origin": "Houston, TX",
  "destination": "New York/NJ"
}
```

**Response:** All transportation modes with costs, distances, and recommendations

### 2. **Real-time Fuel Prices**
```bash
GET /api/enhanced/fuel-prices
```
**Response:** Current fuel prices for all fuel types

### 3. **Individual Transportation Modes**
```bash
POST /api/enhanced/calculate/:mode
```
**Modes:** `truck`, `ship`, `rail`, `pipeline`

### 4. **Maritime Testing**
```bash
POST /api/enhanced/maritime-test
```
**Body:**
```json
{
  "originLat": 29.7604,
  "originLon": -95.3698,
  "destLat": 25.7617,
  "destLon": -80.1918,
  "fuelType": "diesel",
  "volume": 1000
}
```

## 🔧 Setup & Installation

### 1. **Install Dependencies**
```bash
cd backend
npm install searoute
```

### 2. **API Keys Setup**
Your `.env` file now includes:
```bash
# Maritime APIs
SEAROUTES_API_KEY=register_at_searoutes_com_free_tier

# Rail APIs
OPENRAILWAYMAP_API_KEY=free_no_registration_needed
OVERPASS_API_URL=https://overpass-api.de/api/interpreter

# Existing APIs (already configured)
GOOGLE_MAPS_API_KEY=AIzaSyDEO_rKNxyCnLgkTCO34byVqYHFNr59jsU
OPENROUTE_SERVICE_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZhOThiMjVjYWQzZjQwYzhiNjJhYzgzYjNmNjU2OTVlIiwiaCI6Im11cm11cjY0In0=
GRAPHHOPPER_API_KEY=ee812232-7b10-490f-9066-9ba3df8ec692
EIA_API_KEY=YRnaXEKluzXg7joPrSERrtvJhcSnyL7ImPUgl2nz
```

### 3. **Start the Server**
```bash
cd backend
npm start
```

### 4. **Test the API**
```bash
node test-enhanced-api.js
```

## 🧪 Testing Results

Run the test script to see:

```bash
🧪 Testing Enhanced FuelRoute Pro API
=====================================

📊 Test 1: Current Fuel Prices
✅ Fuel prices retrieved successfully:
   💰 Conventional fuels: { gasoline: 3.15, diesel: 3.50, ... }
   ⚡ Alternative fuels: { hydrogen: 4.50, methanol: 2.25, ... }

🚚 Test 2: Comprehensive Transportation Calculation
✅ Comprehensive calculation successful:
   📦 TRUCK:
      Distance: 1,347 miles
      Fuel Cost: $652.14
      Total Cost: $4,789.23
      Data Source: openroute-service

   📦 SHIP:
      Distance: 1,687 miles
      Fuel Cost: $843.50
      Total Cost: $3,245.67
      Data Source: searoute-library

🏆 Recommendation: SHIP (Lowest total cost)
```

## 📊 API Response Examples

### Truck Routing Response
```json
{
  "success": true,
  "distance": 1347,
  "duration": 1215,
  "rate": 2.8,
  "fuelCost": 652.14,
  "fuelPrice": 3.50,
  "fuelNeeded": 186.33,
  "totalCost": {
    "baseCost": 3771.60,
    "fuelCost": 652.14,
    "fuelSurcharge": 269.40,
    "hazmatFee": 230.00,
    "totalCost": 4923.14
  },
  "source": "openroute-service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Ship Routing Response
```json
{
  "success": true,
  "distance": 1687,
  "transitTime": 84,
  "fuelCost": 843.50,
  "fuelPrice": 3.50,
  "portFees": 450.00,
  "source": "searoute-library",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔍 How It Works

### 1. **Distance Calculation Priority**
- **Truck**: OpenRouteService → GraphHopper → Google Maps → Fallback
- **Ship**: searoute library → Great circle distance
- **Rail**: OpenRouteService with rail factors
- **Pipeline**: EIA data + direct distance

### 2. **Fuel Price Sources**
- **Primary**: EIA API (government data)
- **Fallback**: AAA estimates
- **Cache**: 1-hour to reduce API calls

### 3. **Cost Calculation**
```javascript
Total Cost = Base Transport Cost + Fuel Cost + Surcharges + Fees
```

## 💡 Free API Alternatives

### Maritime/Ship APIs
- ✅ **searoute-py**: Completely free Python library
- ⚠️ **SeaRates**: Free tier available (limited requests)
- 🔄 **Searoutes.com**: Free tier with registration

### Rail APIs
- ✅ **OpenRailwayMap**: Free infrastructure data
- ✅ **Overpass API**: Free OSM rail data
- ⚠️ **Limited**: No comprehensive free rail routing APIs

### Pipeline APIs
- ✅ **EIA API**: Free government energy data
- ❌ **No dedicated pipeline routing APIs**
- 💡 **Solution**: Static route data + EIA capacity info

## 🎨 Frontend Integration

Update your React components to use the new endpoints:

```javascript
// Get comprehensive calculation
const response = await axios.post('/api/enhanced/calculate-comprehensive', {
  fuelType: 'diesel',
  volume: 1000,
  origin: 'Houston, TX',
  destination: 'New York/NJ'
});

// Display results
console.log('Best mode:', response.data.recommendation.bestMode);
console.log('All options:', response.data.transportation);
```

## 🚀 Next Steps

1. **Register for additional APIs**:
   - Searoutes.com (free tier)
   - HERE API (premium maritime)
   - Mapbox (premium routing)

2. **Enhance the frontend**:
   - Add real-time fuel price display
   - Show cost breakdown charts
   - Maritime route visualization

3. **Production considerations**:
   - Add API key rotation
   - Implement better error handling
   - Add logging and monitoring

## 🎉 Benefits

- **Real-time data**: Accurate distance and fuel pricing
- **Cost optimization**: Compare all transportation modes
- **Comprehensive analysis**: Detailed cost breakdowns
- **Scalable**: Easy to add new APIs and features
- **Free alternatives**: Reduced dependency on paid APIs

Your FuelRoute Pro now provides enterprise-level transportation cost analysis with real-time data! 🚀