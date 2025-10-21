// User types
export interface User {
    id: number;
    email: string;
    role: 'candidate' | 'recruiter' | 'admin';
    createdAt: string;
    updatedAt: string;
}

// Interview types
export interface Interview {
    id: number;
    userId: number;
    title: string;
    description: string;
    status: 'started' | 'completed' | 'cancelled';
    startTime: string;
    endTime: string | null;
    duration: number;
    videoFile: string | null;
    audioFile: string | null;
    transcript: string | null;
    analysis: InterviewAnalysis | null;
}

export interface CreateInterviewData {
    userId: number;
    title: string;
    description: string;
}

export interface InterviewAnalysis {
    overallScore: number;
    communicationScore: number;
    technicalScore: number;
    confidenceScore: number;
    keywords: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    feedback: string;
    strengths: string[];
    areasForImprovement: string[];
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

// Consent types
export interface ConsentData {
    consentId: string;
    userId: string;
    videoRecording: boolean;
    audioRecording: boolean;
    aiAnalysis: boolean;
    dataRetention: boolean;
    dataUsage: boolean;
    withdrawConsent: boolean;
    timestamp: string;
}

// Auth types
export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    role: 'candidate' | 'recruiter';
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: User;
        token: string;
    };
}

// Media types
export interface MediaStream {
    getVideoTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getTracks(): MediaStreamTrack[];
}

export interface MediaRecorder {
    state: 'inactive' | 'recording' | 'paused';
    start(timeslice?: number): void;
    stop(): void;
    ondataavailable: ((event: BlobEvent) => void) | null;
}
