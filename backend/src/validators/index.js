const { CONSENT_TYPES } = require('../../constants');

// Consent validation
const validateConsentData = (data) => {
    const errors = [];

    // Required fields
    if (!data.userId) {
        errors.push('User ID is required');
    }

    if (!data.consents) {
        errors.push('Consents object is required');
    } else {
        // Validate each consent type
        Object.values(CONSENT_TYPES).forEach(consentType => {
            if (typeof data.consents[consentType] !== 'boolean') {
                errors.push(`${consentType} consent must be a boolean value`);
            }
        });
    }

    // Optional fields validation
    if (data.ipAddress && typeof data.ipAddress !== 'string') {
        errors.push('IP address must be a string');
    }

    if (data.userAgent && typeof data.userAgent !== 'string') {
        errors.push('User agent must be a string');
    }

    if (data.language && !['en', 'fr'].includes(data.language)) {
        errors.push('Language must be either "en" or "fr"');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Interview validation
const validateInterviewData = (data) => {
    const errors = [];

    if (!data.userId) {
        errors.push('User ID is required');
    }

    if (!data.position) {
        errors.push('Position is required');
    } else if (data.position.length < 2) {
        errors.push('Position must be at least 2 characters long');
    }

    if (!data.consentId) {
        errors.push('Consent ID is required');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// User validation
const validateUserData = (data) => {
    const errors = [];

    if (!data.email) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Email must be valid');
    }

    if (!data.password) {
        errors.push('Password is required');
    } else if (data.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (!data.name) {
        errors.push('Name is required');
    } else if (data.name.length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Generic validation middleware
const validateRequest = (validator) => {
    return (req, res, next) => {
        const validation = validator(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors,
            });
        }

        next();
    };
};

module.exports = {
    validateConsentData,
    validateInterviewData,
    validateUserData,
    validateRequest,
};




