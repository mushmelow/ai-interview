import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios, { AxiosResponse } from 'axios';
import { User, LoginData, RegisterData, AuthResponse } from '../types';

// Configure axios base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3500';
axios.defaults.baseURL = API_BASE_URL;

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (credentials: LoginData) => Promise<{ success: boolean; error?: string }>;
    register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    clearError: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Configure axios defaults
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

    // Check if user is logged in on app start
    useEffect(() => {
        const checkAuthStatus = async (): Promise<void> => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const response: AxiosResponse<AuthResponse> = await axios.get('/api/auth/profile');
                    setUser(response.data.data?.user || null);
                } catch (error: any) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('auth_token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };

        checkAuthStatus();
    }, []);

    const login = async (credentials: LoginData): Promise<{ success: boolean; error?: string }> => {
        try {
            setError(null);
            setLoading(true);

            const response: AxiosResponse<AuthResponse> = await axios.post('/api/auth/login', credentials);
            const { user: userData, token } = response.data.data!;

            // Store token and user data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(userData));

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(userData);
            return { success: true };
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
        try {
            setError(null);
            setLoading(true);

            const response: AxiosResponse<AuthResponse> = await axios.post('/api/auth/register', userData);
            const { user: newUser, token } = response.data.data!;

            // Store token and user data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(newUser));

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(newUser);
            return { success: true };
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await axios.post('/api/auth/logout');
        } catch (error: any) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and state
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setError(null);
        }
    };

    const clearError = (): void => {
        setError(null);
    };

    const value: AuthContextType = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
