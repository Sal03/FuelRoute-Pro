const express = require('express');
const router = express.Router();
const { calculateCost, getRouteHistory } = require('../controllers/routeController');

// POST /api/calculate-cost
router.post('/calculate-cost', calculateCost);

// GET /api/routes
router.get('/routes', getRouteHistory);

// GET /api/fuel-types
router.get('/fuel-types', (req, res) => {
  res.json({
    success: true,
    data: ['hydrogen', 'methanol', 'ammonia']
  });
});

module.exports = router;