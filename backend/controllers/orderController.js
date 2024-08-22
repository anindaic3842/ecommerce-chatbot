//Handles order-related requests.
// orderController.js
const { text } = require('body-parser');
const { db } = require('../config/dbConfig');
const logger = require('../utils/logger');

const orderstatus = async (req, res) => {
  logger.info(`Received orderstatus API request ${JSON.stringify(req.body)}`);
  try {
    const orderNumber = req.body.sessionInfo.parameters.param_order_number;
    const collection = db.collection('orders');
    const order = await collection.findOne({ order_id : orderNumber });
    logger.info(`trackOrder API order data - ${JSON.stringify(order)}`);
    if (order) {
      res.json(buildOrderTrackResponse(order));
    } else {
      res.json(buildNoOrderResponse());
    }
  } catch (error) {
    logger.error(`trackOrder API error - ${ error.message }`);
    res.status(500).send('Unable to process your request');
  }
};

const buildOrderTrackResponse = (order) => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        text: {
          text: [
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
               <h2 style="text-align: center; color: #333;">Order Tracking Status</h2>
               <p><strong>Order ID:</strong> ${order.order_id}</p>
               <p><strong>Shipping Carrier:</strong> ${order.shipping_carrier}</p>
               <p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
               <p><strong>Current Status:</strong> ${order.status}</p>
               <p><strong>Estimated Delivery:</strong> ${order.estimated_delivery}</p>
               <div style="margin-top: 20px; text-align: center;">
                 <a href="https://yourtrackingwebsite.com/track?order_id=${order.order_id}" style="background-color: #0073b7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Your Order</a>
               </div>
             </div>`
          ]
        }
      }
    ]
  }
}
);

const buildNoOrderResponse = () => ({
  fulfillment_response: {
    messages: [
      {
        responseType: "ENTRY_PROMPT",
        text: {
          text: [
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8d7da; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); color: #721c24;">
               <h2 style="text-align: center; color: #721c24;">Order Not Found</h2>
               <p>We're sorry, but we couldn't find an order with the ID you provided.</p>
               <p>Please double-check the order ID and try again.</p>
               <p>If you believe this is an error, feel free to <a href="https://yourwebsite.com/contact" style="color: #721c24; text-decoration: underline;">contact our customer support</a> for further assistance.</p>
             </div>`
          ]
        }
      }
    ]
  }
});

module.exports = {
  orderstatus
};