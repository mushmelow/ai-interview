import { Request, Response } from 'express';
const { query } = require('../database/connection');

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
            const userId = (req as any).user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

            const { questionId, sessionId, answer, answerType = 'text', recordingPath }: SubmitAnswerRequest = req.body;

            if (!questionId || !sessionId || !answer) {
                res.status(400).json({
                    success: false,
                    message: 'questionId, sessionId, and answer are required'
                });
                return;
            }

            // Verify the question exists and belongs to the session
            const questionCheck = await query(
                'SELECT id FROM generated_questions WHERE id = $1 AND session_id = $2',
                [questionId, sessionId]
            );

            if (questionCheck.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Question not found for this session'
                });
                return;
            }

            // Check if answer already exists (update if it does)
            const existingAnswer = await query(
                'SELECT id FROM question_answers WHERE question_id = $1 AND user_id = $2',
                [questionId, userId]
            );

            let result;
            if (existingAnswer.rows.length > 0) {
                // Update existing answer
                result = await query(
                    `UPDATE question_answers 
                     SET answer = $1, answer_type = $2, recording_path = $3, updated_at = NOW()
                     WHERE question_id = $4 AND user_id = $5
                     RETURNING *`,
                    [answer, answerType, recordingPath || null, questionId, userId]
                );
            } else {
                // Insert new answer
                result = await query(
                    `INSERT INTO question_answers 
                     (question_id, session_id, user_id, answer, answer_type, recording_path)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING *`,
                    [questionId, sessionId, userId, answer, answerType, recordingPath || null]
                );
            }

            res.json({
                success: true,
                message: 'Answer submitted successfully',
                data: result.rows[0]
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
            const userId = (req as any).user?.userId;
            const { sessionId } = req.params;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

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
            const userId = (req as any).user?.userId;
            const { questionId } = req.params;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

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



