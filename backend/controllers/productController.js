//Handles product-related requests.

// productController.js
const { text } = require('body-parser');
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
    const product =await getProductDetails(req.body.sessionInfo.parameters.productquery);
    if (product) {
      const response = buildProductDetailsResponse(product);
      logger.info(`ProductDetailsAPI - response ${ JSON.stringify(response)}`);
      res.json(response);
    } else {
      res.json(buildNotFoundResponse());
    }
  } catch (error) {
    logger.error(`ProductDetailsAPI - error ${ JSON.stringify(error.message)}`);
    res.status(500).send('Unable to process your request');
  }
};

// Fetch products based on search query
const productSimilarSearch = async (req, res) => {
  logger.info(`Received productSimilarSearch API request ${ JSON.stringify(req.body)}`);
  try {
    const productQuery = req.body.sessionInfo.parameters.product_name;
    const products = await searchSimilarProducts(productQuery);
    logger.info(`productSimilarSearch product data - ${ JSON.stringify(products)}`);
    if (products.length > 0) {
      const response = buildProductSearchResponse(products[0]);
      logger.info(`productSimilarSearch API response ${ JSON.stringify(response)}`);
      res.json(response);
    } else {
      res.json(buildNotFoundResponse());
    }
  } catch (error) {
    logger.error(`productSimilarSearch API error ${ error.message }`);
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

const searchSimilarProducts = async (query) => {
  const collection = db.collection('products');
  const searchQuery = { product_name: { $regex: query } };
  const options = {
    sort: { product_name: 1 },
    projection: { _id: 0, product_name: 1, price: 1, description: 1, quantity : 1 },
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
        type: "formattedText",
        text: {
          text: [`- **Description:** ${product.description}\n- **Price:** ${product.price}\n- **Availability:** ${product.quantity}\n\nWould you like to purchase this product, or go back to the product list?`
          ]
        }
      }
      ,
      {
        responseType: "ENTRY_PROMPT",
        payload: {
          richContent: [
            [
              {
                type: "chips",
                options: [
                  { text: "Buy" },
                  { text: "Go back to product list" }
                ]
              }
            ]
          ]
        }
      }
    ]
    ,source: "WEBHOOK"
  }
});

const buildProductSearchResponse = (product) => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        type: "plainText",
        text: {
          text: [`Great choice! You searched for ${product.product_name}. Here are the details...`
          ]
        }
      }
      ,
      {
        responseType: "ENTRY_PROMPT",
        type: "formattedText",
        text: {
          text: [`- **Description:** ${product.description}\n- **Price:** ${product.price}\n- **Availability:** ${product.quantity}\n\nWould you like to purchase this product, or search for another item?`
          ]
        }
      }
      ,
      {
        responseType: "ENTRY_PROMPT",
        payload: {
          richContent: [
            [
              {
                type: "chips",
                options: [
                  { text: "Buy" },
                  { text: "Search for another item" },
                  { text: "Go back to main menu" }
                ]
              }
            ]
          ]
        }
      }
    ],
    source: "WEBHOOK"
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

module.exports = { productSimilarSearch, fetchDistinctCategory, fetchProductsUsingCategory, productDetails };