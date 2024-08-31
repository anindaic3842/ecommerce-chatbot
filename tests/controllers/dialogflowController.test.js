const { detectIntent } = require('../../backend/controllers/dialogflowController');
const { sessionClient, sessionId, projectId, locationId, agentId, languageCd } = require('../../backend/config/dialogflowConfig');
const logger = require('../../backend/utils/logger');

// Mock the sessionClient and logger modules
jest.mock('../../backend/config/dialogflowConfig', () => ({
  sessionClient: {
    projectLocationAgentSessionPath: jest.fn().mockReturnValue('projects/project-id/locations/location-id/agents/agent-id/sessions/session-id'),
    detectIntent: jest.fn(),
  },
  sessionId: 'mock-session-id',
  projectId: 'mock-project-id',
  locationId: 'mock-location-id',
  agentId: 'mock-agent-id',
  languageCd: 'en',
}));

jest.mock('../../backend/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
}));

describe('Dialogflow Controller - detectIntent', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks(); // Clear mock history before each test
  });

  it('should log an error and return 500 if request body or sessionId is missing', async () => {
    await detectIntent(req, res);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('The request body for detectIntent has an issue'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error processing request');
  });

  it('should handle successful Dialogflow response with text, quick replies, and carousel data', async () => {
    req.body = {
      sessionId: 'mock-session-id',
      queryResult: {
        queryText: 'Hello',
        parameters: {}
      }
    };

    const mockDialogflowResponse = [{
      queryResult: {
        responseMessages: [
          { text: { text: ['Hello, how can I help you?'] } },
          {
            responseType: "ENTRY_PROMPT",
            payload: {
              fields: {
                richContent: {
                  listValue: {
                    values: [
                      {
                        listValue: {
                          values: [
                            {
                              structValue: {
                                fields: {
                                  type: { stringValue: "carousel-card" },
                                  title: { stringValue: "Sample Deal" },
                                  description: { stringValue: "50% off" },
                                  image: { stringValue: "https://via.placeholder.com/300x200.png" },
                                  link: { stringValue: "https://example.com/deal" },
                                  buttons: {
                                    listValue: {
                                      values: [
                                        {
                                          structValue: {
                                            fields: {
                                              text: { stringValue: "Buy now" },
                                              link: { stringValue: "https://example.com/buy" },
                                            }
                                          }
                                        }
                                      ]
                                    }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        ],
        currentPage: { displayName: "browse_products_page" },
      }
    }];

    sessionClient.detectIntent.mockResolvedValue(mockDialogflowResponse);

    await detectIntent(req, res);

    expect(sessionClient.projectLocationAgentSessionPath).toHaveBeenCalledWith(
      projectId,
      locationId,
      agentId,
      'mock-session-id'
    );

    expect(sessionClient.detectIntent).toHaveBeenCalledWith({
      session: 'projects/project-id/locations/location-id/agents/agent-id/sessions/session-id',
      queryInput: {
        text: {
          text: 'Hello',
          parameters: {}
        },
        languageCode: languageCd
      }
    });

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Received detectIntent request with requestBody as'));
    expect(res.json).toHaveBeenCalledWith({
      fulfillmentText: ['Hello, how can I help you?', {
        type: "carousel-card",
        items: [
          {
            type: "carousel-card",
            title: "Sample Deal",
            description: "50% off",
            image: "https://via.placeholder.com/300x200.png",
            actionLink: "https://example.com/deal",
            buttons: [
              { text: "Buy now", link: "https://example.com/buy" }
            ]
          }
        ]
      }],
      quickReplies: [],
      carouselData: [{
        type: "carousel-card",
        title: "Sample Deal",
        description: "50% off",
        image: "https://via.placeholder.com/300x200.png",
        actionLink: "https://example.com/deal",
        buttons: [
          { text: "Buy now", link: "https://example.com/buy" }
        ]
      }],
      requestAppendMessage: "Show me ",
      sessionId: 'mock-session-id'
    });
  });

  it('should handle errors from detectIntent and return 500', async () => {
    req.body = {
      sessionId: 'mock-session-id',
      queryResult: {
        queryText: 'Hello',
        parameters: {}
      }
    };

    sessionClient.detectIntent.mockRejectedValue(new Error('Dialogflow error'));

    await detectIntent(req, res);

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('detectIntent error'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error processing request');
  });
});