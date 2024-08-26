const { db } = require('../config/dbConfig');
const logger = require('../utils/logger');

const getLatestDeals = async (req, res) => {
    logger.info(`Received getLatestDeals API request ${JSON.stringify(req.body)}`);
    try {
      //const orderNumber = req.body.sessionInfo.parameters.param_order_number;
      const collection = db.collection('deals');
      const dealsData = await collection.find().sort({discount_percentage : -1}).limit(5).toArray();
      logger.info(`getLatestDeals API order data - ${JSON.stringify(dealsData)}`);
      if (dealsData) {
        res.json(buildDealsAvailableResponse(dealsData));
      } else {
        res.json(buildNoDealsResponse());
      }
    } catch (error) {
      logger.error(`getLatestDeals API error - ${ error.message }`);
      res.status(500).send('Unable to process your request');
    }
  };
  

  const buildNoDealsResponse = () => ({
    fulfillment_response: {
      messages: [
        {
          responseType: "ENTRY_PROMPT",
          text: {
            text: [
              "There are no deals available right now."
            ]
          }
        }
      ]
    }
  });
  
const buildDealsAvailableResponse = (dealsData) => ({
    "fulfillment_response": {
        "messages": [
            {
                "responseType": "ENTRY_PROMPT",
                "payload": {
                    "richContent": [
                        [
                            {
                                "type": "carousel-card",
                                "title": "Summer Savings",
                                "description": "Up to 50% off on selected items",
                                "image": "https://via.placeholder.com/300x200.png?text=Sample+Image",
                                "link": "https://example.com/deals/summer-savings",
                                "buttons": [
                                    { text: 'Buy now', link: 'https://example.com/buy' },
                                    { text: 'Learn more', link: 'https://example.com/learn' }
                                ]
                            },
                            {
                                "type": "carousel-card",
                                "title": "Winter Wonderland Deals",
                                "description": "Exclusive winter sale with up to 40% off",
                                "image": "https://via.placeholder.com/300x200.png?text=Sample+Image",
                                "link": "https://example.com/deals/summer-savings",
                                "buttons": [
                                    { text: 'Buy now', link: 'https://example.com/buy' },
                                    { text: 'Learn more', link: 'https://example.com/learn' }
                                ]
                            },
                            {
                                "type": "carousel-card",
                                "title": "Spring Into Savings",
                                "description": "Fresh deals with up to 30% off",
                                "image": "https://via.placeholder.com/300x200.png?text=Sample+Image",
                                "link": "https://example.com/deals/summer-savings",
                                "buttons": [
                                    { text: 'Buy now', link: 'https://example.com/buy' },
                                    { text: 'Learn more', link: 'https://example.com/learn' }
                                ]
                            }
                        ]
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
                                    { text: "Search for a product" },
                                    { text: "Go back to main menu" }
                                ]
                            }
                        ]
                    ]
                }
            }
        ]
    }
}
);

module.exports = {
    getLatestDeals
  };