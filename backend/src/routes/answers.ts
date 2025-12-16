import express from 'express';
import AnswerController from '../controllers/AnswerController';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();
const answerController = new AnswerController();

// Authentication is optional (login disabled)
router.use(optionalAuth);

// Submit an answer for a question
router.post('/submit', answerController.submitAnswer);

// Get all answers for a session
router.get('/session/:sessionId', answerController.getSessionAnswers);

// Get answer for a specific question
router.get('/question/:questionId', answerController.getQuestionAnswer);

export default router;



