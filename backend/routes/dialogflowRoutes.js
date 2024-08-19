//Defines routes for Dialogflow-related API calls.
// dialogflowRoutes.js
const express = require('express');
const router = express();
const { detectIntent } = require('../controllers/dialogflowController');

router.post('/detectIntent', detectIntent);

module.exports = router ;