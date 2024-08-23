//Handles all Dialogflow-related requests.
// dialogflowController.js
const { sessionClient, sessionId, projectId, locationId, agentId, languageCd } = require('../config/dialogflowConfig');
const logger = require('../utils/logger');
const currentPageInFlow = {
  browse_products_page : 'Show me ',
  select_category_page: 'Show me ',
  default_page:'',
};

const detectIntent = async (req, res) => {
  logger.info(`Received detectIntent request with requestBody as - ${JSON.stringify(req.body)}`);
  
  if(req.body == null || req.body.sessionId == null) {
    logger.error(`The request body for detectIntent has an issue - ${JSON.stringify(req.body)}`);
    res.status(500).send('Error processing request');
  }

  const userSessionId = req.body.sessionId;

  const sessionPath = sessionClient.projectLocationAgentSessionPath(
    projectId,
    locationId,
    agentId,
    userSessionId,
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
    
    const reqAppMessage = (responses[0].queryResult.currentPage !== null) ? responses[0].queryResult.currentPage.displayName : 'default_page';
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
    
    logger.info(`creating quick replies ${JSON.stringify(quickReplies)}`);
    logger.info(`creating append text ${JSON.stringify(reqAppMessage)}`);
    res.json({
      fulfillmentText: responseText,
      quickReplies: quickReplies,
      requestAppendMessage: currentPageInFlow[reqAppMessage] || '',
      sessionId: sessionId
    });
  } catch (error) {
    logger.error(`detectIntent error - ${ JSON.stringify(error.message) }`);
    res.status(500).send('Error processing request');
    //throw error;
  }
};

module.exports = { detectIntent };