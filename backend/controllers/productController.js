//Handles product-related requests.

// productController.js
const { db } = require('../config/dbConfig');
const logger = require('../utils/logger');

// Fetch distinct product categories
const fetchDistinctCategory = async (req, res) => {
  logger.info('Entered API for Distinct Category Search');
  try {
    const categories = await getDistinctCategories();
    const quickReplyOptions = categories.map(category => ({ text: category }));
    logger.info(`Distinct Category Search API cat list - ${JSON.stringify(quickReplyOptions)}`)
    const response = buildRichContentResponse(quickReplyOptions);
    logger.info(`Distinct Category Search - response - ${JSON.stringify(response)}`)
    res.json(response);
  } catch (error) {
    logger.error(`Distinct Category Search API error ${JSON.stringify(error)}`);
    res.status(500).send('Unable to process your request');
  }
};

// Fetch products based on category
const fetchProductsUsingCategory = async (req, res) => {
  try {
    logger.info(`ProductSearchAPI - Request Body - ${JSON.stringify(req.body)}`);
    //const category = req.body.text;
    const category = req.body.sessionInfo.parameters.singlecategory;
    const products = await getProductsByCategory(category);
    const quickReplyOptions = products.map(product => ({ text: product }));
    logger.info(`Product Search for a Category API - ${JSON.stringify(quickReplyOptions)}`);
    const response = buildRichContentResponse(quickReplyOptions);
    logger.info(`ProductSearchAPI - response - ${JSON.stringify(response)}`);
    res.json(response);
  } catch (error) {
    logger.error(`ProductSearchAPI error ${JSON.stringify(error)}`);
    res.status(500).send('Unable to process your request');
  }
};

// Fetch product details by product name
const productDetails = async (req, res) => {
  logger.info(`ProductDetailsAPI - request body ${ JSON.stringify(req.body)}`);
  try {
    const product = await getProductDetails(req.body.sessionInfo.parameters.productquery);
    if (product) {
      const response = buildProductDetailsResponse(product);
      res.json(response);
    } else {
      res.json(buildNotFoundResponse());
    }
  } catch (error) {
    logger.error(`ProductDetailsAPI - error ${ JSON.stringify(error)}`);
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
  logger.info(`Finding products for a Category - ${category}`);
  const collection = db.collection('products');
  return await collection.distinct('product_name', { category });
};

const getProductDetails = async (productName) => {
  logger.info(`Fetching products details for a product - ${productName}`);
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
        source: "WEBHOOK",
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
    ],
    tag: 'quick-replies-response'
  }
});

const buildProductDetailsResponse = (product) => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        source: "WEBHOOK",
        text: {
          text: [
            `\n\n- **Description:** ${product.description}\n- **Price:** ${product.price}\n- **Availability:** ${product.quantity}\n\nWould you like to purchase this product, or go back to the product list?`
          ]
        }
      }
    ],
    tag: 'product-details-response'
  }
});

const buildProductSearchResponse = (product) => ({
  fulfillment_response: {
    messages: [
      {
        source: "WEBHOOK",
        text: {
          text: [`${product.product_name}: ${product.description} - ${product.price}`]
        }
      }
    ],
    tag: 'product-list-response'
  }
});

const buildNotFoundResponse = () => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        source: "WEBHOOK",
        text: {
          text: ["Sorry! I could not find what you were looking for. \n\nWould you like to go back to the product list?"]
        }
      }
    ],
    tag: 'no-match-response'
  }
});

module.exports = { productSearch, fetchDistinctCategory, fetchProductsUsingCategory, productDetails };