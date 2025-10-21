"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const interviews = [];
const consents = {};
router.post('/clear-all', (req, res) => {
    try {
        interviews.length = 0;
        Object.keys(consents).forEach(key => delete consents[key]);
        console.log('🗑️ All data cleared. Default admin user preserved.');
        const response = {
            success: true,
            message: 'All data cleared successfully. Default admin user preserved.',
            data: {
                interviewsCount: interviews.length,
                consentsCount: Object.keys(consents).length
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Clear data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/stats', (req, res) => {
    try {
        const stats = {
            usersCount: 0,
            interviewsCount: interviews.length,
            consentsCount: Object.keys(consents).length,
            users: [],
            interviews: interviews.map(i => ({
                id: i.id,
                userId: i.userId,
                title: i.title,
                status: i.status
            })),
            consents: Object.keys(consents).map(key => ({
                userId: key,
                consentGiven: consents[key].consentGiven
            }))
        };
        const response = {
            success: true,
            message: 'Admin stats retrieved successfully',
            data: stats
        };
        res.json(response);
    }
    catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map