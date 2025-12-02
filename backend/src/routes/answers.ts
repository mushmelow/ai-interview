import express from 'express';
import AnswerController from '../controllers/AnswerController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const answerController = new AnswerController();

// All routes require authentication
router.use(authenticateToken);

// Submit an answer for a question
router.post('/submit', answerController.submitAnswer);

// Get all answers for a session
router.get('/session/:sessionId', answerController.getSessionAnswers);

// Get answer for a specific question
router.get('/question/:questionId', answerController.getQuestionAnswer);

export default router;



