const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 5000,
        env: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3005',
    },

    // Database configuration
    database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/ai_interview_db',
        pool: {
            min: 2,
            max: 10,
        },
    },

    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only',
        expiresIn: process.env.JWT_EXPIRE || '7d',
    },

    // OpenAI configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
    },

    // AWS configuration
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.AWS_S3_BUCKET || 'ai-interview-storage',
    },

    // Redis configuration
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
            error: 'logs/error.log',
            combined: 'logs/combined.log',
        },
    },

    // GDPR compliance
    gdpr: {
        dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 30,
        transcriptRetentionDays: parseInt(process.env.TRANSCRIPT_RETENTION_DAYS) || 90,
        analysisRetentionDays: parseInt(process.env.ANALYSIS_RETENTION_DAYS) || 365,
    },

    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    },

    // CORS configuration
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3005',
        credentials: true,
    },
};

module.exports = config;






