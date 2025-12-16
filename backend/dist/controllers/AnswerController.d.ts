import { Request, Response } from 'express';
declare class AnswerController {
    submitAnswer: (req: Request, res: Response) => Promise<void>;
    getSessionAnswers: (req: Request, res: Response) => Promise<void>;
    getQuestionAnswer: (req: Request, res: Response) => Promise<void>;
}
export default AnswerController;
//# sourceMappingURL=AnswerController.d.ts.map