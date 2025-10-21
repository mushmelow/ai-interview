import React from 'react';
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Container,
    Typography,
    Box,
    Paper,
    Button,
    AppBar,
    Toolbar,
    Chip,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    VideoCall,
    Mic,
    Psychology,
    Security,
    Language
} from '@mui/icons-material';

// Import components
import { Header, ConsentFlow, ConsentStatus, AuthPage } from './components';
import InterviewRecording from './components/InterviewRecording';
import { theme } from './styles/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Main App Content Component
function AppContent() {
    const { user, loading } = useAuth();
    const [showConsent, setShowConsent] = React.useState(false);
    const [consentGiven, setConsentGiven] = React.useState(false);
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [currentView, setCurrentView] = React.useState('dashboard'); // 'dashboard' or 'interview'
    const [consentRefreshKey, setConsentRefreshKey] = React.useState(0);

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    // Show authentication page if user is not logged in
    if (!user) {
        return <AuthPage />;
    }

    const handleStartInterview = () => {
        if (!consentGiven) {
            setShowConsent(true);
        } else {
            setCurrentView('interview');
        }
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
    };

    const handleConsentFlow = () => {
        setShowConsent(true);
    };

    const handleConsent = (consentData) => {
        console.log('Consents given:', consentData);
        setConsentGiven(true);
        setShowConsent(false);
        setSnackbarOpen(true);

        // Store consent information for future use
        if (consentData.consentId) {
            localStorage.setItem('current_consent_id', consentData.consentId);
            localStorage.setItem('consent_timestamp', consentData.timestamp);
        }

        // Trigger consent status refresh
        setConsentRefreshKey(prev => prev + 1);
    };

    const handleDecline = () => {
        setShowConsent(false);
        console.log('Consent declined');
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    // Show interview recording view
    if (currentView === 'interview') {
        return (
            <Box className="App">
                <Header showBackButton={true} onBackClick={handleBackToDashboard} />
                <InterviewRecording />
            </Box>
        );
    }

    // Show dashboard view
    return (
        <Box className="App">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom color="primary">
                        Welcome to AI Interview Platform
                    </Typography>

                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                        Conduct intelligent interviews with AI-powered analysis
                    </Typography>

                    {/* User Info */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                            Welcome, {user.email} ({user.role})
                        </Typography>
                    </Box>

                    {/* Status Cards */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4, flexWrap: 'wrap' }}>
                        <Paper elevation={1} sx={{ p: 2, minWidth: 200 }}>
                            <Mic color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6">Frontend</Typography>
                            <Typography variant="body2" color="success.main">
                                ✅ Running on port 3005
                            </Typography>
                        </Paper>

                        <Paper elevation={1} sx={{ p: 2, minWidth: 200 }}>
                            <Psychology color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6">Backend</Typography>
                            <Typography variant="body2" color="success.main">
                                ✅ Running on port 5000
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Features */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Key Features
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Chip icon={<Security />} label="GDPR Compliant" color="primary" variant="outlined" />
                            <Chip icon={<Language />} label="Multi-language" color="primary" variant="outlined" />
                            <Chip icon={<Psychology />} label="AI Analysis" color="primary" variant="outlined" />
                            <Chip icon={<VideoCall />} label="Video Recording" color="primary" variant="outlined" />
                        </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<VideoCall />}
                            onClick={handleStartInterview}
                            sx={{ minWidth: 200 }}
                        >
                            {consentGiven ? 'Start Interview' : 'Start Interview'}
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Security />}
                            onClick={handleConsentFlow}
                            sx={{ minWidth: 200 }}
                        >
                            Consent Flow
                        </Button>
                    </Box>

                    {/* Consent Status */}
                    <Box sx={{ mt: 3 }}>
                        <ConsentStatus key={consentRefreshKey} />
                    </Box>
                </Paper>
            </Container>

            {/* Consent Flow Dialog */}
            <ConsentFlow
                open={showConsent}
                onConsent={handleConsent}
                onDecline={handleDecline}
            />

            {/* Success Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Consent recorded successfully! You can now start your interview.
                </Alert>
            </Snackbar>
        </Box>
    );
}

// Main App Component with AuthProvider
function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;