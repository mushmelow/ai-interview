import React, { useState } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, loading, error, clearError } = useAuth();

    const handleLogin = async (credentials) => {
        clearError();
        const result = await login(credentials);
        if (result.success) {
            // Login successful, user will be redirected by the app
        }
    };

    const handleRegister = async (userData) => {
        clearError();
        const result = await register(userData);
        if (result.success) {
            // Registration successful, user will be redirected by the app
        }
    };

    const switchToRegister = () => {
        setIsLogin(false);
        clearError();
    };

    const switchToLogin = () => {
        setIsLogin(true);
        clearError();
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 4
                }}
            >
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h3" component="h1" gutterBottom color="primary">
                        AI Interview Platform
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        {isLogin ? 'Sign in to your account' : 'Create your account'}
                    </Typography>
                </Box>

                {/* Auth Form */}
                {isLogin ? (
                    <LoginForm
                        onLogin={handleLogin}
                        onSwitchToRegister={switchToRegister}
                        loading={loading}
                        error={error}
                    />
                ) : (
                    <RegisterForm
                        onRegister={handleRegister}
                        onSwitchToLogin={switchToLogin}
                        loading={loading}
                        error={error}
                    />
                )}

                {/* Footer */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Secure • GDPR Compliant • AI-Powered
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default AuthPage;




