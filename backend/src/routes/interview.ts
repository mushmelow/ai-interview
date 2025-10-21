import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Interview, CreateInterviewData, ApiResponse } from '../types';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, uploadsDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `interview-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Simple in-memory interview storage (replace with database later)
const interviews: Interview[] = [];

// Start a new interview session
router.post('/start', (req: Request, res: Response) => {
    try {
        const { userId, title, description }: CreateInterviewData = req.body;

        const newInterview: Interview = {
            id: interviews.length + 1,
            userId: userId,
            title: title || 'Interview Session',
            description: description || '',
            status: 'started',
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            videoFile: null,
            audioFile: null,
            transcript: null,
            analysis: null
        };

        interviews.push(newInterview);

        const response: ApiResponse<{ interview: Interview }> = {
            success: true,
            message: 'Interview session started',
            data: {
                interview: newInterview
            }
        };

        res.json(response);
    } catch (error: any) {
        console.error('Start interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// End an interview session
router.post('/:interviewId/end', (req: Request, res: Response) => {
    try {
        const { interviewId } = req.params;
        const interview = interviews.find(i => i.id == parseInt(interviewId));

        if (!interview) {
            res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
            return;
        }

        const endTime = new Date();
        const startTime = new Date(interview.startTime);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // duration in seconds

        interview.status = 'completed';
        interview.endTime = endTime.toISOString();
        interview.duration = duration;

        const response: ApiResponse<{ interview: Interview }> = {
            success: true,
            message: 'Interview session ended',
            data: {
                interview: interview
            }
        };

        res.json(response);
    } catch (error: any) {
        console.error('End interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Upload video/audio files for an interview
router.post('/:interviewId/upload', upload.single('recording'), (req: Request, res: Response) => {
    try {
        const { interviewId } = req.params;
        const interview = interviews.find(i => i.id == parseInt(interviewId));

        if (!interview) {
            res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
            return;
        }

        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
            return;
        }

        // Determine if it's video or audio based on file type
        const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'audio';

        if (fileType === 'video') {
            interview.videoFile = req.file.filename;
        } else {
            interview.audioFile = req.file.filename;
        }

        const response: ApiResponse<{ filename: string; fileType: string; size: number }> = {
            success: true,
            message: `${fileType} file uploaded successfully`,
            data: {
                filename: req.file.filename,
                fileType: fileType,
                size: req.file.size
            }
        };

        res.json(response);
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all interviews for a user
router.get('/user/:userId', (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const userInterviews = interviews.filter(i => i.userId == parseInt(userId));

        const response: ApiResponse<{ interviews: Interview[] }> = {
            success: true,
            message: 'User interviews retrieved successfully',
            data: {
                interviews: userInterviews
            }
        };

        res.json(response);
    } catch (error: any) {
        console.error('Get interviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get a specific interview
router.get('/:interviewId', (req: Request, res: Response) => {
    try {
        const { interviewId } = req.params;
        const interview = interviews.find(i => i.id == parseInt(interviewId));

        if (!interview) {
            res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
            return;
        }

        const response: ApiResponse<{ interview: Interview }> = {
            success: true,
            message: 'Interview retrieved successfully',
            data: {
                interview: interview
            }
        };

        res.json(response);
    } catch (error: any) {
        console.error('Get interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all interviews (admin only)
router.get('/', (req: Request, res: Response) => {
    try {
        const response: ApiResponse<{ interviews: Interview[] }> = {
            success: true,
            message: 'All interviews retrieved successfully',
            data: {
                interviews: interviews
            }
        };

        res.json(response);
    } catch (error: any) {
        console.error('Get all interviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;