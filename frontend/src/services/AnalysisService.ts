import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

export interface AnalysisResult {
    id: string;
    interviewId: number;
    transcript: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: string[];
    keywords: string[];
    answerQuality: {
        relevance: number;
        completeness: number;
        clarity: number;
        technicalAccuracy: number;
        overallScore: number;
    };
    feedback: {
        strengths: string[];
        improvements: string[];
        suggestions: string[];
    };
    analysisMetadata: {
        duration: number;
        wordCount: number;
        speakingRate: number;
        pauseFrequency: number;
        analyzedAt: string;
    };
}

export interface AnalysisStats {
    totalInterviews: number;
    analyzedInterviews: number;
    averageScore: number;
    averageRelevance: number;
    averageCompleteness: number;
    averageClarity: number;
    averageTechnical: number;
    averageWordCount: number;
    averageSpeakingRate: number;
}

class AnalysisService {
    private baseURL: string;

    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3500';
    }

    // Analyze an interview recording
    async analyzeInterview(interviewId: number): Promise<ApiResponse<AnalysisResult>> {
        try {
            const token = localStorage.getItem('token');
            const headers: any = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<AnalysisResult>> = await axios.post(
                `${this.baseURL}/api/analysis/${interviewId}/analyze`,
                {},
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error analyzing interview:', error);
            throw error;
        }
    }

    // Get analysis results for a specific interview
    async getAnalysisResult(interviewId: number): Promise<ApiResponse<AnalysisResult>> {
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<AnalysisResult>> = await axios.get(
                `${this.baseURL}/api/analysis/${interviewId}/analysis`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting analysis result:', error);
            throw error;
        }
    }

    // Get all analysis results for the user
    async getUserAnalysisResults(): Promise<ApiResponse<AnalysisResult[]>> {
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<AnalysisResult[]>> = await axios.get(
                `${this.baseURL}/api/analysis/user/analyses`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting user analysis results:', error);
            throw error;
        }
    }

    // Get analysis statistics for the user
    async getAnalysisStats(): Promise<ApiResponse<AnalysisStats>> {
        try {
            const token = localStorage.getItem('token');
            const headers: any = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response: AxiosResponse<ApiResponse<AnalysisStats>> = await axios.get(
                `${this.baseURL}/api/analysis/user/stats`,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error('Error getting analysis statistics:', error);
            throw error;
        }
    }
}

export default AnalysisService;
