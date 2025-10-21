"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consents = {};
class ConsentController {
    constructor() {
    }
    async createConsent(req, res) {
        try {
            const { userId, consents: consentData, ipAddress, userAgent, timestamp, consentVersion } = req.body;
            consents[userId] = {
                userId: userId,
                consents: consentData,
                consentGiven: true,
                consentDate: new Date().toISOString(),
                consentVersion: consentVersion || "1.0",
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                timestamp: timestamp || new Date().toISOString()
            };
            console.log(`Consent stored for user ${userId}:`, consentData);
            const response = {
                success: true,
                message: 'Consent recorded successfully',
                data: {
                    userId: userId,
                    consentGiven: true,
                    consentDate: consents[userId].consentDate,
                    consentVersion: consents[userId].consentVersion
                }
            };
            res.json({
                ...response,
                consentId: `consent_${userId}_${Date.now()}`,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Consent update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getConsent(req, res) {
        try {
            const { userId } = req.params;
            const userConsent = consents[userId];
            const response = {
                success: true,
                message: 'Consent status retrieved successfully',
                data: {
                    userId: userId,
                    consentGiven: userConsent ? userConsent.consentGiven : false,
                    consentDate: userConsent ? userConsent.consentDate : null,
                    consentVersion: userConsent ? userConsent.consentVersion : "1.0"
                }
            };
            res.json(response);
        }
        catch (error) {
            console.error('Consent check error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async withdrawConsent(req, res) {
        try {
            const { userId } = req.params;
            if (!consents[userId]) {
                res.status(404).json({
                    success: false,
                    message: 'No consent record found for this user'
                });
                return;
            }
            delete consents[userId];
            console.log(`Consent withdrawn for user: ${userId}`);
            const response = {
                success: true,
                message: 'Consent withdrawn successfully'
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error withdrawing consent:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getConsentAudit(req, res) {
        try {
            const { userId } = req.params;
            const userConsent = consents[userId];
            if (!userConsent) {
                res.status(404).json({
                    success: false,
                    message: 'No consent records found for this user'
                });
                return;
            }
            const response = {
                success: true,
                message: 'Consent audit trail retrieved successfully',
                data: {
                    auditTrail: [userConsent]
                }
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error getting consent audit:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.default = new ConsentController();
//# sourceMappingURL=ConsentController.js.map