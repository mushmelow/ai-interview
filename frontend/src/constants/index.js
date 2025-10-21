// API endpoints
export const API_ENDPOINTS = {
    HEALTH: '/health',
    TEST: '/api/test',
    CONSENT: '/api/consent',
    CONSENT_AUDIT: '/api/consent/audit',
    INTERVIEW: '/api/interview',
    AUTH: '/api/auth',
};

// Consent types
export const CONSENT_TYPES = {
    VIDEO_RECORDING: 'videoRecording',
    AUDIO_RECORDING: 'audioRecording',
    AI_ANALYSIS: 'aiAnalysis',
    DATA_RETENTION: 'dataRetention',
    DATA_USAGE: 'dataUsage',
    WITHDRAW_CONSENT: 'withdrawConsent',
};

// Data retention periods (in days)
export const DATA_RETENTION = {
    VIDEO_AUDIO: 30,
    TRANSCRIPT: 90,
    ANALYSIS: 365,
};

// Interview status
export const INTERVIEW_STATUS = {
    CREATED: 'created',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// User roles
export const USER_ROLES = {
    CANDIDATE: 'candidate',
    RECRUITER: 'recruiter',
    ADMIN: 'admin',
};

// Languages
export const LANGUAGES = {
    EN: 'en',
    FR: 'fr',
};

// Local storage keys
export const STORAGE_KEYS = {
    CONSENT_USER_ID: 'consent_user_id',
    CONSENT_ID: 'consent_id',
    CONSENT_TIMESTAMP: 'consent_timestamp',
    CURRENT_CONSENT_ID: 'current_consent_id',
    USER_TOKEN: 'user_token',
    USER_DATA: 'user_data',
};

// Error messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    CONSENT_REQUIRED: 'Consent is required to proceed.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    REQUIRED_FIELD: 'This field is required.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
    INTERVIEW_NOT_FOUND: 'Interview not found.',
};

// Success messages
export const SUCCESS_MESSAGES = {
    CONSENT_RECORDED: 'Consent recorded successfully!',
    CONSENT_WITHDRAWN: 'Consent withdrawn successfully.',
    INTERVIEW_STARTED: 'Interview started successfully.',
    INTERVIEW_COMPLETED: 'Interview completed successfully.',
};




