import { useState, useEffect, useCallback } from 'react';
import ConsentService from '../services/ConsentService';
import { generateUserId, isConsentValid } from '../utils/helpers';
import { STORAGE_KEYS } from '../constants';

export const useConsent = () => {
    const [consentStatus, setConsentStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const consentService = new ConsentService();

    const checkConsentStatus = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const consent = await consentService.checkConsent();
            const localConsentId = localStorage.getItem(STORAGE_KEYS.CONSENT_ID);
            const localTimestamp = localStorage.getItem(STORAGE_KEYS.CONSENT_TIMESTAMP);

            setConsentStatus({
                exists: !!consent,
                valid: isConsentValid(localTimestamp),
                consent: consent,
                localConsentId,
                localTimestamp,
            });
        } catch (error) {
            console.error('Error checking consent status:', error);
            setError('Failed to check consent status');
        } finally {
            setLoading(false);
        }
    }, [consentService]);

    const submitConsent = useCallback(async (consents) => {
        setLoading(true);
        setError(null);

        try {
            const result = await consentService.submitConsent(consents);

            // Update local storage
            localStorage.setItem(STORAGE_KEYS.CONSENT_ID, result.consentId);
            localStorage.setItem(STORAGE_KEYS.CONSENT_TIMESTAMP, result.timestamp);

            // Refresh consent status
            await checkConsentStatus();

            return result;
        } catch (error) {
            console.error('Error submitting consent:', error);
            setError('Failed to submit consent. Please try again.');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [consentService, checkConsentStatus]);

    const withdrawConsent = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await consentService.withdrawConsent();
            setConsentStatus(null);
            return true;
        } catch (error) {
            console.error('Error withdrawing consent:', error);
            setError('Failed to withdraw consent. Please try again.');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [consentService]);

    const getConsentAudit = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const auditTrail = await consentService.getConsentAudit();
            return auditTrail;
        } catch (error) {
            console.error('Error getting consent audit:', error);
            setError('Failed to get consent audit.');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [consentService]);

    useEffect(() => {
        checkConsentStatus();
    }, [checkConsentStatus]);

    return {
        consentStatus,
        loading,
        error,
        checkConsentStatus,
        submitConsent,
        withdrawConsent,
        getConsentAudit,
    };
};




