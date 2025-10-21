const Consent = require('../database/models/Consent');
// Simple logger for now
const logger = {
    info: (message) => console.log(message),
    error: (message) => console.error(message),
    debug: (message) => console.log(message)
};

class ConsentService {
    // Create consent record
    async createConsent(consentData) {
        try {
            const consent = await Consent.create(consentData);
            logger.info(`Consent created for user ${consentData.userId}`);
            return consent;
        } catch (error) {
            logger.error(`Error creating consent: ${error.message}`);
            throw error;
        }
    }

    // Get consent by user ID
    async getConsentByUserId(userId) {
        try {
            const consent = await Consent.findLatestByUserId(userId);
            return consent;
        } catch (error) {
            logger.error(`Error getting consent for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    // Withdraw consent
    async withdrawConsent(userId) {
        try {
            const result = await Consent.withdrawAllConsents(userId);
            logger.info(`Consent withdrawn for user ${userId}`);
            return result;
        } catch (error) {
            logger.error(`Error withdrawing consent for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    // Get consent audit trail
    async getConsentAudit(userId) {
        try {
            const auditTrail = await Consent.findAllByUserId(userId);
            return auditTrail;
        } catch (error) {
            logger.error(`Error getting consent audit for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    // Get all consents (for admin)
    async getAllConsents() {
        try {
            // This would need to be implemented in the Consent model
            // For now, return empty array
            return [];
        } catch (error) {
            logger.error(`Error getting all consents: ${error.message}`);
            throw error;
        }
    }

    // Delete expired consents (GDPR compliance)
    async deleteExpiredConsents() {
        try {
            // This would need to be implemented in the Consent model
            // For now, return 0
            return 0;
        } catch (error) {
            logger.error(`Error deleting expired consents: ${error.message}`);
            throw error;
        }
    }

    // Get consent statistics
    async getConsentStats() {
        try {
            // This would need to be implemented in the Consent model
            // For now, return basic stats
            return {
                total: 0,
                active: 0,
                withdrawn: 0,
                withdrawalRate: 0,
            };
        } catch (error) {
            logger.error(`Error getting consent stats: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ConsentService;
