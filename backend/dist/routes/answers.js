"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AnswerController_1 = __importDefault(require("../controllers/AnswerController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const answerController = new AnswerController_1.default();
router.use(auth_1.optionalAuth);
router.post('/submit', answerController.submitAnswer);
router.get('/session/:sessionId', answerController.getSessionAnswers);
router.get('/question/:questionId', answerController.getQuestionAnswer);
exports.default = router;
//# sourceMappingURL=answers.js.map