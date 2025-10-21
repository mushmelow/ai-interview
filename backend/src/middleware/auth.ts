import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWTPayload, AuthenticatedRequest } from '../types';

// Simple logger interface
interface Logger {
    warn: (message: string) => void;
    error: (message: string) => void;
}

const logger: Logger = {
    warn: (message: string) => console.warn(message),
    error: (message: string) => console.error(message)
};

const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Access token required'
        });
        return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
        if (err) {
            logger.warn(`JWT verification failed: ${err.message}`);
            res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
            return;
        }

        req.user = decoded as JWTPayload;
        next();
    });
};

const requireRole = (roles: string | string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            logger.warn(`Access denied for user ${req.user.email} with role ${userRole}`);
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }

        next();
    };
};

const optionalAuth = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = undefined;
        next();
        return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
        if (err) {
            req.user = undefined;
        } else {
            req.user = decoded as JWTPayload;
        }
        next();
    });
};

export {
    authenticateToken,
    requireRole,
    optionalAuth
};
