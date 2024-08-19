//Contains your Winston logger configuration.
// logger.js
const winston  = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new LoggingWinston(),
  ],
});


module.exports = logger;