import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

export interface QuestionGenerationRequest {
    position: string;
    experienceLevel?: 'entry' | 'mid' | 'senior';
    categories?: string[];
    numberOfQuestions?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    customContext?: string;
}

export interface GeneratedQuestion {
    id: number;
    question: string;
    category: string;
    type: string;
    difficulty: string;
    context?: string;
    followUpQuestions?: string[];
    expectedKeywords?: string[];
}

export interface QuestionSession {
    sessionId: string;
    questions: GeneratedQuestion[];
    metadata: {
        position: string;
        experienceLevel: string;
        categories: string[];
        generatedAt: string;
    };
}

export interface QuestionCategory {
    id: number;
    name: string;
    description: string;
    difficulty: string;
}

class QuestionService {
    private baseURL: string;

    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3500';
    }

    // Generate AI questions
    async generateQuestions(request: QuestionGenerationRequest): Promise<ApiResponse<QuestionSession>> {
        try {
            const token = localStorage.getItem('token');
            const headers: any = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<QuestionSession>> = await axios.post(
                `${this.baseURL}/api/questions/generate`,
                request,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error generating questions:', error);
            throw error;
        }
    }

    // Get questions for a session
    async getSessionQuestions(sessionId: string): Promise<ApiResponse<{ sessionId: string; questions: GeneratedQuestion[] }>> {
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<{ sessionId: string; questions: GeneratedQuestion[] }>> = await axios.get(
                `${this.baseURL}/api/questions/session/${sessionId}`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting session questions:', error);
            throw error;
        }
    }

    // Get available categories
    async getCategories(): Promise<ApiResponse<QuestionCategory[]>> {
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<QuestionCategory[]>> = await axios.get(
                `${this.baseURL}/api/questions/categories`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    }

    // Get question templates
    async getTemplates(category?: string, difficulty?: string): Promise<ApiResponse<any[]>> {
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (difficulty) params.append('difficulty', difficulty);

            const token = localStorage.getItem('token');
            const headers: any = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<any[]>> = await axios.get(
                `${this.baseURL}/api/questions/templates?${params.toString()}`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting templates:', error);
            throw error;
        }
    }
}

export default QuestionService;
