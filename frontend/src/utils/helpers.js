// Date utilities
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Local storage utilities
export const storage = {
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            return localStorage.getItem(key);
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            localStorage.setItem(key, value);
        }
    },
    remove: (key) => {
        localStorage.removeItem(key);
    },
    clear: () => {
        localStorage.clear();
    },
};

// API utilities
export const apiRequest = async (url, options = {}) => {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3500';
    const fullURL = `${baseURL}${url}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(fullURL, { ...defaultOptions, ...options });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// Validation utilities
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateRequired = (value) => {
    return value && value.toString().trim().length > 0;
};

// Consent utilities
export const generateUserId = () => {
    let userId = localStorage.getItem('consent_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('consent_user_id', userId);
    }
    return userId;
};

export const isConsentValid = (timestamp) => {
    if (!timestamp) return false;

    const consentDate = new Date(timestamp);
    const now = new Date();
    const daysDiff = (now - consentDate) / (1000 * 60 * 60 * 24);

    // Consent is valid for 1 year (365 days)
    return daysDiff < 365;
};




