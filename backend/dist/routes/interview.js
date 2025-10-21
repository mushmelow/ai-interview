"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `interview-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});
const interviews = [];
router.post('/start', (req, res) => {
    try {
        const { userId, title, description } = req.body;
        const newInterview = {
            id: interviews.length + 1,
            userId: userId,
            title: title || 'Interview Session',
            description: description || '',
            status: 'started',
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            videoFile: null,
            audioFile: null,
            transcript: null,
            analysis: null
        };
        interviews.push(newInterview);
        const response = {
            success: true,
            message: 'Interview session started',
            data: {
                interview: newInterview
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Start interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/:interviewId/end', (req, res) => {
    try {
        const { interviewId } = req.params;
        const interview = interviews.find(i => i.id == parseInt(interviewId));
        if (!interview) {
            res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
            return;
        }
        const endTime = new Date();
        const startTime = new Date(interview.startTime);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        interview.status = 'completed';
        interview.endTime = endTime.toISOString();
        interview.duration = duration;
        const response = {
            success: true,
            message: 'Interview session ended',
            data: {
                interview: interview
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('End interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/:interviewId/upload', upload.single('recording'), (req, res) => {
    try {
        const { interviewId } = req.params;
        const interview = interviews.find(i => i.id == parseInt(interviewId));
        if (!interview) {
            res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
            return;
        }
        const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'audio';
        if (fileType === 'video') {
            interview.videoFile = req.file.filename;
        }
        else {
            interview.audioFile = req.file.filename;
        }
        const response = {
            success: true,
            message: `${fileType} file uploaded successfully`,
            data: {
                filename: req.file.filename,
                fileType: fileType,
                size: req.file.size
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userInterviews = interviews.filter(i => i.userId == parseInt(userId));
        const response = {
            success: true,
            message: 'User interviews retrieved successfully',
            data: {
                interviews: userInterviews
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:interviewId', (req, res) => {
    try {
        const { interviewId } = req.params;
        const interview = interviews.find(i => i.id == parseInt(interviewId));
        if (!interview) {
            res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
            return;
        }
        const response = {
            success: true,
            message: 'Interview retrieved successfully',
            data: {
                interview: interview
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get interview error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/', (req, res) => {
    try {
        const response = {
            success: true,
            message: 'All interviews retrieved successfully',
            data: {
                interviews: interviews
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Get all interviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=interview.js.map