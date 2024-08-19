//Defines routes for order-related API calls.
// orderRoutes.js
const express = require('express');
const router = express();
const { trackOrder } = require('../controllers/orderController');

router.post('/trackOrder', trackOrder);

module.exports = router;