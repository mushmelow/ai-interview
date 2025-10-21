import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControlLabel,
    Checkbox,
    Typography,
    Box,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import {
    Security,
    VideoCall,
    Mic,
    Psychology,
    Schedule,
    People,
    Cancel,
    CheckCircle,
} from '@mui/icons-material';
import ConsentService from '../../services/ConsentService';

const ConsentFlow = ({ open, onConsent, onDecline }) => {
    const [consents, setConsents] = useState({
        videoRecording: false,
        audioRecording: false,
        aiAnalysis: false,
        dataRetention: false,
        dataUsage: false,
        withdrawConsent: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const consentService = new ConsentService();

    const handleConsentChange = (key) => {
        setConsents(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        setError(null); // Clear error when user makes changes
    };

    const allConsentsGiven = Object.values(consents).every(consent => consent);

    const handleAgree = async () => {
        if (!allConsentsGiven) {
            setError('Please provide consent for all data processing activities to proceed.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            console.log('Submitting consent to backend...');
            const result = await consentService.submitConsent(consents);
            console.log('Consent submitted successfully:', result);

            // Call the parent callback with the consent data and backend response
            onConsent({
                consents,
                consentId: result.consentId,
                timestamp: result.timestamp,
                backendResponse: result
            });
        } catch (error) {
            console.error('Failed to submit consent:', error);
            setError('Failed to submit consent. Please check your internet connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const consentItems = [
        {
            key: 'videoRecording',
            icon: VideoCall,
            title: 'Video Recording',
            description: 'We will record your video during the interview for analysis purposes. This includes facial expressions and body language.',
        },
        {
            key: 'audioRecording',
            icon: Mic,
            title: 'Audio Recording',
            description: 'We will record your voice during the interview for speech analysis and transcription.',
        },
        {
            key: 'aiAnalysis',
            icon: Psychology,
            title: 'AI Analysis',
            description: 'Your responses will be analyzed using artificial intelligence to assess communication skills, confidence, and other relevant metrics.',
        },
        {
            key: 'dataRetention',
            icon: Schedule,
            title: 'Data Retention',
            description: 'Video/audio recordings will be stored for 30 days, transcripts for 90 days, and analysis results for 1 year.',
        },
        {
            key: 'dataUsage',
            icon: People,
            title: 'Data Usage',
            description: 'Your data will be used solely for interview evaluation and will not be shared with third parties without your explicit consent.',
        },
        {
            key: 'withdrawConsent',
            icon: Security,
            title: 'Withdraw Consent',
            description: 'You can withdraw your consent at any time by contacting us. This will stop further processing of your data.',
        },
    ];

    return (
        <Dialog
            open={open}
            onClose={onDecline}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Security color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" component="div">
                            Data Processing Consent
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Before starting your interview, please review and consent to our data processing practices.
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        <strong>Note:</strong> All consents are required to proceed with the interview.
                    </Typography>
                </Alert>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            {error}
                        </Typography>
                    </Alert>
                )}

                <List>
                    {consentItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <React.Fragment key={item.key}>
                                <ListItem sx={{ py: 2 }}>
                                    <ListItemIcon>
                                        <Icon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={consents[item.key]}
                                                        onChange={() => handleConsentChange(item.key)}
                                                        color="primary"
                                                    />
                                                }
                                                label={
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            {item.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {item.description}
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ alignItems: 'flex-start', m: 0 }}
                                            />
                                        }
                                    />
                                </ListItem>
                                {index < consentItems.length - 1 && <Divider />}
                            </React.Fragment>
                        );
                    })}
                </List>

                <Alert severity="warning" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>Important:</strong> Unfortunately, we cannot proceed with the interview without your consent to data processing.
                    </Typography>
                </Alert>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                    onClick={onDecline}
                    variant="outlined"
                    startIcon={<Cancel />}
                    size="large"
                    sx={{ minWidth: 150 }}
                >
                    I Decline
                </Button>
                <Button
                    onClick={handleAgree}
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                    size="large"
                    disabled={!allConsentsGiven || isSubmitting}
                    sx={{ minWidth: 150 }}
                >
                    {isSubmitting ? 'Submitting...' : 'I Agree & Continue'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConsentFlow;
