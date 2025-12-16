import { Request, Response } from 'express';
const { query } = require('../database/connection');
import answerScoringService from '../services/AnswerScoringService';

interface SubmitAnswerRequest {
    questionId: number;
    sessionId: string;
    answer: string;
    answerType?: 'text' | 'voice' | 'video';
    recordingPath?: string;
}

class AnswerController {
    // Submit an answer for a question
    submitAnswer = async (req: Request, res: Response): Promise<void> => {
        try {
            // Use default user ID if not authenticated (login disabled)
            const userId = (req as any).user?.userId || 1; // Default to user ID 1

            const { questionId, sessionId, answer, answerType = 'text', recordingPath }: SubmitAnswerRequest = req.body;

            if (!questionId || !sessionId || !answer) {
                res.status(400).json({
                    success: false,
                    message: 'questionId, sessionId, and answer are required'
                });
                return;
            }

            // Verify the question exists and belongs to the session, get question details
            const questionCheck = await query(
                'SELECT id, question, expected_keywords, category, difficulty FROM generated_questions WHERE id = $1 AND session_id = $2',
                [questionId, sessionId]
            );

            if (questionCheck.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Question not found for this session'
                });
                return;
            }

            const questionData = questionCheck.rows[0];

            // Score the answer using AI
            let scoreResult;
            try {
                console.log('🎯 Starting AI scoring for answer...');
                scoreResult = await answerScoringService.scoreAnswer(
                    questionData.question,
                    answer,
                    questionData.expected_keywords || [],
                    questionData.category,
                    questionData.difficulty
                );
                console.log(`✅ Answer scored successfully: ${scoreResult.score}/10`);
                console.log(`   Feedback length: ${scoreResult.feedback.length} chars`);
                console.log(`   Reasoning: ${scoreResult.reasoning?.substring(0, 100)}`);
            } catch (error) {
                console.error('❌ CRITICAL ERROR: AI scoring failed!', error);
                console.error('Error details:', error instanceof Error ? error.message : String(error));
                console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
                
                // Return a clear error indicator instead of silent 5.0
                // This will help identify when AI scoring is not working
                scoreResult = {
                    score: 5.0,
                    feedback: `⚠️ AI scoring service encountered an error. Your answer has been saved, but automatic scoring is unavailable. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check that Ollama is running and accessible.`,
                    reasoning: 'AI scoring failed - check backend logs for details',
                    strengths: ['Answer was submitted successfully'],
                    improvements: ['AI scoring unavailable - manual review recommended'],
                    suggestions: ['Ensure Ollama is running: ollama serve', 'Check backend logs for detailed error information']
                };
                
                // Log this as a warning so it's visible
                console.warn('⚠️ Using fallback score due to AI scoring failure');
            }

            // Check if answer already exists (update if it does)
            const existingAnswer = await query(
                'SELECT id FROM question_answers WHERE question_id = $1 AND user_id = $2',
                [questionId, userId]
            );

            let result;
            if (existingAnswer.rows.length > 0) {
                // Update existing answer with score and detailed feedback
                result = await query(
                    `UPDATE question_answers 
                     SET answer = $1, answer_type = $2, recording_path = $3, 
                         score = $4, score_feedback = $5, 
                         strengths = $6, improvements = $7, suggestions = $8,
                         scored_at = NOW(), updated_at = NOW()
                     WHERE question_id = $9 AND user_id = $10
                     RETURNING *`,
                    [
                        answer, 
                        answerType, 
                        recordingPath || null,
                        scoreResult.score,
                        scoreResult.feedback,
                        scoreResult.strengths || [],
                        scoreResult.improvements || [],
                        scoreResult.suggestions || [],
                        questionId, 
                        userId
                    ]
                );
            } else {
                // Insert new answer with score and detailed feedback
                result = await query(
                    `INSERT INTO question_answers 
                     (question_id, session_id, user_id, answer, answer_type, recording_path, 
                      score, score_feedback, strengths, improvements, suggestions, scored_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                     RETURNING *`,
                    [
                        questionId, 
                        sessionId, 
                        userId, 
                        answer, 
                        answerType, 
                        recordingPath || null,
                        scoreResult.score,
                        scoreResult.feedback,
                        scoreResult.strengths || [],
                        scoreResult.improvements || [],
                        scoreResult.suggestions || []
                    ]
                );
            }

            const answerData = result.rows[0];
            res.json({
                success: true,
                message: 'Answer submitted successfully',
                data: {
                    ...answerData,
                    score: scoreResult.score,
                    scoreFeedback: scoreResult.feedback,
                    scoreReasoning: scoreResult.reasoning,
                    strengths: answerData.strengths || scoreResult.strengths || [],
                    improvements: answerData.improvements || scoreResult.improvements || [],
                    suggestions: answerData.suggestions || scoreResult.suggestions || []
                }
            });
        } catch (error) {
            console.error('Error submitting answer:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit answer',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // Get all answers for a session
    getSessionAnswers = async (req: Request, res: Response): Promise<void> => {
        try {
            // Use default user ID if not authenticated (login disabled)
            const userId = (req as any).user?.userId || 1; // Default to user ID 1
            const { sessionId } = req.params;

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    message: 'Session ID is required'
                });
                return;
            }

            const result = await query(
                `SELECT qa.*, gq.question, gq.category, gq.type, gq.difficulty
                 FROM question_answers qa
                 JOIN generated_questions gq ON qa.question_id = gq.id
                 WHERE qa.session_id = $1 AND qa.user_id = $2
                 ORDER BY qa.submitted_at ASC`,
                [sessionId, userId]
            );

            res.json({
                success: true,
                message: 'Answers retrieved successfully',
                data: result.rows
            });
        } catch (error) {
            console.error('Error getting session answers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve answers',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // Get answer for a specific question
    getQuestionAnswer = async (req: Request, res: Response): Promise<void> => {
        try {
            // Use default user ID if not authenticated (login disabled)
            const userId = (req as any).user?.userId || 1; // Default to user ID 1
            const { questionId } = req.params;

            const result = await query(
                `SELECT qa.*, gq.question, gq.category, gq.type, gq.difficulty
                 FROM question_answers qa
                 JOIN generated_questions gq ON qa.question_id = gq.id
                 WHERE qa.question_id = $1 AND qa.user_id = $2`,
                [questionId, userId]
            );

            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Answer not found'
                });
                return;
            }

            res.json({
                success: true,
                message: 'Answer retrieved successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error getting question answer:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve answer',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}

export default AnswerController;



