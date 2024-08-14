const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const cors = require('cors');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');


app.use(bodyParser.json());

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins. For production, specify allowed origins
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type'
}));

// A unique identifier for the given session
const sessionId = uuid.v4();
const projectId = 'ai-customer-chatbot';
  // Create a new session
const sessionClient = new dialogflow.SessionsClient();
const uri = 'mongodb+srv://anindaic3842:aichatbot123@ai-chatbot-ecomm.ux1n4ub.mongodb.net/?retryWrites=true&w=majority&appName=AI-Chatbot-ECOMM'; // Replace with your MongoDB URI
let db;
console.log(`Server is running on port 1`);
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

    app.post('/', async (req, res) => {
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
    else if(intent === 'Browse_Products'){
      const recommendations = await collection.distinct('category');
      console.log(recommendations.join(', '));
      const categoryNames = recommendations.join(', ');
      res.json({ fulfillmentText: intentresponse.replace("[products]",categoryNames) });
    }
    else {
      res.json({ fulfillmentText: 'Unhandled intent' });
    }
  });

  app.post('/detectIntent', async (req, res) => {
    console.log('Inside detectIntent method');
    console.log('request body - ', req.body);
    const sessionPath = sessionClient.projectAgentSessionPath(projectId,sessionId);
    console.log('detectIntent - session path initialized');
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: req.body.queryResult.queryText,
                languageCode: 'en-US',
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        console.log('detectIntent - calling dialogflow detectIntent API');
        const result = responses[0].queryResult;
        console.log('detectIntent - reading response from detectIntent API', responses);
        res.json({ fulfillmentText: result.fulfillmentText });
    } catch (error) {
        console.error('ERROR:', error);
        res.status(500).send('Error processing request');
    }
});

// This is API for fetching Product Names
app.post('/productSearch', async (req, res) => {
  console.log('Entered product search API');
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
});

const fetchProductsFromDatabase = async (productQuery) => {
  console.log(productQuery);

  const query = { $text: { $search : productQuery}};
  const options = {
    sort: { product_name: 1 },
    projection: { _id: 0, product_name: 1, price: 1, description: 1 },
  };
  const prodNames = await collection.find(query,options).toArray();
  console.log(prodNames);
  return prodNames;
};

  const PORT = process.env.PORT || 50000;

  app.options('*', cors());
  app.options('/detectIntent', cors());

  app.listen(PORT, () => {
    console.log('Chatbot - Server is running on port ${PORT}');
  });

  } 
  catch (error){
    console.log(error);
    await client.close();
  }
}
run().catch(console.dir);