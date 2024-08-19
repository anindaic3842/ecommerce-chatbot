//Defines routes for product-related API calls.
// productRoutes.js
const express = require('express');
const router = express();
const { productSearch, productCategorySearch, productSearchByCategory, productDetails } = require('../controllers/productController');

// Route for product search
router.post('/productSearch', productSearch);

// Route for product category search
router.post('/productCategorySearch', productCategorySearch);

// Route for searching products by category
router.post('/productSearchByCategory', productSearchByCategory);

// Route for fetching product details
router.post('/productDetails', productDetails);

module.exports = router;