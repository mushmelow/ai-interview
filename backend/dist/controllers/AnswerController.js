"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { query } = require('../database/connection');
const AnswerScoringService_1 = __importDefault(require("../services/AnswerScoringService"));
class AnswerController {
    constructor() {
        this.submitAnswer = async (req, res) => {
            try {
                const userId = req.user?.userId || 1;
                const { questionId, sessionId, answer, answerType = 'text', recordingPath } = req.body;
                if (!questionId || !sessionId || !answer) {
                    res.status(400).json({
                        success: false,
                        message: 'questionId, sessionId, and answer are required'
                    });
                    return;
                }
                const questionCheck = await query('SELECT id, question, expected_keywords, category, difficulty FROM generated_questions WHERE id = $1 AND session_id = $2', [questionId, sessionId]);
                if (questionCheck.rows.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: 'Question not found for this session'
                    });
                    return;
                }
                const questionData = questionCheck.rows[0];
                let scoreResult;
                try {
                    scoreResult = await AnswerScoringService_1.default.scoreAnswer(questionData.question, answer, questionData.expected_keywords || [], questionData.category, questionData.difficulty);
                    console.log(`Answer scored: ${scoreResult.score}/10`);
                }
                catch (error) {
                    console.error('Error scoring answer:', error);
                    scoreResult = {
                        score: null,
                        feedback: 'Scoring unavailable',
                        reasoning: 'AI scoring service error'
                    };
                }
                const existingAnswer = await query('SELECT id FROM question_answers WHERE question_id = $1 AND user_id = $2', [questionId, userId]);
                let result;
                if (existingAnswer.rows.length > 0) {
                    result = await query(`UPDATE question_answers 
                     SET answer = $1, answer_type = $2, recording_path = $3, 
                         score = $4, score_feedback = $5, scored_at = NOW(), updated_at = NOW()
                     WHERE question_id = $6 AND user_id = $7
                     RETURNING *`, [
                        answer,
                        answerType,
                        recordingPath || null,
                        scoreResult.score,
                        scoreResult.feedback,
                        questionId,
                        userId
                    ]);
                }
                else {
                    result = await query(`INSERT INTO question_answers 
                     (question_id, session_id, user_id, answer, answer_type, recording_path, score, score_feedback, scored_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                     RETURNING *`, [
                        questionId,
                        sessionId,
                        userId,
                        answer,
                        answerType,
                        recordingPath || null,
                        scoreResult.score,
                        scoreResult.feedback
                    ]);
                }
                res.json({
                    success: true,
                    message: 'Answer submitted successfully',
                    data: {
                        ...result.rows[0],
                        score: scoreResult.score,
                        scoreFeedback: scoreResult.feedback,
                        scoreReasoning: scoreResult.reasoning
                    }
                });
            }
            catch (error) {
                console.error('Error submitting answer:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to submit answer',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        this.getSessionAnswers = async (req, res) => {
            try {
                const userId = req.user?.userId || 1;
                const { sessionId } = req.params;
                if (!sessionId) {
                    res.status(400).json({
                        success: false,
                        message: 'Session ID is required'
                    });
                    return;
                }
                const result = await query(`SELECT qa.*, gq.question, gq.category, gq.type, gq.difficulty
                 FROM question_answers qa
                 JOIN generated_questions gq ON qa.question_id = gq.id
                 WHERE qa.session_id = $1 AND qa.user_id = $2
                 ORDER BY qa.submitted_at ASC`, [sessionId, userId]);
                res.json({
                    success: true,
                    message: 'Answers retrieved successfully',
                    data: result.rows
                });
            }
            catch (error) {
                console.error('Error getting session answers:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve answers',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        this.getQuestionAnswer = async (req, res) => {
            try {
                const userId = req.user?.userId || 1;
                const { questionId } = req.params;
                const result = await query(`SELECT qa.*, gq.question, gq.category, gq.type, gq.difficulty
                 FROM question_answers qa
                 JOIN generated_questions gq ON qa.question_id = gq.id
                 WHERE qa.question_id = $1 AND qa.user_id = $2`, [questionId, userId]);
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
            }
            catch (error) {
                console.error('Error getting question answer:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve answer',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
    }
}
exports.default = AnswerController;
//# sourceMappingURL=AnswerController.js.map