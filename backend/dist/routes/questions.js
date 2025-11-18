"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const QuestionController_1 = __importDefault(require("../controllers/QuestionController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const questionController = new QuestionController_1.default();
router.use(auth_1.authenticateToken);
router.post('/generate', questionController.generateQuestions);
router.get('/session/:sessionId', questionController.getSessionQuestions);
router.get('/categories', questionController.getCategories);
router.get('/templates', questionController.getTemplates);
exports.default = router;
//# sourceMappingURL=questions.js.map