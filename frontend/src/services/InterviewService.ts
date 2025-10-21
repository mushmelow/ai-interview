import axios, { AxiosResponse } from 'axios';
import { Interview, ApiResponse } from '../types';

class InterviewService {
    private baseURL: string;

    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    }

    // Start a new interview session
    async startInterview(userId: number, title: string, description: string): Promise<ApiResponse<{ interview: Interview }>> {
        try {
            const response: AxiosResponse<ApiResponse<{ interview: Interview }>> = await axios.post(`${this.baseURL}/api/interviews/start`, {
                userId,
                title,
                description
            });
            return response.data;
        } catch (error: any) {
            console.error('Error starting interview:', error);
            throw error;
        }
    }

    // End an interview session
    async endInterview(interviewId: number): Promise<ApiResponse<{ interview: Interview }>> {
        try {
            const response: AxiosResponse<ApiResponse<{ interview: Interview }>> = await axios.post(`${this.baseURL}/api/interviews/${interviewId}/end`);
            return response.data;
        } catch (error: any) {
            console.error('Error ending interview:', error);
            throw error;
        }
    }

    // Upload video/audio recording
    async uploadRecording(interviewId: number, file: File): Promise<ApiResponse<{ filename: string; fileType: string; size: number }>> {
        try {
            const formData = new FormData();
            formData.append('recording', file);

            const response: AxiosResponse<ApiResponse<{ filename: string; fileType: string; size: number }>> = await axios.post(
                `${this.baseURL}/api/interviews/${interviewId}/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error uploading recording:', error);
            throw error;
        }
    }

    // Get all interviews for a user
    async getUserInterviews(userId: number): Promise<ApiResponse<{ interviews: Interview[] }>> {
        try {
            const response: AxiosResponse<ApiResponse<{ interviews: Interview[] }>> = await axios.get(`${this.baseURL}/api/interviews/user/${userId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error getting user interviews:', error);
            throw error;
        }
    }

    // Get a specific interview
    async getInterview(interviewId: number): Promise<ApiResponse<{ interview: Interview }>> {
        try {
            const response: AxiosResponse<ApiResponse<{ interview: Interview }>> = await axios.get(`${this.baseURL}/api/interviews/${interviewId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error getting interview:', error);
            throw error;
        }
    }

    // Get all interviews (admin only)
    async getAllInterviews(): Promise<ApiResponse<{ interviews: Interview[] }>> {
        try {
            const response: AxiosResponse<ApiResponse<{ interviews: Interview[] }>> = await axios.get(`${this.baseURL}/api/interviews`);
            return response.data;
        } catch (error: any) {
            console.error('Error getting all interviews:', error);
            throw error;
        }
    }
}

export default InterviewService;
