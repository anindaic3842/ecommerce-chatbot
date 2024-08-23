//Contains any constants, such as intentTrainingPhraseType.
// constants.js
// Mapping for intent training phrases
const intentTrainingPhraseType = {
    projmca_intent_browse_products: 'Show me ',
    projmca_intent_product_search: 'Show me ',
    projmca_intent_single_product: 'Show me ',
    projmca_intent_goodbye: '',
    projmca_intent_welcome: '',
    projmca_intent_negative: ''
  };

  function buildDynamicQuickReplies(options) {
    return {
      payload: {
        richContent: [
          [
            {
              type: "chips",
              options: options.map(option => ({
                text: option
              }))
            }
          ]
        ]
      }
    };
  }
  
  module.exports = { intentTrainingPhraseType, buildDynamicQuickReplies };
