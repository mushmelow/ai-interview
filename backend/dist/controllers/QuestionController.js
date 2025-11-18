"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AIQuestionService_1 = __importDefault(require("../services/AIQuestionService"));
class QuestionController {
    constructor() {
        this.generateQuestions = async (req, res) => {
            try {
                const userId = req.user?.userId;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                    return;
                }
                const { position, experienceLevel = 'mid', categories = ['Technical Skills', 'Problem Solving'], numberOfQuestions = 5, difficulty = 'intermediate', customContext } = req.body;
                if (!position) {
                    res.status(400).json({
                        success: false,
                        message: 'Position is required'
                    });
                    return;
                }
                const request = {
                    userId,
                    position,
                    experienceLevel,
                    categories,
                    numberOfQuestions: Math.min(numberOfQuestions, 10),
                    difficulty,
                    customContext
                };
                const result = await this.questionService.generateQuestions(request);
                res.json({
                    success: true,
                    message: 'Questions generated successfully',
                    data: result
                });
            }
            catch (error) {
                console.error('Error generating questions:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to generate questions',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        this.getSessionQuestions = async (req, res) => {
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
            }
            catch (error) {
                console.error('Error getting session questions:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve questions',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        this.getCategories = async (req, res) => {
            try {
                const { query } = await Promise.resolve().then(() => __importStar(require('../database/connection')));
                const result = await query('SELECT * FROM question_categories ORDER BY name ASC');
                res.json({
                    success: true,
                    message: 'Categories retrieved successfully',
                    data: result.rows
                });
            }
            catch (error) {
                console.error('Error getting categories:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve categories',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        this.getTemplates = async (req, res) => {
            try {
                const { query } = await Promise.resolve().then(() => __importStar(require('../database/connection')));
                const { category, difficulty } = req.query;
                let sql = `
                SELECT qt.*, qc.name as category_name 
                FROM question_templates qt
                JOIN question_categories qc ON qt.category_id = qc.id
                WHERE qt.is_active = true
            `;
                const params = [];
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
            }
            catch (error) {
                console.error('Error getting templates:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve templates',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        this.questionService = new AIQuestionService_1.default();
    }
}
exports.default = QuestionController;
//# sourceMappingURL=QuestionController.js.map