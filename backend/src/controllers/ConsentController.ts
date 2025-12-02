import { Request, Response } from 'express';
import {
    ConsentRequest,
    ConsentRecord,
    ConsentResponse,
    ApiResponse
} from '../types';
const Consent = require('../database/models/Consent');

class ConsentController {
    constructor() {
        // Using database Consent model for persistent storage
    }

    // Create consent record - saves to database permanently
    async createConsent(req: Request, res: Response): Promise<void> {
        try {
            // Get authenticated user ID from JWT token (if available)
            const authenticatedUserId = (req as any).user?.userId;

            const {
                userId,
                consents: consentData,
                ipAddress,
                userAgent,
                timestamp,
                consentVersion
            }: ConsentRequest = req.body;

            // Use authenticated user ID if available, otherwise use provided userId
            const finalUserId = authenticatedUserId ? authenticatedUserId.toString() : userId;

            // Save to database permanently
            const consent = await Consent.create({
                userId: finalUserId,
                ipAddress: ipAddress || req.ip || 'unknown',
                consents: consentData,
                version: consentVersion || "1.0"
            });

            console.log(`Consent saved to database for user ${finalUserId}:`, consentData);

            const response: ApiResponse<ConsentResponse> = {
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
        } catch (error: any) {
            console.error('Consent update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get user consent - loads from database
    async getConsent(req: Request, res: Response): Promise<void> {
        try {
            // Get authenticated user ID from JWT token (if available)
            const authenticatedUserId = (req as any).user?.userId;
            const { userId } = req.params;

            // Use authenticated user ID if available, otherwise use provided userId
            const finalUserId = authenticatedUserId ? authenticatedUserId.toString() : userId;

            // Load from database
            const userConsent = await Consent.findByUserId(finalUserId);

            // Check if all required consents are given
            const hasValidConsent = userConsent ? await Consent.hasValidConsent(finalUserId) : false;

            const response: ApiResponse<ConsentResponse> = {
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
        } catch (error: any) {
            console.error('Consent check error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Withdraw consent - removes from database
    async withdrawConsent(req: Request, res: Response): Promise<void> {
        try {
            // Get authenticated user ID from JWT token (if available)
            const authenticatedUserId = (req as any).user?.userId;
            const { userId } = req.params;

            // Use authenticated user ID if available, otherwise use provided userId
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

            const response: ApiResponse = {
                success: true,
                message: 'Consent withdrawn successfully'
            };

            res.json(response);

        } catch (error: any) {
            console.error('Error withdrawing consent:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get consent audit trail - loads from database
    async getConsentAudit(req: Request, res: Response): Promise<void> {
        try {
            // Get authenticated user ID from JWT token (if available)
            const authenticatedUserId = (req as any).user?.userId;
            const { userId } = req.params;

            // Use authenticated user ID if available, otherwise use provided userId
            const finalUserId = authenticatedUserId ? authenticatedUserId.toString() : userId;

            const consentHistory = await Consent.findAllByUserId(finalUserId);

            if (!consentHistory || consentHistory.length === 0) {
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
                    auditTrail: consentHistory.map((consent: any) => ({
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

        } catch (error: any) {
            console.error('Error getting consent audit:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

export default new ConsentController();
