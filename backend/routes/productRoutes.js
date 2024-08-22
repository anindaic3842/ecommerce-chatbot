//Defines routes for product-related API calls.
// productRoutes.js
const express = require('express');
const router = express();
const { productSimilarSearch, fetchDistinctCategory, fetchProductsUsingCategory, productDetails, handleBuyProduct } = require('../controllers/productController');

// Route for product search
router.post('/productSimilarSearch', productSimilarSearch);

// Route for product category search
router.post('/productCategorySearch', fetchDistinctCategory);

// Route for searching products by category
router.post('/productSearchByCategory', fetchProductsUsingCategory);

// Route for fetching product details
router.post('/productDetails', productDetails);

// Route for buying a product
router.post('/productbuy', handleBuyProduct);

module.exports = router;