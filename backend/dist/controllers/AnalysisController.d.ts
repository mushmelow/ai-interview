import { Request, Response } from 'express';
import { JWTPayload } from '../types';
interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}
declare class AnalysisController {
    private analysisService;
    private pool;
    constructor();
    analyzeInterview: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getAnalysisResult: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getUserAnalysisResults: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getAnalysisStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
}
export default AnalysisController;
//# sourceMappingURL=AnalysisController.d.ts.map