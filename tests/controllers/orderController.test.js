const { orderstatus } = require('../../backend/controllers/orderController');
const { db } = require('../../backend/config/dbConfig');
const logger = require('../../backend/utils/logger');
const constants = require('../../backend/utils/constants');

// Mock the db and logger modules
jest.mock('../../backend/config/dbConfig', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
  },
}));

jest.mock('../../backend/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../../backend/utils/constants', () => ({
  buildDynamicQuickReplies: jest.fn().mockReturnValue({
    payload: [
      {
        responseType: "ENTRY_PROMPT",
        text: {
          text: ["Sample quick reply"],
        },
      },
    ],
  }),
}));

describe('Order Controller - orderstatus', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        sessionInfo: {
          parameters: {
            param_order_number: 'ORDER12345'
          }
        }
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    jest.clearAllMocks(); // Clear mock history before each test
  });

  it('should return order status if the order is found', async () => {
    const mockOrder = {
      order_id: 'ORDER12345',
      order_date: new Date(),
      payment_method: 'Credit Card',
      shipping_carrier: 'UPS',
      tracking_number: '1Z9999999999999999',
      status: 'Shipped',
      estimated_delivery: '2024-09-05'
    };

    // Mock the database collection methods
    db.collection().findOne = jest.fn().mockResolvedValue(mockOrder);

    await orderstatus(req, res);

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Received orderstatus API request'));
    expect(db.collection).toHaveBeenCalledWith('orders');
    expect(db.collection().findOne).toHaveBeenCalledWith({ order_id: 'ORDER12345' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      fulfillment_response: expect.any(Object)
    }));
  });

  it('should return a response indicating no order was found if the order is not found', async () => {
    // Mock the database collection methods to return no order
    db.collection().findOne = jest.fn().mockResolvedValue(null);

    await orderstatus(req, res);

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Received orderstatus API request'));
    expect(db.collection).toHaveBeenCalledWith('orders');
    expect(db.collection().findOne).toHaveBeenCalledWith({ order_id: 'ORDER12345' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      fulfillment_response: expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            responseType: 'ENTRY_PROMPT',
            text: expect.objectContaining({
              text: expect.arrayContaining([
                expect.stringContaining('Order Not Found')
              ])
            })
          }),
          expect.objectContaining({
            responseType: 'ENTRY_PROMPT',
            payload: constants.buildDynamicQuickReplies().payload
          })
        ])
      })
    }));
  });

  it('should handle errors from findOne and return 500', async () => {
    db.collection().findOne = jest.fn().mockRejectedValue(new Error('Database error'));

    await orderstatus(req, res);

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('trackOrder API error'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Unable to process your request');
  });
});