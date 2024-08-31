const { getLatestDeals, buildNoDealsResponse, buildDealsAvailableResponse } = require('../../backend/controllers/dealsController');
const { db } = require('../../backend/config/dbConfig');
const logger = require('../../backend/utils/logger');

// Mock the db and logger modules
jest.mock('../../backend/config/dbConfig', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
  },
}));

jest.mock('../../backend/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
}));

describe('Deals Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    jest.clearAllMocks(); // Clear mock history before each test
  });

  describe('getLatestDeals', () => {
    it('should log the API request and handle successful data retrieval', async () => {
      const mockDealsData = [
        { title: 'Deal 1', discount_percentage: 50 },
        { title: 'Deal 2', discount_percentage: 40 },
        { title: 'Deal 3', discount_percentage: 30 },
      ];

      // Mock the database collection methods
      db.collection().find = jest.fn().mockReturnThis();
      db.collection().sort = jest.fn().mockReturnThis();
      db.collection().limit = jest.fn().mockReturnThis();
      db.collection().toArray = jest.fn().mockResolvedValue(mockDealsData);

      await getLatestDeals(req, res);

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Received getLatestDeals API request'));
      expect(db.collection).toHaveBeenCalledWith('deals');
      expect(db.collection().find).toHaveBeenCalled();
      expect(db.collection().sort).toHaveBeenCalledWith({ discount_percentage: -1 });
      expect(db.collection().limit).toHaveBeenCalledWith(5);
      expect(db.collection().toArray).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('getLatestDeals API order data'));
      expect(res.json).toHaveBeenCalledWith(buildDealsAvailableResponse(mockDealsData));
    });

    it('should log an error and return 500 if database retrieval fails', async () => {
      db.collection().find = jest.fn().mockReturnThis();
      db.collection().sort = jest.fn().mockReturnThis();
      db.collection().limit = jest.fn().mockReturnThis();
      db.collection().toArray = jest.fn().mockRejectedValue(new Error('Database error'));

      await getLatestDeals(req, res);

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('getLatestDeals API error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Unable to process your request');
    });

    it('should return a response with no deals if dealsData is empty', async () => {
      db.collection().find = jest.fn().mockReturnThis();
      db.collection().sort = jest.fn().mockReturnThis();
      db.collection().limit = jest.fn().mockReturnThis();
      db.collection().toArray = jest.fn().mockResolvedValue([]);

      await getLatestDeals(req, res);

      const expectedResponse = {
        fulfillment_response: {
          messages: [
            {
              responseType: "ENTRY_PROMPT",
              text: {
                text: ["There are no deals available right now."],
              },
            },
          ],
        },
      };

      expect(res.json).toHaveBeenCalledWith(expectedResponse);
    });
  });

  describe('Helper Functions', () => {
    it('should return the correct response structure for no deals available', () => {
      const noDealsResponse = buildNoDealsResponse();
      expect(noDealsResponse).toEqual({
        fulfillment_response: {
          messages: [
            {
              responseType: 'ENTRY_PROMPT',
              text: {
                text: ['There are no deals available right now.'],
              },
            },
          ],
        },
      });
    });

    it('should return the correct response structure when deals are available', () => {
      const mockDealsData = [
        { title: 'Deal 1', discount_percentage: 50 },
        { title: 'Deal 2', discount_percentage: 40 },
        { title: 'Deal 3', discount_percentage: 30 },
      ];

      const dealsAvailableResponse = buildDealsAvailableResponse(mockDealsData);
      expect(dealsAvailableResponse).toEqual(expect.objectContaining({
        fulfillment_response: expect.any(Object)
      }));
    });
  });
});