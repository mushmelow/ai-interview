import axios from 'axios';

class InterviewService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    }

    // Start a new interview session
    async startInterview(userId, title, description) {
        try {
            const response = await axios.post(`${this.baseURL}/api/interviews/start`, {
                userId,
                title,
                description
            });
            return response.data;
        } catch (error) {
            console.error('Error starting interview:', error);
            throw error;
        }
    }

    // End an interview session
    async endInterview(interviewId) {
        try {
            const response = await axios.post(`${this.baseURL}/api/interviews/${interviewId}/end`);
            return response.data;
        } catch (error) {
            console.error('Error ending interview:', error);
            throw error;
        }
    }

    // Upload video/audio recording
    async uploadRecording(interviewId, file) {
        try {
            const formData = new FormData();
            formData.append('recording', file);

            const response = await axios.post(
                `${this.baseURL}/api/interviews/${interviewId}/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error uploading recording:', error);
            throw error;
        }
    }

    // Get all interviews for a user
    async getUserInterviews(userId) {
        try {
            const response = await axios.get(`${this.baseURL}/api/interviews/user/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting user interviews:', error);
            throw error;
        }
    }

    // Get a specific interview
    async getInterview(interviewId) {
        try {
            const response = await axios.get(`${this.baseURL}/api/interviews/${interviewId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting interview:', error);
            throw error;
        }
    }

    // Get all interviews (admin only)
    async getAllInterviews() {
        try {
            const response = await axios.get(`${this.baseURL}/api/interviews`);
            return response.data;
        } catch (error) {
            console.error('Error getting all interviews:', error);
            throw error;
        }
    }
}

export default InterviewService;


