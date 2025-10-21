"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = {
    error: (message) => console.error(message)
};
const errorHandler = (err, req, res, next) => {
    console.error('=== ERROR HANDLER ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Request URL:', req.url);
    console.error('Request method:', req.method);
    console.error('====================');
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    const response = {
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    };
    res.status(statusCode).json(response);
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map