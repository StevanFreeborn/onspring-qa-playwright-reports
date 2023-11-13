import express from 'express';
import winston from 'winston';

/**
 * @summary Defines the logging levels.
 * @type {object}
 * @property {number} error - The error level.
 * @property {number} warn - The warn level.
 * @property {number} info - The info level.
 * @property {number} http - The http level.
 * @property {number} debug - The debug level.
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * @summary Returns the logging level.
 * @returns {string} The logging level.
 */
function level() {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
}

/**
 * @summary Defines the logging colors.
 * @type {object}
 * @property {string} error - The error color.
 * @property {string} warn - The warn color.
 * @property {string} info - The info color.
 * @property {string} http - The http color.
 * @property {string} debug - The debug color.
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

/**
 * @summary Defines the logging format for the console.
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  ),
  winston.format.align(),
  winston.format.errors({ stack: true })
);

/**
 * @summary Defines the logging format for the file.
 */
const fileFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * @summary Defines the transports.
 * @type {Array} The transports.
 */
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    })
  );
  transports.push(
    new winston.transports.File({
      filename: 'logs/all.log',
      format: fileFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

/**
 * @summary Handles errors for non-AJAX requests.
 * @param {Error} error - The error that was thrown.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} next - The next middleware function.
 * @returns {void}
 */
export function logErrors(error, req, res, next) {
  logger.error('error', error);
  next(error);
}
