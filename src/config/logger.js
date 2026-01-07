import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'NSM server' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Always add console transport (for both dev and production)
logger.add(
  new winston.transports.Console({
    format: isProduction
      ? winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(
            ({ level, message, timestamp }) =>
              `${timestamp} [${level.toUpperCase()}]: ${message}`
          )
        )
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
  })
);

export default logger;
