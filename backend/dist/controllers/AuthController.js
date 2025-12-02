"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../database/models/User"));
const logger = {
    info: (message) => console.log(message),
    error: (message) => console.error(message)
};
class AuthController {
    constructor() {
        console.log('AuthController constructor called');
        this.jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
        this.jwtExpire = process.env.JWT_EXPIRE || '7d';
        console.log('JWT Secret set:', this.jwtSecret ? 'Yes' : 'No');
    }
    getJwtSecret() {
        return this.jwtSecret || process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
    }
    getJwtExpire() {
        return this.jwtExpire || process.env.JWT_EXPIRE || '7d';
    }
    async register(req, res) {
        try {
            console.log('Register endpoint called');
            const { email, password, role = 'candidate' } = req.body;
            console.log('Request data:', { email, role });
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
                return;
            }
            const existingUser = await User_1.default.findByEmail(email);
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
                return;
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const user = await User_1.default.create({ email, passwordHash, role });
            const token = jsonwebtoken_1.default.sign({
                userId: user.id,
                email: user.email,
                role: user.role
            }, this.getJwtSecret(), { expiresIn: this.getJwtExpire() });
            logger.info(`User registered: ${email}`);
            const response = {
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt
                    },
                    token
                }
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Registration error details:', error);
            logger.error(`Error in user registration: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async login(req, res) {
        try {
            console.log('Login endpoint called with:', { email: req.body.email });
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
                return;
            }
            console.log('Looking for user with email:', email);
            const user = await User_1.default.findByEmail(email);
            console.log('User found:', user ? 'Yes' : 'No');
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }
            const token = jsonwebtoken_1.default.sign({
                userId: user.id,
                email: user.email,
                role: user.role
            }, this.getJwtSecret(), { expiresIn: this.getJwtExpire() });
            logger.info(`User logged in: ${email}`);
            const response = {
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt
                    },
                    token
                }
            };
            res.json(response);
        }
        catch (error) {
            console.error('Login error details:', error);
            logger.error(`Error in user login: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            const user = await User_1.default.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const response = {
                success: true,
                message: 'Profile retrieved successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    }
                }
            };
            res.json(response);
        }
        catch (error) {
            logger.error(`Error getting user profile: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const { email, password } = req.body;
            const updateData = {};
            if (email)
                updateData.email = email;
            if (password) {
                updateData.password_hash = await bcryptjs_1.default.hash(password, 10);
            }
            const updatedUser = await User_1.default.update(userId, updateData);
            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            logger.info(`User profile updated: ${updatedUser.email}`);
            const response = {
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        role: updatedUser.role,
                        createdAt: updatedUser.createdAt,
                        updatedAt: updatedUser.updatedAt
                    }
                }
            };
            res.json(response);
        }
        catch (error) {
            logger.error(`Error updating user profile: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async logout(req, res) {
        try {
            logger.info(`User logged out: ${req.user.email}`);
            const response = {
                success: true,
                message: 'Logout successful'
            };
            res.json(response);
        }
        catch (error) {
            logger.error(`Error in user logout: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=AuthController.js.map