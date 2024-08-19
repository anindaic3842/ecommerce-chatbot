//Handles order-related requests.

// orderController.js
const { db } = require('../config/dbConfig');
const { info, error: _error } = require('../utils/logger');

const trackOrder = async (req, res) => {
  info('Received trackOrder API request');
  try {
    const orderNumber = req.body.queryResult.parameters.orderNumber;
    const collection = db.collection('orders');
    const order = await collection.findOne({ orderNumber });

    if (order) {
      res.json({ fulfillmentText: `Your order status is: ${order.status}` });
    } else {
      res.json({ fulfillmentText: 'Order not found' });
    }
  } catch (error) {
    _error('trackOrder API error - ', { error });
    res.status(500).send('Unable to process your request');
  }
};

module.exports = {
  trackOrder
};