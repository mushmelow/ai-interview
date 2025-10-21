import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Button,
    Alert,
    Divider,
} from '@mui/material';
import {
    Security,
    CheckCircle,
    Cancel,
    Refresh,
    Delete,
} from '@mui/icons-material';
import ConsentService from '../../services/ConsentService';

const ConsentStatus = () => {
    const [consentStatus, setConsentStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const consentService = new ConsentService();

    useEffect(() => {
        checkConsentStatus();
    }, []);

    const checkConsentStatus = async () => {
        setLoading(true);
        setError(null);

        try {
            const consent = await consentService.checkConsent();
            const isValid = consentService.isConsentValid();

            setConsentStatus({
                exists: !!consent && consent.consentGiven,
                valid: isValid,
                consent: consent,
                localConsentId: localStorage.getItem('consent_id'),
                localTimestamp: localStorage.getItem('consent_timestamp'),
            });
        } catch (error) {
            console.error('Error checking consent status:', error);
            setError('Failed to check consent status');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawConsent = async () => {
        if (!window.confirm('Are you sure you want to withdraw your consent? This will stop all data processing.')) {
            return;
        }

        try {
            await consentService.withdrawConsent();
            setConsentStatus(null);
            alert('Consent withdrawn successfully. All data processing has been stopped.');
        } catch (error) {
            console.error('Error withdrawing consent:', error);
            alert('Failed to withdraw consent. Please try again.');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Typography>Checking consent status...</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Security color="primary" />
                    <Typography variant="h6">Consent Status</Typography>
                    <Button
                        size="small"
                        startIcon={<Refresh />}
                        onClick={checkConsentStatus}
                    >
                        Refresh
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {consentStatus?.exists && consentStatus?.valid ? (
                    <Box>
                        <Chip
                            icon={<CheckCircle />}
                            label="Consent Active"
                            color="success"
                            variant="filled"
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Your consent is valid and data processing is active.
                        </Typography>

                        {consentStatus.consent && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    <strong>User ID:</strong> {consentStatus.consent.userId}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Consent Date:</strong> {new Date(consentStatus.consent.consentDate).toLocaleString()}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Version:</strong> {consentStatus.consent.consentVersion}
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleWithdrawConsent}
                            size="small"
                        >
                            Withdraw Consent
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        <Chip
                            icon={<Cancel />}
                            label="No Active Consent"
                            color="error"
                            variant="outlined"
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="body2" color="text.secondary">
                            You need to provide consent before starting an interview.
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default ConsentStatus;
