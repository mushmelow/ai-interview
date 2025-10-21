import express, { Request, Response } from 'express';
import AuthController from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', (req: Request, res: Response) => {
    console.log('=== LOGIN ROUTE CALLED ===');
    console.log('Request body:', req.body);
    console.log('========================');
    AuthController.login(req, res);
});

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.post('/logout', authenticateToken, AuthController.logout);

export default router;