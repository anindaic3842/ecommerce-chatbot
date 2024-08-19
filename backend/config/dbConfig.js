const { MongoClient,ServerApiVersion } = require('mongodb');

const uri = 'mongodb+srv://anindaic3842:aichatbot123@ai-chatbot-ecomm.ux1n4ub.mongodb.net/?retryWrites=true&w=majority&appName=AI-Chatbot-ECOMM';
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  }
});

const db = client.db('ecommerce');

module.exports = { client, db };