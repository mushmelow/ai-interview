import express, { Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Interview, ConsentRecord, AdminStats, ApiResponse } from '../types';

const router = express.Router();

// Simple in-memory storage for interviews and consents (same as in simple-auth.js)
const interviews: Interview[] = [];
const consents: Record<string, ConsentRecord> = {};

// Admin endpoints for data management
router.post('/clear-all', (req: Request, res: Response) => {
    try {
        // Clear all data
        interviews.length = 0; // Clear interviews array
        Object.keys(consents).forEach(key => delete consents[key]); // Clear consents object

        console.log('🗑️ All data cleared. Default admin user preserved.');

        const response: ApiResponse<{ interviewsCount: number; consentsCount: number }> = {
            success: true,
            message: 'All data cleared successfully. Default admin user preserved.',
            data: {
                interviewsCount: interviews.length,
                consentsCount: Object.keys(consents).length
            }
        };

        res.json(response);
    } catch (error: any) {
        console.error('Clear data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

router.get('/stats', (req: Request, res: Response) => {
    try {
        const stats: AdminStats = {
            usersCount: 0, // This would come from database in real implementation
            interviewsCount: interviews.length,
            consentsCount: Object.keys(consents).length,
            users: [], // This would come from database in real implementation
            interviews: interviews.map(i => ({
                id: i.id,
                userId: i.userId,
                title: i.title,
                status: i.status
            })),
            consents: Object.keys(consents).map(key => ({
                userId: key,
                consentGiven: consents[key].consentGiven
            }))
        };

        const response: ApiResponse<AdminStats> = {
            success: true,
            message: 'Admin stats retrieved successfully',
            data: stats
        };

        res.json(response);
    } catch (error: any) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
