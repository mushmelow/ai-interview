import { Request, Response } from 'express';
import {
    ConsentRequest,
    ConsentRecord,
    ConsentResponse,
    ApiResponse
} from '../types';

// Simple in-memory consent storage (same as simple-auth.js)
const consents: Record<string, ConsentRecord> = {};

class ConsentController {
    constructor() {
        // No need for ConsentService in this simple implementation
    }

    // Create consent record
    async createConsent(req: Request, res: Response): Promise<void> {
        try {
            const {
                userId,
                consents: consentData,
                ipAddress,
                userAgent,
                timestamp,
                consentVersion
            }: ConsentRequest = req.body;

            // Store consent data
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

            const response: ApiResponse<ConsentResponse> = {
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
        } catch (error: any) {
            console.error('Consent update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get user consent
    async getConsent(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            // Check if user has given consent
            const userConsent = consents[userId];

            const response: ApiResponse<ConsentResponse> = {
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
        } catch (error: any) {
            console.error('Consent check error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Withdraw consent
    async withdrawConsent(req: Request, res: Response): Promise<void> {
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

            const response: ApiResponse = {
                success: true,
                message: 'Consent withdrawn successfully'
            };

            res.json(response);

        } catch (error: any) {
            console.error('Error withdrawing consent:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get consent audit trail
    async getConsentAudit(req: Request, res: Response): Promise<void> {
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

            const response: ApiResponse<{ auditTrail: ConsentRecord[] }> = {
                success: true,
                message: 'Consent audit trail retrieved successfully',
                data: {
                    auditTrail: [userConsent]
                }
            };

            res.json(response);

        } catch (error: any) {
            console.error('Error getting consent audit:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default new ConsentController();
