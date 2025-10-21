import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// Custom error interface
interface CustomError extends Error {
    statusCode?: number;
}

// Simple logger interface
interface Logger {
    error: (message: string) => void;
}

const logger: Logger = {
    error: (message: string) => console.error(message)
};

const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Log error
    console.error('=== ERROR HANDLER ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Request URL:', req.url);
    console.error('Request method:', req.method);
    console.error('====================');

    // Default error response
    const statusCode: number = err.statusCode || 500;
    const message: string = err.message || 'Internal server error';

    const response: ApiResponse = {
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    };

    res.status(statusCode).json(response);
};

export default errorHandler;