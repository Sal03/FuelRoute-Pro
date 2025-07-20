---
description: Repository Information Overview
alwaysApply: true
---

# FuelRoute Pro Information

## Summary
FuelRoute Pro is an interactive web tool for estimating transportation costs for alternative fuels such as hydrogen, methanol, and ammonia. It allows users to input fuel type, volume, transport mode, and origin-destination to calculate estimated logistics costs based on real-world data and models.

## Structure
- **frontend/**: React application with UI components
- **backend/**: Express.js server with API endpoints and business logic
- **config/**: Database and environment configuration
- **models/**: MongoDB data models
- **controllers/**: Request handlers and business logic
- **routes/**: API route definitions
- **services/**: External API integrations and utility services

## Language & Runtime
**Language**: JavaScript (Node.js for backend, React for frontend)
**Version**: Node.js (implied latest LTS)
**Build System**: npm
**Package Manager**: npm

## Dependencies

### Backend Dependencies
**Main Dependencies**:
- express: ^4.18.2 - Web server framework
- mongoose: ^7.5.0 - MongoDB ODM
- axios: ^1.10.0 - HTTP client
- cors: ^2.8.5 - Cross-origin resource sharing
- dotenv: ^16.3.1 - Environment variable management
- helmet: ^7.0.0 - Security middleware
- express-rate-limit: ^6.10.0 - API rate limiting
- searoute: ^0.0.2 - Marine route calculation

**Development Dependencies**:
- nodemon: ^3.0.1 - Development server with hot reload

### Frontend Dependencies
**Main Dependencies**:
- react: ^19.1.0 - UI library
- react-dom: ^19.1.0 - React DOM renderer
- react-scripts: 5.0.1 - Create React App scripts
- recharts: ^3.1.0 - Charting library
- @testing-library/react: ^16.3.0 - Testing utilities

## Build & Installation
```bash
# Install dependencies
npm install

# Start backend server
cd backend
npm run dev

# Start frontend development server
cd frontend
npm start

# Build frontend for production
cd frontend
npm run build
```

## Database
**Type**: MongoDB
**Connection**: Uses mongoose to connect to MongoDB
**Configuration**: Environment variables in .env file
**Models**: Route model for storing route information

## API Integration
**External APIs**:
- EIA API - Energy Information Administration for fuel pricing data
- Google Maps API (optional) - For routing and distance calculation
- OpenRoute Service (optional) - Alternative routing service
- GraphHopper API (optional) - Another routing option

## Testing
**Framework**: Jest (implied from React Testing Library)
**Test Files**: 
- backend/test-eia-api.js - Tests EIA API connection
- backend/test-enhanced-api.js - Tests enhanced API functionality
- backend/test-routing-fixes.js - Tests routing functionality

**Run Command**:
```bash
# Backend tests
cd backend
node test-eia-api.js

# Frontend tests
cd frontend
npm test
```

## Main Entry Points
**Backend**: backend/server.js - Express server setup
**Frontend**: frontend/src/index.js - React application entry point
**API Routes**: 
- /api/routes - Basic routing endpoints
- /api/enhanced - Enhanced routing functionality