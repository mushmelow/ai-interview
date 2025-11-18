import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../database/models/User';
import {
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    ApiResponse,
    JWTPayload
} from '../types';

// Simple logger interface
interface Logger {
    info: (message: string) => void;
    error: (message: string) => void;
}

const logger: Logger = {
    info: (message: string) => console.log(message),
    error: (message: string) => console.error(message)
};

class AuthController {
    private jwtSecret: string;
    private jwtExpire: string;

    constructor() {
        console.log('AuthController constructor called');
        this.jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
        this.jwtExpire = process.env.JWT_EXPIRE || '7d';
        console.log('JWT Secret set:', this.jwtSecret ? 'Yes' : 'No');
    }

    // Get JWT secret with fallback
    private getJwtSecret(): string {
        return this.jwtSecret || process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
    }

    // Get JWT expire with fallback
    private getJwtExpire(): string {
        return this.jwtExpire || process.env.JWT_EXPIRE || '7d';
    }

    // Register new user
    async register(req: Request, res: Response): Promise<void> {
        try {
            console.log('Register endpoint called');
            const { email, password, role = 'candidate' }: RegisterRequest = req.body;
            console.log('Request data:', { email, role });

            // Validate input
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
                return;
            }

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
                return;
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create new user
            const user = await User.create({ email, passwordHash, role });

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                this.getJwtSecret(),
                { expiresIn: this.getJwtExpire() } as SignOptions
            );

            logger.info(`User registered: ${email}`);

            const response: ApiResponse<AuthResponse> = {
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

        } catch (error: any) {
            console.error('Registration error details:', error);
            logger.error(`Error in user registration: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Login user
    async login(req: Request, res: Response): Promise<void> {
        try {
            console.log('Login endpoint called with:', { email: req.body.email });
            const { email, password }: LoginRequest = req.body;

            // Validate input
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
                return;
            }

            // Find user by email
            console.log('Looking for user with email:', email);
            const user = await User.findByEmail(email);
            console.log('User found:', user ? 'Yes' : 'No');
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                this.getJwtSecret(),
                { expiresIn: this.getJwtExpire() } as SignOptions
            );

            logger.info(`User logged in: ${email}`);

            const response: ApiResponse<AuthResponse> = {
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

        } catch (error: any) {
            console.error('Login error details:', error);
            logger.error(`Error in user login: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get current user profile
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const user = await User.findById(userId);

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            const response: ApiResponse<{ user: UserResponse }> = {
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

        } catch (error: any) {
            logger.error(`Error getting user profile: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update user profile
    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { email, password } = req.body;

            const updateData: any = {};
            if (email) updateData.email = email;
            if (password) {
                // Hash the password before updating
                updateData.password_hash = await bcrypt.hash(password, 10);
            }

            const updatedUser = await User.update(userId, updateData);

            if (!updatedUser) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            logger.info(`User profile updated: ${updatedUser.email}`);

            const response: ApiResponse<{ user: UserResponse }> = {
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

        } catch (error: any) {
            logger.error(`Error updating user profile: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Logout user (client-side token removal)
    async logout(req: Request, res: Response): Promise<void> {
        try {
            // In a more sophisticated setup, you might want to blacklist the token
            // For now, we'll just return a success message
            logger.info(`User logged out: ${(req as any).user.email}`);

            const response: ApiResponse = {
                success: true,
                message: 'Logout successful'
            };

            res.json(response);

        } catch (error: any) {
            logger.error(`Error in user logout: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default new AuthController();
