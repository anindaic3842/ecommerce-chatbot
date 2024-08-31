//Handles product-related requests.
// productController.js
const { text } = require('body-parser');
const { db } = require('../config/dbConfig');
const logger = require('../utils/logger');


/**
 * Fetch distinct product categories
 *
 * @async
 * @param {*} req
 * @param {*} res
 * @returns {*}
 */
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
    logger.error(`Distinct Category Search API error message ${JSON.stringify(error.message)}`);
    logger.error(`Distinct Category Search API error stack ${JSON.stringify(error.stack)}`);
    res.status(500).send('Unable to process your request');
  }
};

// Fetch products based on category
/**
 * Description placeholder
 *
 * @async
 * @param {*} req
 * @param {*} res
 * @returns {*}
 */
const fetchProductsUsingCategory = async (req, res) => {
  try {
    logger.info(`ProductSearchAPI - Request Body - ${JSON.stringify(req.body)}`);
    //const category = req.body.text;
    const category = req.body.sessionInfo.parameters.singlecategory;
    const products = await getProductsByCategory(category);
    const quickReplyOptions = products.map(product => ({ text: product._id }));
    logger.info(`Product Search for a Category API - ${JSON.stringify(quickReplyOptions)}`);
    const response = buildRichContentResponse(quickReplyOptions);
    logger.info(`ProductSearchAPI - response - ${JSON.stringify(response)}`);
    res.json(response);
  } catch (error) {
    logger.error(`ProductSearchAPI error ${JSON.stringify(error.message)}`);
    res.status(500).send('Unable to process your request');
  }
};

// Fetch product details by product name
/**
 * Description placeholder
 *
 * @async
 * @param {*} req
 * @param {*} res
 * @returns {*}
 */
const productDetails = async (req, res) => {
  logger.info(`ProductDetailsAPI - request body ${JSON.stringify(req.body)}`);
  try {
    const product = await getProductDetails(req.body.sessionInfo.parameters.product_name);
    if (product) {
      const response = buildProductDetailsResponse(product);
      logger.info(`ProductDetailsAPI - response ${JSON.stringify(response)}`);
      res.json(response);
    } else {
      res.json(buildNotFoundResponse());
    }
  } catch (error) {
    logger.error(`ProductDetailsAPI - error ${JSON.stringify(error.message)}`);
    res.status(500).send('Unable to process your request');
  }
};

// Fetch products based on search query
/**
 * Description placeholder
 *
 * @async
 * @param {*} req
 * @param {*} res
 * @returns {*}
 */
const productSimilarSearch = async (req, res) => {
  logger.info(`Received productSimilarSearch API request ${JSON.stringify(req.body)}`);
  try {
    const productQuery = req.body.sessionInfo.parameters.product_name;
    const products = await searchSimilarProducts(productQuery);
    logger.info(`productSimilarSearch product data - ${JSON.stringify(products)}`);
    if (products.length > 0) {
      const response = buildProductSearchResponse(products[0]);
      logger.info(`productSimilarSearch API response ${JSON.stringify(response)}`);
      res.json(response);
    } else {
      res.json(buildNotFoundResponse());
    }
  } catch (error) {
    logger.error(`productSimilarSearch API error ${error.message}`);
    res.status(500).send('Unable to process your request');
  }
};

/**
 * Description placeholder
 *
 * @async
 * @param {*} req
 * @param {*} res
 * @returns {*}
 */
const handleBuyProduct = async (req, res) => {
  logger.info(`Received handleBuyProduct API request ${JSON.stringify(req.body)}`);
  try {
    // Extract necessary parameters from the request
    const productquery = req.body.sessionInfo.parameters.product_name;
    const email = req.body.sessionInfo.parameters.email;
    const quantity = req.body.sessionInfo.parameters.quantity;
    // Fetch the product details from the database
    const product = await searchSimilarProducts(productquery)
    const customer = await getCustomerData(email);

    //Insert records into orders
    const orderDetails = await createOrderForCustomer(customer, product[0], quantity);

    logger.info(`handleBuyProduct product data - ${JSON.stringify(product)} - orderData - ${JSON.stringify(orderDetails)}`);
    if (product) {
      // Prepare the response confirming the purchase and providing the payment link
      const response = buildBuyProductResponse(product[0], orderDetails.order_id);
      // Send the response back to Dialogflow
      logger.info(`handleBuyProduct API response ${JSON.stringify(response)}`);
      res.json(response);
    } else {
      // Handle case where product is not found
      const response = buildProductNotFoundResponse(productquery);
      logger.info(`handleBuyProduct NO product found response ${JSON.stringify(response)}`);
      // Send the response back to Dialogflow
      res.json(response);
    }
  } catch (error) {
    logger.error(`Error in handleBuyProduct webhook:${error.message} - ${error.stack}`);
    // Respond with an error message
    res.status(500).json(buildGenericErrorResponse());
  }
};

// Helper functions
/**
 * Description placeholder
 *
 * @async
 * @param {*} customer
 * @param {*} product
 * @param {*} quantityOrdered
 * @returns {unknown}
 */
const createOrderForCustomer = async (customer, product, quantityOrdered) => {

  //shipping carriers list 
  const trackingInfo = generateShippingCarrierAndTrackingNumber();
  // Prepare data to be saved
  const orderId = generateUniqueOrderID();
  const ordData = {
    order_id: orderId,
    product_id: product._id,
    customer_id: customer.customer_id,
    quantity: quantityOrdered,
    unit_price: product.price,
    total_price: (quantityOrdered * product.price),
    order_date: new Date(),
    shipping_address: customer.address,
    shipping_carrier: "To be determined after payment",//trackingInfo.Courier,
    tracking_number: "To be determined after payment",//trackingInfo.TrackingNumber,
    payment_method: "Pending",
    status: "Ordered"
  };

    // Insert the order data into the 'orders' collection
    const insertResult = await db.collection('orders').insertOne(ordData);

    // Check if the insertion was acknowledged and successful
    if (insertResult.acknowledged) {
      logger.info('Order inserted successfully:', insertResult.insertedId);
    } else {
      logger.error('Failed to insert order.');
      return null; // Return null if insertion failed
    }

    // Retrieve and return the inserted order document
    const insertedOrder = await db.collection('orders').findOne({ order_id: orderId });

    if (!insertedOrder) {
      logger.error('No order found with order_id:', orderId);
      return null; // Return null if no order is found
    }
    return insertedOrder;
};

/**
 * Description placeholder
 *
 * @async
 * @returns {unknown}
 */
const getDistinctCategories = async () => {
  const collection = db.collection('products');
  return (await collection.distinct('category')).sort();
};

/**
 * Description placeholder
 *
 * @async
 * @param {*} category
 * @returns {unknown}
 */
const getProductsByCategory = async (category) => {
  logger.info(`Finding products for a Category - ${category}`);
  const collection = db.collection('products');
  //return await collection.distinct('product_name', { category }).limit(10).sort();
  return await collection.aggregate([
    { $match: { category } }, // Match documents by category
    { $group: { _id: "$product_name" } }, // Group by product_name to ensure uniqueness
    { $sort: { _id: 1 } }, // Sort by product_name (ascending)
    { $limit: 10 } // Limit to 10 unique products
  ]).toArray();
};

/**
 * Description placeholder
 *
 * @async
 * @param {*} productName
 * @returns {unknown}
 */
const getProductDetails = async (productName) => {
  logger.info(`Fetching products details for a product - ${productName}`);
  const collection = db.collection('products');
  const products = await collection.find({ product_name: productName })
    .limit(1)
    .project({ product_name: 1, description: 1, price: 1, quantity: 1 })
    .toArray();
  return products.length > 0 ? products[0] : null;
};

/**
 * Description placeholder
 *
 * @async
 * @param {*} query
 * @returns {unknown}
 */
const searchSimilarProducts = async (query) => {
  const collection = db.collection('products');
  const searchQuery = { product_name: { $regex: query } };
  const options = {
    sort: { product_name: 1 },
    projection: { _id: 1, product_name: 1, price: 1, description: 1, quantity: 1 },
  };
  return await collection.find(searchQuery, options).toArray();
};

/**
 * Description placeholder
 *
 * @async
 * @param {*} emailid
 * @returns {unknown}
 */
const getCustomerData = async (emailid) => {
  logger.info(`Fetching products details for a product - ${emailid}`);
  const collection = db.collection('customers');
  const customer = await collection.find({ email: emailid })
    .limit(1)
    .project({ customer_id: 1, first_name: 1, email: 1, address: 1 })
    .toArray();
  return customer.length > 0 ? customer[0] : null;
};

/**
 * Description placeholder
 *
 * @returns {string}
 */
const generateUniqueOrderID = () => {
  // Prefix for the order ID
  const prefix = 'ORD';

  // Generate a random number with 5 digits
  const randomNumber = Math.floor(10000 + Math.random() * 90000); // Generates a number between 10000 and 99999

  // Combine the prefix and the random number to create the unique ID
  const uniqueOrderID = `${prefix}${randomNumber}`;

  return uniqueOrderID;
};

/**
 * Description placeholder
 *
 * @returns {{ TrackingNumber: string; Courier: any; }}
 */
const generateShippingCarrierAndTrackingNumber = () => {

  // List of courier names
  const couriers = ["UPS", "FedEx", "DHL", "USPS", "Amazon Logistics", "Royal Mail", "Canada Post", "Australia Post", "TNT", "Aramex"];

  // Pick a random courier name from the list
  const randomCourier = couriers[Math.floor(Math.random() * couriers.length)];

  // Get the current timestamp in milliseconds
  const timestamp = Date.now().toString(); // Get the full timestamp in milliseconds

  // Generate a random 5-character alphanumeric string
  const randomAlphanumeric = generateRandomAlphanumeric(5);

  // Combine the courier name, timestamp, and random alphanumeric string to form the tracking number
  const uniqueTrackingNumber = `${randomCourier}-${timestamp}-${randomAlphanumeric}`;

  return { TrackingNumber: uniqueTrackingNumber, Courier: randomCourier };

};

// Function to generate a random alphanumeric string of a given length
/**
 * Description placeholder
 *
 * @param {*} length
 * @returns {string}
 */
const generateRandomAlphanumeric = (length) => {

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;

};

/**
 * Description placeholder
 *
 * @param {*} options
 * @returns {{ fulfillment_response: { messages: {}; }; }}
 */
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

/**
 * Description placeholder
 *
 * @param {*} product
 * @returns {{ fulfillment_response: { messages: {}; source: string; }; }}
 */
const buildProductDetailsResponse = (product) => {
  // Determine stock status and color based on quantity
  let stockStatus = "";
  let stockColor = "";

  if (product.quantity > 5) {
    stockStatus = `In Stock (${product.quantity})`;
    stockColor = "green";
  } else if (product.quantity > 0 && product.quantity <= 5) {
    stockStatus = `Quickly running Out of Stock (${product.quantity})`;
    stockColor = "orange";
  } else {
    stockStatus = "Out of Stock";
    stockColor = "red";
  }

  return {
    fulfillment_response: {
      messages: [
        {
          responseType: "ENTRY_PROMPT",
          type: "formattedText",
          text: {
            text: [
              `<div style="font-family: Arial, sans-serif;">
                 <p>- <strong>Description:</strong> ${product.description}</p>
                 <p>- <strong>Price:</strong> ${product.price}</p>
                 <p>- <strong>Availability:</strong> 
                   <b><span style="color: ${stockColor};">${stockStatus}</span></b>
                 </p>
                 <p>Would you like to purchase this product, or go back to the product list?</p>
               </div>`
            ]
          }
        },
        {
          responseType: "ENTRY_PROMPT",
          payload: {
            richContent: [
              [
                {
                  type: "chips",
                  options: [
                    { text: "Buy" },
                    { text: "Go back to product list" },
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
  };
};

/**
 * Description placeholder
 *
 * @param {*} product
 * @returns {{ fulfillment_response: { messages: {}; source: string; }; }}
 */
const buildProductSearchResponse = (product) => {

  let stockStatus = "";
  let stockColor = "";

  if (product.quantity > 5) {
    stockStatus = `In Stock (${product.quantity})`;
    stockColor = "green";
  } else if (product.quantity > 0 && product.quantity <= 5) {
    stockStatus = `Quickly running Out of Stock (${product.quantity})`;
    stockColor = "orange";
  } else {
    stockStatus = "Out of Stock";
    stockColor = "red";
  }

  return {
    fulfillment_response: {
      messages: [
        {
          responseType: "ENTRY_PROMPT",
          type: "plainText",
          text: {
            text: [`<span>Great choice! You searched for <b>${product.product_name}</b>. Here are the details:</span>`
            ]
          }
        }
        ,
        {
          responseType: "ENTRY_PROMPT",
          type: "formattedText",
          text: {
            text: [
              `<div style="font-family: Arial, sans-serif;">
               <p>- <strong>Description:</strong> ${product.description}</p>
               <p>- <strong>Price:</strong> ${product.price}</p>
               <p>- <strong>Availability:</strong> 
                 <b><span style="color: ${stockColor};">${stockStatus}</span></b>
               </p>
               <p>Would you like to purchase this product, or go back to the product list?</p>
             </div>`
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
  };
};

/**
 * Description placeholder
 *
 * @param {*} product
 * @param {*} order_id
 * @returns {{ fulfillment_response: { messages: {}; }; }}
 */
const buildBuyProductResponse = (product, order_id) => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        text: {
          text: [
            `<div style="font-family: Arial, sans-serif;">
                 <p>Your order for <strong>${product.product_name}</strong> has been placed successfully!</p>
                 <p><strong>Order Number:</strong> ${order_id}</p>
                 <p>Please complete your payment on our website using the link below:</p>
                 <p style="margin: 8px 0;">
                   👉 <a href="https://yourwebsite.com/payment?order=${order_id}" target="_blank">[Pay Now]</a>
                 </p>
                 <p>Thank you for chatting with us! If you have more questions, feel free to start a new session. Goodbye!</p>
               </div>`
          ]
        }
      }
    ]
  }
}
);

/**
 * Description placeholder
 *
 * @param {*} productquery
 * @returns {{ fulfillment_response: { messages: {}; }; }}
 */
const buildProductNotFoundResponse = (productquery) => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        text: {
          text: [
            `Sorry, we couldn't find the product ${productquery}. Would you like to search for another product?`
          ]
        }
      },
      {
        responseType: "ENTRY_PROMPT",
        payload: {
          richContent: [
            [
              {
                type: "chips",
                options: [
                  { text: "Search for another item" },
                  { text: "Return to main menu" }
                ]
              }
            ]
          ]
        }
      }
    ]
  }
});

/**
 * Description placeholder
 *
 * @returns {{ fulfillment_response: { messages: {}; }; }}
 */
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

/**
 * Description placeholder
 *
 * @returns {{ fulfillment_response: { messages: {}; }; }}
 */
const buildGenericErrorResponse = () => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        text: {
          text: [
            "Sorry, there was an issue processing your request. Please try again later."
          ]
        }
      }
    ]
  }
});

module.exports = { productSimilarSearch, fetchDistinctCategory, fetchProductsUsingCategory, productDetails, handleBuyProduct };