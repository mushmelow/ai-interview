import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_BASE_URL;

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Configure axios defaults
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

    // Check if user is logged in on app start
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const response = await axios.get('/api/auth/profile');
                    setUser(response.data.data.user);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('auth_token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };

        checkAuthStatus();
    }, []);

    const login = async (credentials) => {
        try {
            setError(null);
            setLoading(true);

            const response = await axios.post('/api/auth/login', credentials);
            const { user: userData, token } = response.data.data;

            // Store token and user data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(userData));

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(userData);
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await axios.post('/api/auth/register', userData);
            const { user: newUser, token } = response.data.data;

            // Store token and user data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(newUser));

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(newUser);
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (error) {
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

    const clearError = () => {
        setError(null);
    };

    const value = {
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
