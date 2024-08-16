const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const cors = require('cors');
const dialogflow = require('@google-cloud/dialogflow-cx');
const uuid = require('uuid');
const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');


// Create a Winston logger that streams to Google Cloud Logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new LoggingWinston()
  ],
});

app.use(bodyParser.json());

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins. For production, specify allowed origins
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type'
}));

//const projectIdCX = 'ai-customer-chatbot';
const locationId = 'us-east1'; // e.g., 'global', 'us-central1'
const agentId = 'a613be68-49b4-448c-98aa-ece71c0bb3ab';
const languageCd = 'en';


// A unique identifier for the given session
const sessionId = uuid.v4();
const projectId = 'ai-customer-chatbot';
// Create a new session
const sessionClient = new dialogflow.SessionsClient({
  apiEndpoint: 'us-east1-dialogflow.googleapis.com'
});

const uri = 'mongodb+srv://anindaic3842:aichatbot123@ai-chatbot-ecomm.ux1n4ub.mongodb.net/?retryWrites=true&w=majority&appName=AI-Chatbot-ECOMM'; // Replace with your MongoDB URI
let db;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    db = client.db('ecommerce');
    const collection = db.collection('products');

    app.get('/', (req, res) => {
      res.send("Server Is Working......")
    });

    //This is a generic API call - It was created for DialogFlow ES
    app.post('/', async (req, res) => {
      logger.info('Received request for webhook - Generic');
      try {
        const intent = req.body.queryResult.intent.displayName;
        const parameters = req.body.queryResult.parameters;
        const intentresponse = req.body.queryResult.fulfillmentText;

        if (intent === 'Order Tracking') {
          const orderNumber = parameters.orderNumber;
          const order = await collection('orders').findOne({ orderNumber });
          if (order) {
            res.json({ fulfillmentText: `Your order status is: ${order.status}` });
          } else {
            res.json({ fulfillmentText: 'Order not found' });
          }
        } else if (intent === 'Product Recommendations') {
          const recommendations = await collection.find().limit(5).toArray();
          const productNames = recommendations.map(product => product.product_name).join(', ');
          res.json({ fulfillmentText: `Recommended products: ${productNames}` });
        }
        else if (intent === 'Browse_Products') {
          const recommendations = await collection.distinct('category');
          console.log(recommendations.join(', '));
          const categoryNames = recommendations.join(', ');
          res.json({ fulfillmentText: intentresponse.replace("[products]", categoryNames) });
        }
        else {
          res.json({ fulfillmentText: 'Unhandled intent' });
        }
      } catch (error) {
        logger.error('webhook-Generic -', { error });
      }
    });

    // This is an API for detecting Intent from the user input
    app.post('/detectIntent', async (req, res) => {
      logger.info('Received detectIntent request', { req });
      // Construct the session path
      const sessionPath = sessionClient.projectLocationAgentSessionPath(
        projectId,
        locationId,
        agentId,
        sessionId,
      );

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: req.body.queryResult.queryText,
          },
          languageCode: languageCd,
        },
      };
      logger.info('detectIntent - request initialized', { request });
      try {
        // Extract Quick Replies
        let quickReplies = [];
        const responses = await sessionClient.detectIntent(request);

        const responseMessages = responses[0].queryResult.responseMessages;
        console.log('response body - ', responseMessages);
        let responseText = 'Sorry, I didn’t understand that.';
        console.log('detectIntent - reading response before extracting text', JSON.stringify(responses));
        if (responseMessages && responseMessages.length > 0) {
          responseText = responseMessages[0].text.text[0];
        }

        responseMessages.forEach((message) => {
          if (message.responseType === "ENTRY_PROMPT" && message.payload) {
            const richContent = message.payload.fields.richContent.listValue.values;
            richContent.forEach((contentItem) => {
              contentItem.listValue.values.forEach((richContentItem) => {
                const itemFields = richContentItem.structValue.fields;
                if (itemFields.type.stringValue === "chips") {
                  const options = itemFields.options.listValue.values;
                  options.forEach((option) => {
                    quickReplies.push(option.structValue.fields.text.stringValue);
                  });
                }
              });
            });
          }
        });

        console.log('detectIntent - reading response from detectIntent API', JSON.stringify(responses));
        res.json({
          fulfillmentText: responseText,
          quickReplies: quickReplies,
          sessionId: sessionId,
        });
      } catch (error) {
        logger.error('detectIntent error- ', { error });
        res.status(500).send('Error processing request');
      }
    });

    // This is API for fetching Product Names
    app.post('/productSearch', async (req, res) => {
      logger.info('Received productSearch API request');
      try {
        const productQuery = req.body.sessionInfo.parameters.productQuery;
        const products = await fetchProductsFromDatabase(productQuery);

        if (products.length > 0) {
          const product = products[0];  // Take the first match or handle as needed
          res.json({
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
        } else {
          res.json({
            fulfillment_response: {
              messages: [
                {
                  text: {
                    text: ["Sorry, I couldn't find that product."]
                  }
                }
              ]
            }
          });
        }
      } catch (error) {
        logger.error('productSearch API error - ', { error });
        res.status(500).send(stat, 'Unable to process your request');
      }
    });

    // This is API for fetching Product Names
    app.post('/productCategorySearch', async (req, res) => {
      logger.info('Received productCategorySearch API request ', { req });
      try {
        const recommendations = await collection.distinct('category');
        const quickReplyOptions = recommendations.map(category => {
          return { text: category };
        });
        const response = {
          fulfillment_response: {
            messages: [
              {
                payload: {
                  richContent: [
                    [
                      {
                        type: "chips",
                        options: quickReplyOptions
                      }
                    ]
                  ]
                }
              }
            ]
          }
        };
        // Send the response to Dialogflow CX
        res.json(response);
      } catch (error) {
        logger.error('productCategorySearch API error - ', { error });
        res.status(500).send(stat, 'Unable to process your request');
      }
    });

    // This is API for fetching Product Names using category
    app.post('/productSearchByCategory', async (req, res) => {
      logger.info('Received productSearchByCategory API request ', { req });
      try {
        const productsForACategory = await collection.distinct('product_name',{ category: req.body.text });
        logger.info('Products fetched from db on category -',{productsForACategory});

        const quickReplyOptions = productsForACategory.map(product_name => {
          return { text: product_name };
        });
        const response = {
          fulfillment_response: {
            messages: [
              {
                responseType: "ENTRY_PROMPT",
                payload: {
                  richContent: [
                    [
                      {
                        type: "chips",
                        options: quickReplyOptions
                      }
                    ]
                  ]
                }
              }
            ]
          }
        };
        // Send the response to Dialogflow CX
        res.json(response);
      } catch (error) {
        logger.error('productSearchByCategory API error - ', { error });
        res.status(500).send('Unable to process your request');
      }
    });

    const fetchProductsFromDatabase = async (productQuery) => {
      console.log(productQuery);

      const query = { $text: { $search: productQuery } };
      const options = {
        sort: { product_name: 1 },
        projection: { _id: 0, product_name: 1, price: 1, description: 1 },
      };
      const prodNames = await collection.find(query, options).toArray();
      console.log(prodNames);
      return prodNames;
    };

    const PORT = process.env.PORT || 50000;
    app.options('*', cors());
    app.options('/detectIntent', cors());

    app.listen(PORT, () => {
      logger.info('Chatbot - Server is running on port ', { PORT });
    });
  }
  catch (error) {
    logger.crit(error);
    await client.close();
  }
}
run().catch(console.dir);