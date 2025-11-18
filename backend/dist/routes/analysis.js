"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AnalysisController_1 = __importDefault(require("../controllers/AnalysisController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const analysisController = new AnalysisController_1.default();
router.post('/:interviewId/analyze', auth_1.authenticateToken, analysisController.analyzeInterview);
router.get('/:interviewId/analysis', auth_1.authenticateToken, analysisController.getAnalysisResult);
router.get('/user/analyses', auth_1.authenticateToken, analysisController.getUserAnalysisResults);
router.get('/user/stats', auth_1.authenticateToken, analysisController.getAnalysisStats);
exports.default = router;
//# sourceMappingURL=analysis.js.map