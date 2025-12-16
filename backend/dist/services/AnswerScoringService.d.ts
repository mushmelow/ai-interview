export interface AnswerScore {
    score: number;
    feedback: string;
    reasoning?: string;
}
declare class AnswerScoringService {
    private openaiApiKey;
    private openaiApiUrl;
    constructor();
    scoreAnswer(question: string, answer: string, expectedKeywords?: string[], category?: string, difficulty?: string): Promise<AnswerScore>;
    private scoreWithOpenAI;
    private scoreWithOllama;
    private buildScoringPrompt;
    private parseScoringResponse;
}
declare const _default: AnswerScoringService;
export default _default;
//# sourceMappingURL=AnswerScoringService.d.ts.map