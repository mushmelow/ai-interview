import { Request, Response } from 'express';
declare class QuestionController {
    private questionService;
    constructor();
    generateQuestions: (req: Request, res: Response) => Promise<void>;
    getSessionQuestions: (req: Request, res: Response) => Promise<void>;
    getCategories: (req: Request, res: Response) => Promise<void>;
    getTemplates: (req: Request, res: Response) => Promise<void>;
}
export default QuestionController;
//# sourceMappingURL=QuestionController.d.ts.map