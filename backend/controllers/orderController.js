//Handles order-related requests.
// orderController.js
const { text } = require('body-parser');
const { db } = require('../config/dbConfig');
const logger = require('../utils/logger');
const constants = require('../utils/constants');

const OrderNotFoundQuickReplies = constants.buildDynamicQuickReplies(["Re-enter Order Number","Return to main menu","Speak to customer support"]).payload;
const OrderFoundQuickReplies = constants.buildDynamicQuickReplies(["Track another order","Return to main menu"]).payload;

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
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                <h2 style="text-align: center; color: #0073b7; margin-bottom: 20px;">Order Tracking Status</h2>
                <p style="margin: 10px 0;"><strong style="color: #555;">Order ID:</strong> ${order.order_id}</p>
                <p style="margin: 10px 0;"><strong style="color: #555;">Shipping Carrier:</strong> ${order.shipping_carrier}</p>
                <p style="margin: 10px 0;"><strong style="color: #555;">Tracking Number:</strong> ${order.tracking_number}</p>
                <p style="margin: 10px 0; font-weight: bold; color: ${order.status === 'Shipped' ? '#28a745' : '#dc3545'};"><strong>Current Status:</strong> ${order.status}</p>
                <p style="margin: 10px 0;"><strong style="color: #555;">Estimated Delivery:</strong> ${order.estimated_delivery ? order.estimated_delivery : 'To be determined'}</p>
                <div style="margin-top: 20px; text-align: center;">
                    <a href="https://yourtrackingwebsite.com/track?order_id=${order.order_id}" style="background-color: #0073b7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Order</a>
                </div>
            </div>`
          ]
        }
      },
      {
        "responseType": "ENTRY_PROMPT",
        "payload": OrderFoundQuickReplies
        // {
        //   "richContent": [
        //     [
        //       {
        //         "type": "chips",
        //         "options": [
        //           {
        //             "text": "Track another order"
        //           },
        //           {
        //             "text": "Return to main menu"
        //           },
        //           // {
        //           //   "text": "Speak to customer support"
        //           // }
        //         ]
        //       }
        //     ]
        //   ]
        // }
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
      },
      {
        responseType: "ENTRY_PROMPT",
        "payload": OrderNotFoundQuickReplies
        // {
        //   "richContent": [
        //     [
        //       {
        //         "type": "chips",
        //         "options": [
        //           {
        //             "text": "Re-enter Order Number"
        //           },
        //           {
        //             "text": "Return to main menu"
        //           },
        //           {
        //             "text": "Speak to customer support"
        //           }
        //         ]
        //       }
        //     ]
        //   ]
        // }
      }

    ]
  }
});

module.exports = {
  orderstatus
};