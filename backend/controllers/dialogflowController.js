//Handles all Dialogflow-related requests.
// dialogflowController.js
const { sessionClient, sessionId, projectId, locationId, agentId, languageCd } = require('../config/dialogflowConfig');
const logger = require('../utils/logger');
const intentTrainingPhraseType = {
  projmca_intent_browse_products: 'Show me ',
  projmca_intent_product_search: 'Show me ',
  projmca_intent_single_product: 'Show me ',
  projmca_intent_goodbye: '',
  projmca_intent_welcome: '',
  projmca_intent_negative: '',
  projmca_intent_default:'',
};

const detectIntent = async (req, res) => {
  logger.info(`Received detectIntent request with requestBody as - ${req.body}`);
  
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
        parameters: req.body.queryResult.parameters
      },
      languageCode: languageCd,
    },
  };

  try {
    let quickReplies = [];
    const responses = await sessionClient.detectIntent(request);
    logger.info(`response body - ${JSON.stringify(responses[0])}`);
    
    const reqAppMessage = (responses[0].queryResult.intent !== null) ? responses[0].queryResult.intent.displayName : 'projmca_intent_default';
    //const reqAppMessage = responses[0].queryResult.intent.displayName;
    const responseMessages = responses[0].queryResult.responseMessages;

    const responseText = [];
    logger.info(`detectIntent - reading response before extracting text - ${JSON.stringify(responses)}`);

    if (responseMessages && responseMessages.length > 0) {
      responseMessages.forEach(message => {
        if (message.text && message.text.text) {
          responseText.push(message.text.text);
        }
      });

      if (responseText.length == 0) {
        responseText.push('Sorry, I didn’t understand that.');
      }
    }

    logger.info(`creating response message - ${responseText}`);

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
    
    logger.info(`creating quick replies ${quickReplies}`);
    logger.info(`creating append text ${reqAppMessage}`);
    res.json({
      fulfillmentText: responseText,
      quickReplies: quickReplies,
      requestAppendMessage: intentTrainingPhraseType[reqAppMessage],
      sessionId: sessionId
    });
  } catch (error) {
    logger.error(`detectIntent error- ${ JSON.stringify(error.message) }`);
    res.status(500).send('Error processing request');
    //throw error;
  }
};

module.exports = { detectIntent };