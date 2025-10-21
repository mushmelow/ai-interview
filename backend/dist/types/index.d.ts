import { Request } from 'express';
export interface User {
    id: number;
    email: string;
    passwordHash: string;
    role: 'admin' | 'candidate' | 'interviewer';
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface CreateUserData {
    email: string;
    passwordHash: string;
    role?: 'admin' | 'candidate' | 'interviewer';
    firstName?: string;
    lastName?: string;
}
export interface UpdateUserData {
    email?: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'candidate' | 'interviewer';
}
export interface UserResponse {
    id: number;
    email: string;
    role: 'admin' | 'candidate' | 'interviewer';
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    updatedAt?: Date;
}
export interface JWTPayload {
    userId: number;
    email: string;
    role: 'admin' | 'candidate' | 'interviewer';
    iat?: number;
    exp?: number;
}
export interface ConsentData {
    dataProcessing: boolean;
    analytics: boolean;
    marketing?: boolean;
    [key: string]: boolean | undefined;
}
export interface ConsentRecord {
    userId: string;
    consents: ConsentData;
    consentGiven: boolean;
    consentDate: string;
    consentVersion: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
}
export interface ConsentResponse {
    userId: string;
    consentGiven: boolean;
    consentDate: string | null;
    consentVersion: string;
}
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
    description?: string;
}
export interface InterviewAnalysis {
    transcript?: string;
    sentiment?: string;
    confidence?: number;
    emotions?: string[];
    voiceAnalysis?: any;
    overallScore?: number;
    analyzedAt?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
export interface AuthResponse {
    user: UserResponse;
    token: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    role?: 'admin' | 'candidate' | 'interviewer';
}
export interface ConsentRequest {
    userId: string;
    consents: ConsentData;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
    consentVersion?: string;
}
export interface AdminStats {
    usersCount: number;
    interviewsCount: number;
    consentsCount: number;
    users: Array<{
        id: number;
        email: string;
        role: string;
    }>;
    interviews: Array<{
        id: number;
        userId: number;
        title: string;
        status: string;
    }>;
    consents: Array<{
        userId: string;
        consentGiven: boolean;
    }>;
}
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}
export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}
//# sourceMappingURL=index.d.ts.map