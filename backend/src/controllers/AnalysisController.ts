import { Request, Response } from 'express';
import InterviewAnalysisService from '../services/InterviewAnalysisService';
import { Pool } from 'pg';
import { JWTPayload } from '../types';

interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

class AnalysisController {
    private analysisService: InterviewAnalysisService;
    private pool: Pool;

    constructor() {
        this.analysisService = new InterviewAnalysisService();
        this.pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432', 10),
        });
    }

    // Analyze an interview recording
    public analyzeInterview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { interviewId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
                return;
            }

            // Verify interview belongs to user
            const interviewQuery = 'SELECT * FROM interviews WHERE id = $1 AND user_id = $2';
            const interviewResult = await this.pool.query(interviewQuery, [interviewId, userId]);

            if (interviewResult.rows.length === 0) {
                res.status(404).json({ success: false, message: 'Interview not found or access denied' });
                return;
            }

            const interview = interviewResult.rows[0];

            // Check if interview has a video file in config
            const config = interview.config || {};
            const videoFile = config.video_file;

            if (!videoFile) {
                res.status(400).json({ success: false, message: 'No recording found for this interview' });
                return;
            }

            // Get questions for this interview session
            const questionsQuery = `
                SELECT gq.question, gq.expected_keywords, gq.category, gq.difficulty, gq.type
                FROM generated_questions gq
                JOIN question_sessions qs ON gq.session_id = qs.session_id
                WHERE qs.user_id = $1::integer
                ORDER BY gq.created_at
            `;
            const questionsResult = await this.pool.query(questionsQuery, [userId]);

            const questions = questionsResult.rows.map(row => ({
                question: row.question,
                expectedKeywords: row.expected_keywords || [],
                category: row.category,
                difficulty: row.difficulty,
                type: row.type
            }));

            // Update interview status to processing
            await this.pool.query(
                'UPDATE interviews SET analysis_status = $1 WHERE id = $2',
                ['processing', interviewId]
            );

            // Get recording path
            const recordingPath = `uploads/${videoFile}`;

            // Perform analysis
            const analysisResult = await this.analysisService.analyzeInterview(
                parseInt(interviewId),
                recordingPath,
                questions
            );

            // Update interview with analysis results
            await this.pool.query(
                'UPDATE interviews SET analysis_status = $1, analysis_id = $2 WHERE id = $3',
                ['completed', analysisResult.id, interviewId]
            );

            res.status(200).json({
                success: true,
                message: 'Interview analysis completed successfully',
                data: analysisResult
            });

        } catch (error: any) {
            console.error('Error analyzing interview:', error);

            // Update interview status to failed
            if (req.params.interviewId) {
                await this.pool.query(
                    'UPDATE interviews SET analysis_status = $1 WHERE id = $2',
                    ['failed', req.params.interviewId]
                );
            }

            res.status(500).json({
                success: false,
                message: 'Failed to analyze interview',
                error: error.message
            });
        }
    };

    // Get analysis results for an interview
    public getAnalysisResult = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { interviewId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
                return;
            }

            // Verify interview belongs to user
            const interviewQuery = 'SELECT * FROM interviews WHERE id = $1 AND user_id = $2';
            const interviewResult = await this.pool.query(interviewQuery, [interviewId, userId]);

            if (interviewResult.rows.length === 0) {
                res.status(404).json({ success: false, message: 'Interview not found or access denied' });
                return;
            }

            const analysisResult = await this.analysisService.getAnalysisResult(parseInt(interviewId));

            if (!analysisResult) {
                res.status(404).json({ success: false, message: 'No analysis found for this interview' });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Analysis result retrieved successfully',
                data: analysisResult
            });

        } catch (error: any) {
            console.error('Error getting analysis result:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve analysis result',
                error: error.message
            });
        }
    };

    // Get all analysis results for a user
    public getUserAnalysisResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
                return;
            }

            const query = `
                SELECT ia.*, i.title, i.description, i.start_time, i.end_time
                FROM interview_analyses ia
                JOIN interviews i ON ia.interview_id = i.id
                WHERE i.user_id = $1
                ORDER BY ia.analyzed_at DESC
            `;

            const result = await this.pool.query(query, [userId]);

            res.status(200).json({
                success: true,
                message: 'Analysis results retrieved successfully',
                data: result.rows
            });

        } catch (error: any) {
            console.error('Error getting user analysis results:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve analysis results',
                error: error.message
            });
        }
    };

    // Get analysis statistics for a user
    public getAnalysisStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized: User ID not found in token' });
                return;
            }

            const statsQuery = `
                SELECT 
                    COUNT(*) as total_interviews,
                    COUNT(ia.id) as analyzed_interviews,
                    AVG(ia.overall_score) as average_score,
                    AVG(ia.relevance_score) as average_relevance,
                    AVG(ia.completeness_score) as average_completeness,
                    AVG(ia.clarity_score) as average_clarity,
                    AVG(ia.technical_score) as average_technical,
                    AVG(ia.word_count) as average_word_count,
                    AVG(ia.speaking_rate) as average_speaking_rate
                FROM interviews i
                LEFT JOIN interview_analyses ia ON i.id = ia.interview_id
                WHERE i.user_id = $1 AND i.status = 'completed'
            `;

            const result = await this.pool.query(statsQuery, [userId]);
            const stats = result.rows[0];

            res.status(200).json({
                success: true,
                message: 'Analysis statistics retrieved successfully',
                data: {
                    totalInterviews: parseInt(stats.total_interviews) || 0,
                    analyzedInterviews: parseInt(stats.analyzed_interviews) || 0,
                    averageScore: Math.round(parseFloat(stats.average_score) || 0),
                    averageRelevance: Math.round(parseFloat(stats.average_relevance) || 0),
                    averageCompleteness: Math.round(parseFloat(stats.average_completeness) || 0),
                    averageClarity: Math.round(parseFloat(stats.average_clarity) || 0),
                    averageTechnical: Math.round(parseFloat(stats.average_technical) || 0),
                    averageWordCount: Math.round(parseFloat(stats.average_word_count) || 0),
                    averageSpeakingRate: Math.round(parseFloat(stats.average_speaking_rate) || 0)
                }
            });

        } catch (error: any) {
            console.error('Error getting analysis statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve analysis statistics',
                error: error.message
            });
        }
    };
}

export default AnalysisController;
