const express = require('express');
const router = express();
const { handleFormSubmission } = require('../controllers/commonController');

router.post('/contactinfo', handleFormSubmission);

module.exports = router;