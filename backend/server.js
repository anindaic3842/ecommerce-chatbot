const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const { client } = require('./config/dbConfig');
const logger = require('./utils/logger');

const dialogflowRoutes = require('./routes/dialogflowRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dealsRoutes = require('./routes/dealsRoutes');
const commonRoutes = require('./routes/commonRoutes');
// Import other routes as needed

// Middleware setup
app.use(bodyParser.json());
app.use(cors({
  origin: '*', // Allow all origins. For production, specify allowed origins
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type'
}));

// Routes
app.use('/dialogflow', dialogflowRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/deals', dealsRoutes);
app.use('/common', commonRoutes);
// Add other routes as needed

app.get('/', (req, res) => {
  res.send("Server Is Working......");
});

async function run() {
  try {
    // Connect to the MongoDB client
    await client.connect();

    const PORT = process.env.PORT || 50000;
    app.options('*', cors());
    app.options('dialogflow/detectIntent', cors());

    app.listen(PORT, () => {
      logger.info(`Chatbot - Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.crit('Server startup error:', error);
    await client.close();
  }
}

run().catch(console.dir);