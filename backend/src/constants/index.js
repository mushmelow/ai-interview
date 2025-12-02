// API endpoints
const API_ENDPOINTS = {
    HEALTH: '/health',
    TEST: '/api/test',
    CONSENT: '/api/consent',
    CONSENT_AUDIT: '/api/consent/audit',
    INTERVIEW: '/api/interview',
    AUTH: '/api/auth',
};

// Consent types
const CONSENT_TYPES = {
    VIDEO_RECORDING: 'videoRecording',
    AUDIO_RECORDING: 'audioRecording',
    AI_ANALYSIS: 'aiAnalysis',
    DATA_RETENTION: 'dataRetention',
    DATA_USAGE: 'dataUsage',
    WITHDRAW_CONSENT: 'withdrawConsent',
};

// Data retention periods (in days)
const DATA_RETENTION = {
    VIDEO_AUDIO: 30,
    TRANSCRIPT: 90,
    ANALYSIS: 365,
};

// Interview status
const INTERVIEW_STATUS = {
    CREATED: 'created',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// User roles
const USER_ROLES = {
    CANDIDATE: 'candidate',
    RECRUITER: 'recruiter',
    ADMIN: 'admin',
};

// HTTP status codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};

// Error messages
const ERROR_MESSAGES = {
    VALIDATION_FAILED: 'Validation failed',
    CONSENT_REQUIRED: 'All consents must be given to proceed',
    CONSENT_NOT_FOUND: 'No consent record found for this user',
    INTERVIEW_NOT_FOUND: 'Interview not found',
    UNAUTHORIZED: 'You are not authorized to access this resource',
    INTERNAL_ERROR: 'Internal server error',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
};

// Success messages
const SUCCESS_MESSAGES = {
    CONSENT_RECORDED: 'Consent recorded successfully',
    CONSENT_WITHDRAWN: 'Consent withdrawn successfully',
    INTERVIEW_CREATED: 'Interview created successfully',
    INTERVIEW_STARTED: 'Interview started successfully',
    INTERVIEW_COMPLETED: 'Interview completed successfully',
};

// Log levels
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
};

module.exports = {
    API_ENDPOINTS,
    CONSENT_TYPES,
    DATA_RETENTION,
    INTERVIEW_STATUS,
    USER_ROLES,
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    LOG_LEVELS,
};






