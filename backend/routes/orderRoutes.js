//Defines routes for order-related API calls.
// orderRoutes.js
const express = require('express');
const router = express();
const { orderstatus } = require('../controllers/orderController');

router.post('/trackorder', orderstatus);

module.exports = router;