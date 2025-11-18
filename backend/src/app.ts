import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

// Import middleware
import errorHandler from './middleware/errorHandler';

// Import routes
import consentRoutes from './routes/consent';
import authRoutes from './routes/auth';
import interviewRoutes from './routes/interview';
import adminRoutes from './routes/admin';
import questionRoutes from './routes/questions';
import analysisRoutes from './routes/analysis';

// Load environment variables
dotenv.config();

// Simple logger interface
interface Logger {
    info: (message: string) => void;
}

const logger: Logger = {
    info: (message: string) => console.log(message)
};

const app = express();
const PORT: number = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3005'
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Backend is working!',
        timestamp: new Date()
    });
});

// API Routes
app.use('/api/consent', consentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/analysis', analysisRoutes);

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    logger.info(`🔒 Consent API: http://localhost:${PORT}/api/consent`);
    logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    logger.info(`🎥 Interview API: http://localhost:${PORT}/api/interviews`);
    logger.info(`🔧 Admin API: http://localhost:${PORT}/api/admin`);
    logger.info(`❓ Questions API: http://localhost:${PORT}/api/questions`);
});

export default app;


