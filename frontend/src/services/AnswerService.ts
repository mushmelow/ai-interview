import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

export interface SubmitAnswerRequest {
    questionId: number;
    sessionId: string;
    answer: string;
    answerType?: 'text' | 'voice' | 'video';
    recordingPath?: string;
}

export interface Answer {
    id: number;
    questionId: number;
    sessionId: string;
    userId: number;
    answer: string;
    answerType: 'text' | 'voice' | 'video';
    recordingPath?: string;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
    question?: string;
    category?: string;
    type?: string;
    difficulty?: string;
    score?: number; // AI score from 0-10
    scoreFeedback?: string; // AI feedback on the answer
    scoreReasoning?: string; // Reasoning for the score
    strengths?: string[]; // What was done well
    improvements?: string[]; // Areas for improvement
    suggestions?: string[]; // Specific suggestions
}

class AnswerService {
    private baseURL: string;

    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3500';
    }

    // Submit an answer for a question
    async submitAnswer(request: SubmitAnswerRequest): Promise<ApiResponse<Answer>> {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<Answer>> = await axios.post(
                `${this.baseURL}/api/answers/submit`,
                request,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    }

    // Get all answers for a session
    async getSessionAnswers(sessionId: string): Promise<ApiResponse<Answer[]>> {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<Answer[]>> = await axios.get(
                `${this.baseURL}/api/answers/session/${sessionId}`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting session answers:', error);
            throw error;
        }
    }

    // Get answer for a specific question
    async getQuestionAnswer(questionId: number): Promise<ApiResponse<Answer>> {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<Answer>> = await axios.get(
                `${this.baseURL}/api/answers/question/${questionId}`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting question answer:', error);
            throw error;
        }
    }
}

export default AnswerService;



