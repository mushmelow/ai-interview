const winston = require('winston');
const config = require('../config');

const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'ai-interview-backend' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({
            filename: config.logging.file.error,
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new winston.transports.File({
            filename: config.logging.file.combined,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (config.server.env !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = { logger };






