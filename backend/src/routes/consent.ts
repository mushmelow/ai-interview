import express from 'express';
import ConsentController from '../controllers/ConsentController';

const router = express.Router();

// POST /api/consent - Submit user consent
router.post('/', ConsentController.createConsent);

// GET /api/consent/:userId - Retrieve consent for a specific user
router.get('/:userId', ConsentController.getConsent);

// DELETE /api/consent/:userId - Withdraw consent for a specific user
router.delete('/:userId', ConsentController.withdrawConsent);

// GET /api/consent/audit/:userId - Retrieve audit trail for a specific user
router.get('/audit/:userId', ConsentController.getConsentAudit);

export default router;