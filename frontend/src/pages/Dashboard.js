import React from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
} from '@mui/material';
import {
    VideoCall,
    Mic,
    Psychology,
    Security,
    Language,
    PlayArrow,
    BarChart,
    People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleStartInterview = () => {
        navigate('/interview');
    };

    const handleConsentFlow = () => {
        navigate('/consent');
    };

    const stats = [
        {
            title: 'Total Interviews',
            value: '24',
            change: '+12%',
            icon: VideoCall,
            color: 'primary',
        },
        {
            title: 'Completed Today',
            value: '3',
            change: '+1',
            icon: Mic,
            color: 'success',
        },
        {
            title: 'Average Score',
            value: '7.8',
            change: '+0.3',
            icon: Psychology,
            color: 'info',
        },
        {
            title: 'Active Candidates',
            value: '8',
            change: '+2',
            icon: People,
            color: 'warning',
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your AI-powered interviews and track candidate performance
                </Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {stat.title}
                                            </Typography>
                                            <Typography variant="h4" component="div">
                                                {stat.value}
                                            </Typography>
                                            <Typography variant="body2" color="success.main">
                                                {stat.change}
                                            </Typography>
                                        </Box>
                                        <Icon color={stat.color} sx={{ fontSize: 40 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Main Content */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                startIcon={<PlayArrow />}
                                onClick={handleStartInterview}
                                size="large"
                            >
                                Start New Interview
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Security />}
                                onClick={handleConsentFlow}
                                size="large"
                            >
                                Manage Consent
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<BarChart />}
                                size="large"
                            >
                                View Analytics
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Features
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Chip icon={<Security />} label="GDPR Compliant" color="primary" variant="outlined" />
                            <Chip icon={<Language />} label="Multi-language" color="primary" variant="outlined" />
                            <Chip icon={<Psychology />} label="AI Analysis" color="primary" variant="outlined" />
                            <Chip icon={<VideoCall />} label="Video Recording" color="primary" variant="outlined" />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
