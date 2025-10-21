"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const consent_1 = __importDefault(require("./routes/consent"));
const auth_1 = __importDefault(require("./routes/auth"));
const interview_1 = __importDefault(require("./routes/interview"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const logger = {
    info: (message) => console.log(message)
};
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3001', 10);
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3005'
}));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const uploadsDir = path_1.default.join(__dirname, '../uploads');
app.use('/uploads', express_1.default.static(uploadsDir));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});
app.get('/api/test', (req, res) => {
    res.status(200).json({
        message: 'Backend is working!',
        timestamp: new Date()
    });
});
app.use('/api/consent', consent_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/interviews', interview_1.default);
app.use('/api/admin', admin_1.default);
app.use(errorHandler_1.default);
app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    logger.info(`🔒 Consent API: http://localhost:${PORT}/api/consent`);
    logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    logger.info(`🎥 Interview API: http://localhost:${PORT}/api/interviews`);
    logger.info(`🔧 Admin API: http://localhost:${PORT}/api/admin`);
});
exports.default = app;
//# sourceMappingURL=app.js.map