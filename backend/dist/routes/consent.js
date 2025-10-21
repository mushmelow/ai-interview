"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ConsentController_1 = __importDefault(require("../controllers/ConsentController"));
const router = express_1.default.Router();
router.post('/', ConsentController_1.default.createConsent);
router.get('/:userId', ConsentController_1.default.getConsent);
router.delete('/:userId', ConsentController_1.default.withdrawConsent);
router.get('/audit/:userId', ConsentController_1.default.getConsentAudit);
exports.default = router;
//# sourceMappingURL=consent.js.map