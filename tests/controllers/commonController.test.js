const { handleFormSubmission, checkEmailfromCustomer } = require('../../backend/controllers/commonController');
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

describe('Common Controller', () => {
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

  describe('handleFormSubmission', () => {
    it('should return 500 if request body or sessionId is missing', async () => {
      await handleFormSubmission(req, res);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('The request body for handleFormSubmission has an issue'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error processing request');
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = {
        sessionId: '12345',
        contactus: { name: 'John Doe' } // missing email and message
      };

      await handleFormSubmission(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide all required fields.'
      });
    });

    it('should insert form data into the database and return success message', async () => {
      req.body = {
        sessionId: '12345',
        contactus: { name: 'John Doe', email: 'john@example.com', message: 'Hello!' }
      };

      // Mock insertOne to simulate successful insertion
      db.collection().insertOne = jest.fn().mockResolvedValue({ insertedId: 'abc123' });

      await handleFormSubmission(req, res);

      expect(db.collection).toHaveBeenCalledWith('contactus');
      expect(db.collection().insertOne).toHaveBeenCalledWith({
        full_name: 'John Doe',
        email: 'john@example.com',
        Message: 'Hello!',
        message_date: expect.any(Date)
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Your message has been received. Thank you!'
      });
    });

    it('should handle database insertion errors gracefully', async () => {
      req.body = {
        sessionId: '12345',
        contactus: { name: 'John Doe', email: 'john@example.com', message: 'Hello!' }
      };

      // Correctly mock db.collection().insertOne to simulate an error
      db.collection().insertOne = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await handleFormSubmission(req, res);

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('handleFormSubmission error -'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error processing request');
    });
  });

  describe('checkEmailfromCustomer', () => {
    it('should return 500 if request body or email is missing', async () => {
      await checkEmailfromCustomer(req, res);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('The request body for checkEmailfromCustomer has an issue'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error processing request');
    });

    it('should return fulfillment response if email exists in the database', async () => {
      req.body = {
        sessionInfo: {
          parameters: { email: 'john@example.com' }
        }
      };

      // Mock findOne to simulate finding a user
      db.collection().findOne = jest.fn().mockResolvedValue({ first_name: 'John', last_name: 'Doe' });

      await checkEmailfromCustomer(req, res);

      expect(db.collection).toHaveBeenCalledWith('customers');
      expect(db.collection().findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(res.json).toHaveBeenCalledWith({
        fulfillment_response: {
          messages: [
            {
              text: {
                text: [
                  `<span>Welcome back <b>John Doe</b>. Let us continue with your purchase.</span>`
                ]
              }
            }
          ]
        },
        sessionInfo: {
          parameters: {
            goahead: 'OK'
          }
        }
      });
    });

    it('should return a message to register if email does not exist in the database', async () => {
      req.body = {
        sessionInfo: {
          parameters: { email: 'nonexistent@example.com' }
        }
      };

      // Mock findOne to simulate not finding a user
      db.collection().findOne = jest.fn().mockResolvedValue(null);

      await checkEmailfromCustomer(req, res);

      expect(res.json).toHaveBeenCalledWith({
        fulfillment_response: {
          messages: [
            {
              text: {
                text: [
                  'Uh Oh! Looks like you are not registered with us. Please sign up first to place an order.'
                ]
              }
            }
          ]
        },
        pageInfo: {
          currentPage: null,
          endInteraction: true
        },
        sessionInfo: {
          parameters: {
            goahead: null,
            email: null,
            quantity: null
          }
        }
      });
    });

    it('should handle errors gracefully during email check', async () => {
      req.body = {
        sessionInfo: {
          parameters: { email: 'john@example.com' }
        }
      };

      // Mock findOne to simulate an error
      db.collection().findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await checkEmailfromCustomer(req, res);

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('checkEmailfromCustomer error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error processing request');
    });
  });
});