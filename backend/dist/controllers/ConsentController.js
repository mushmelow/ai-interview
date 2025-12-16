"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Consent = require('../database/models/Consent');
class ConsentController {
    constructor() {
    }
    async createConsent(req, res) {
        try {
            const authenticatedUserId = req.user?.userId;
            const { userId, consents: consentData, ipAddress, userAgent, timestamp, consentVersion } = req.body;
            const finalUserId = authenticatedUserId ? authenticatedUserId.toString() : userId;
            const consent = await Consent.create({
                userId: finalUserId,
                ipAddress: ipAddress || req.ip || 'unknown',
                consents: consentData,
                version: consentVersion || "1.0"
            });
            console.log(`Consent saved to database for user ${finalUserId}:`, consentData);
            const response = {
                success: true,
                message: 'Consent recorded successfully and saved permanently',
                data: {
                    userId: finalUserId,
                    consentGiven: true,
                    consentDate: consent.timestamp,
                    consentVersion: consent.version
                }
            };
            res.json({
                ...response,
                consentId: consent.id.toString(),
                timestamp: consent.timestamp
            });
        }
        catch (error) {
            console.error('Consent update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getConsent(req, res) {
        try {
            const authenticatedUserId = req.user?.userId;
            const { userId } = req.params;
            const finalUserId = authenticatedUserId ? authenticatedUserId.toString() : userId;
            const userConsent = await Consent.findByUserId(finalUserId);
            const hasValidConsent = userConsent ? await Consent.hasValidConsent(finalUserId) : false;
            const response = {
                success: true,
                message: 'Consent status retrieved successfully',
                data: {
                    userId: finalUserId,
                    consentGiven: hasValidConsent,
                    consentDate: userConsent ? userConsent.timestamp : null,
                    consentVersion: userConsent ? userConsent.version : "1.0",
                    consents: userConsent ? userConsent.consents : null
                }
            };
            res.json(response);
        }
        catch (error) {
            console.error('Consent check error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async withdrawConsent(req, res) {
        try {
            const authenticatedUserId = req.user?.userId;
            const { userId } = req.params;
            const finalUserId = authenticatedUserId ? authenticatedUserId.toString() : userId;
            const deleted = await Consent.deleteByUserId(finalUserId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'No consent record found for this user'
                });
                return;
            }
            console.log(`Consent withdrawn for user: ${finalUserId}`);
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
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getConsentAudit(req, res) {
        try {
            const authenticatedUserId = req.user?.userId;
            const { userId } = req.params;
            const finalUserId = authenticatedUserId ? authenticatedUserId.toString() : userId;
            const consentHistory = await Consent.findAllByUserId(finalUserId);
            if (!consentHistory || consentHistory.length === 0) {
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
                    auditTrail: consentHistory.map((consent) => ({
                        userId: consent.userId,
                        consents: consent.consents,
                        consentGiven: true,
                        consentDate: consent.timestamp,
                        consentVersion: consent.version,
                        ipAddress: consent.ipAddress,
                        timestamp: consent.timestamp
                    }))
                }
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error getting consent audit:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}
exports.default = new ConsentController();
//# sourceMappingURL=ConsentController.js.map