// Consent Service - Handles GDPR consent management
class ConsentService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3500';
    }

    // Get user ID - prefer authenticated user ID, fallback to generated ID
    getUserId() {
        // First, try to get authenticated user ID from localStorage
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.id) {
                    return user.id.toString();
                }
            } catch (e) {
                console.warn('Could not parse user data:', e);
            }
        }

        // Fallback: Generate a unique user ID for consent tracking (for non-authenticated users)
        let userId = localStorage.getItem('consent_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('consent_user_id', userId);
        }
        return userId;
    }

    // Get user's IP address (for audit trail)
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Could not get IP address:', error);
            return 'unknown';
        }
    }

    // Submit consent to backend
    async submitConsent(consents) {
        try {
            const userId = this.getUserId();
            const token = localStorage.getItem('auth_token');
            const ipAddress = await this.getUserIP();
            const userAgent = navigator.userAgent;

            const consentData = {
                userId,
                consents,
                ipAddress,
                userAgent,
                timestamp: new Date().toISOString(),
                consentVersion: '1.0', // Track consent version for legal compliance
                language: navigator.language || 'en',
            };

            console.log('Submitting consent to backend:', consentData);

            const headers = {
                'Content-Type': 'application/json',
            };

            // Add authentication token if available
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseURL}/api/consent`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(consentData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Consent submitted successfully:', result);

            // Store consent ID locally for future reference
            localStorage.setItem('consent_id', result.consentId);
            localStorage.setItem('consent_timestamp', result.timestamp);

            return result;
        } catch (error) {
            console.error('Error submitting consent:', error);
            throw error;
        }
    }

    // Check if user has given consent
    async checkConsent() {
        try {
            const userId = this.getUserId();
            const token = localStorage.getItem('auth_token');

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseURL}/api/consent/${userId}`, {
                headers: headers
            });

            if (response.ok) {
                const result = await response.json();
                // Our backend returns { success: true, data: { consentGiven: boolean, ... } }
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('Error checking consent:', error);
            return null;
        }
    }

    // Withdraw consent (GDPR right to withdraw)
    async withdrawConsent() {
        try {
            const userId = this.getUserId();
            const token = localStorage.getItem('auth_token');

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseURL}/api/consent/${userId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (response.ok) {
                // Clear local storage
                localStorage.removeItem('consent_id');
                localStorage.removeItem('consent_timestamp');
                localStorage.removeItem('consent_user_id');

                const result = await response.json();
                console.log('Consent withdrawn:', result);
                return result;
            }
            throw new Error('Failed to withdraw consent');
        } catch (error) {
            console.error('Error withdrawing consent:', error);
            throw error;
        }
    }

    // Get consent audit trail (for user transparency)
    async getConsentAudit() {
        try {
            const userId = this.getUserId();
            const token = localStorage.getItem('auth_token');

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseURL}/api/consent/audit/${userId}`, {
                headers: headers
            });

            if (response.ok) {
                const result = await response.json();
                return result.auditTrail;
            }
            return [];
        } catch (error) {
            console.error('Error getting consent audit:', error);
            return [];
        }
    }

    // Check if consent is still valid (not expired)
    isConsentValid() {
        const consentTimestamp = localStorage.getItem('consent_timestamp');
        if (!consentTimestamp) return false;

        const consentDate = new Date(consentTimestamp);
        const now = new Date();
        const daysDiff = (now - consentDate) / (1000 * 60 * 60 * 24);

        // Consent is valid for 1 year (365 days)
        return daysDiff < 365;
    }
}

export default ConsentService;


