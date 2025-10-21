import { Request, Response } from 'express';
declare class ConsentController {
    constructor();
    createConsent(req: Request, res: Response): Promise<void>;
    getConsent(req: Request, res: Response): Promise<void>;
    withdrawConsent(req: Request, res: Response): Promise<void>;
    getConsentAudit(req: Request, res: Response): Promise<void>;
}
declare const _default: ConsentController;
export default _default;
//# sourceMappingURL=ConsentController.d.ts.map