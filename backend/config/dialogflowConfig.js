//Contains the Dialogflow client setup and configuration.
// dialogflowConfig.js
const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const uuidv4 = require('uuid').v4;

const sessionId = uuidv4();
const projectId = 'ai-customer-chatbot';
const locationId = 'us-east1';
const agentId = 'a613be68-49b4-448c-98aa-ece71c0bb3ab';
const languageCd = 'en';

const sessionClient = new SessionsClient({
  apiEndpoint: 'us-east1-dialogflow.googleapis.com'
});

module.exports = { sessionClient, sessionId, projectId, locationId, agentId, languageCd };