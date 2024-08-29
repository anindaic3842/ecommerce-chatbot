const express = require('express');
const router = express();
const { handleFormSubmission, checkEmailfromCustomer } = require('../controllers/commonController');

router.post('/contactinfo', handleFormSubmission);
router.post('/checkemail', checkEmailfromCustomer);

module.exports = router;