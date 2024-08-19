//Handles product-related requests.

// productController.js
const { db } = require('../config/dbConfig');
const logger = require('../utils/logger');

// Fetch distinct product categories
const productCategorySearch = async (req, res) => {
  logger.info('Entered API for Distinct Category Search');
  try {
    const categories = await getDistinctCategories();
    const quickReplyOptions = categories.map(category => ({ text: category }));
    const response = buildRichContentResponse(quickReplyOptions);
    res.json(response);
  } catch (error) {
    logger.error('productCategorySearch API error', { error });
    res.status(500).send('Unable to process your request');
  }
};

// Fetch products based on category
const productSearchByCategory = async (req, res) => {
  logger.info('Received productSearchByCategory API request');
  try {
    const category = req.body.text;
    const products = await getProductsByCategory(category);
    const quickReplyOptions = products.map(product => ({ text: product }));
    const response = buildRichContentResponse(quickReplyOptions);
    res.json(response);
  } catch (error) {
    logger.error('productSearchByCategory API error', { error });
    res.status(500).send('Unable to process your request');
  }
};

// Fetch product details by product name
const productDetails = async (req, res) => {
  logger.info('Received productDetails API request', { requestBody: req.body.text });
  try {
    const product = await getProductDetails(req.body.text);

    if (product) {
      const response = buildProductDetailsResponse(product);
      res.json(response);
    } else {
      res.json(buildNotFoundResponse());
    }
  } catch (error) {
    logger.error('productDetails API error', { error });
    res.status(500).send('Unable to process your request');
  }
};

// Fetch products based on search query
const productSearch = async (req, res) => {
  logger.info('Received productSearch API request');
  try {
    const productQuery = req.body.sessionInfo.parameters.productQuery;
    const products = await searchProducts(productQuery);

    if (products.length > 0) {
      res.json(buildProductSearchResponse(products[0]));
    } else {
      res.json(buildNotFoundResponse());
    }
  } catch (error) {
    logger.error('productSearch API error', { error });
    res.status(500).send('Unable to process your request');
  }
};

// Helper functions

const getDistinctCategories = async () => {
  const collection = db.collection('products');
  return await collection.distinct('category');
};

const getProductsByCategory = async (category) => {
  const collection = db.collection('products');
  return await collection.distinct('product_name', { category });
};

const getProductDetails = async (productName) => {
  const collection = db.collection('products');
  const products = await collection.find({ product_name: productName })
    .limit(1)
    .project({ product_name: 1, description: 1, price: 1, quantity: 1 })
    .toArray();
  return products.length > 0 ? products[0] : null;
};

const searchProducts = async (query) => {
  const collection = db.collection('products');
  const searchQuery = { $text: { $search: query } };
  const options = {
    sort: { product_name: 1 },
    projection: { _id: 0, product_name: 1, price: 1, description: 1 },
  };
  return await collection.find(searchQuery, options).toArray();
};

const buildRichContentResponse = (options) => ({
  fulfillment_response: {
    messages: [
      {
        payload: {
          richContent: [
            [
              {
                type: "chips",
                options
              }
            ]
          ]
        }
      }
    ]
  }
});

const buildProductDetailsResponse = (product) => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        text: {
          text: [
            `\n\n- **Description:** ${product.description}\n- **Price:** ${product.price}\n- **Availability:** ${product.quantity}\n\nWould you like to purchase this product, or go back to the product list?`
          ]
        }
      }
    ]
  }
});

const buildProductSearchResponse = (product) => ({
  fulfillment_response: {
    messages: [
      {
        text: {
          text: [`${product.product_name}: ${product.description} - ${product.price}`]
        }
      }
    ]
  }
});

const buildNotFoundResponse = () => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        text: {
          text: ["Sorry! I could not find what you were looking for. \n\nWould you like to go back to the product list?"]
        }
      }
    ]
  }
});

module.exports = { productSearch, productCategorySearch, productSearchByCategory, productDetails };