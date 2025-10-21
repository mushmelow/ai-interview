import { Request, Response } from 'express';
declare class AuthController {
    private jwtSecret;
    private jwtExpire;
    constructor();
    private getJwtSecret;
    private getJwtExpire;
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    getProfile(req: Request, res: Response): Promise<void>;
    updateProfile(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=AuthController.d.ts.map