import { Request, Response } from 'express';
import AIQuestionService from '../services/AIQuestionService';
import { QuestionGenerationRequest } from '../types/questions';

class QuestionController {
    private questionService: AIQuestionService;

    constructor() {
        this.questionService = new AIQuestionService();
    }

    // Generate AI questions
    generateQuestions = async (req: Request, res: Response): Promise<void> => {
        try {
            // Use default user ID if not authenticated (login disabled)
            const userId = (req as any).user?.userId || 1; // Default to user ID 1

            const {
                position,
                experienceLevel = 'mid',
                categories = ['Technical Skills', 'Problem Solving'],
                numberOfQuestions = 5,
                difficulty = 'intermediate',
                customContext
            } = req.body;

            if (!position) {
                res.status(400).json({
                    success: false,
                    message: 'Position is required'
                });
                return;
            }

            const request: QuestionGenerationRequest = {
                userId,
                position,
                experienceLevel,
                categories,
                numberOfQuestions: Math.min(numberOfQuestions, 10), // Limit to 10 questions
                difficulty,
                customContext
            };

            const result = await this.questionService.generateQuestions(request);

            res.json({
                success: true,
                message: 'Questions generated successfully',
                data: result
            });
        } catch (error) {
            console.error('Error generating questions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate questions',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // Get questions for a session
    getSessionQuestions = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    message: 'Session ID is required'
                });
                return;
            }

            const questions = await this.questionService.getSessionQuestions(sessionId);

            res.json({
                success: true,
                message: 'Questions retrieved successfully',
                data: {
                    sessionId,
                    questions
                }
            });
        } catch (error) {
            console.error('Error getting session questions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve questions',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // Get available question categories
    getCategories = async (req: Request, res: Response): Promise<void> => {
        try {
            const { query } = require('../database/connection');

            const result = await query(
                'SELECT * FROM question_categories ORDER BY name ASC'
            );

            res.json({
                success: true,
                message: 'Categories retrieved successfully',
                data: result.rows
            });
        } catch (error) {
            console.error('Error getting categories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve categories',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // Get question templates
    getTemplates = async (req: Request, res: Response): Promise<void> => {
        try {
            const { query } = require('../database/connection');
            const { category, difficulty } = req.query;

            let sql = `
                SELECT qt.*, qc.name as category_name 
                FROM question_templates qt
                JOIN question_categories qc ON qt.category_id = qc.id
                WHERE qt.is_active = true
            `;
            const params: any[] = [];
            let paramCount = 0;

            if (category) {
                paramCount++;
                sql += ` AND qc.name = $${paramCount}`;
                params.push(category);
            }

            if (difficulty) {
                paramCount++;
                sql += ` AND qt.difficulty = $${paramCount}`;
                params.push(difficulty);
            }

            sql += ' ORDER BY qt.created_at DESC';

            const result = await query(sql, params);

            res.json({
                success: true,
                message: 'Templates retrieved successfully',
                data: result.rows
            });
        } catch (error) {
            console.error('Error getting templates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve templates',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}

export default QuestionController;
