import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
declare const requireRole: (roles: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export { authenticateToken, requireRole, optionalAuth };
//# sourceMappingURL=auth.d.ts.map