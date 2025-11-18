import { Router } from 'express';
import AnalysisController from '../controllers/AnalysisController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const analysisController = new AnalysisController();

// Analyze an interview recording
router.post('/:interviewId/analyze', authenticateToken, analysisController.analyzeInterview);

// Get analysis results for a specific interview
router.get('/:interviewId/analysis', authenticateToken, analysisController.getAnalysisResult);

// Get all analysis results for the authenticated user
router.get('/user/analyses', authenticateToken, analysisController.getUserAnalysisResults);

// Get analysis statistics for the authenticated user
router.get('/user/stats', authenticateToken, analysisController.getAnalysisStats);

export default router;
