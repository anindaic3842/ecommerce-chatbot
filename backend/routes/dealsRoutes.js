const express = require('express');
const router = express();
const { getLatestDeals } = require('../controllers/dealsController');

router.post('/getLatestDeals', getLatestDeals);

module.exports = router;