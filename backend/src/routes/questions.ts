import express from 'express';
import QuestionController from '../controllers/QuestionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const questionController = new QuestionController();

// All routes require authentication
router.use(authenticateToken);

// Generate AI questions
router.post('/generate', questionController.generateQuestions);

// Get questions for a session
router.get('/session/:sessionId', questionController.getSessionQuestions);

// Get available categories
router.get('/categories', questionController.getCategories);

// Get question templates
router.get('/templates', questionController.getTemplates);

export default router;
