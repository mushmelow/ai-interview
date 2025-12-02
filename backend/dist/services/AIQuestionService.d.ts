import { QuestionGenerationRequest, QuestionGenerationResponse, GeneratedQuestion } from '../types/questions';
declare class AIQuestionService {
    private openaiApiKey;
    constructor();
    generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse>;
    getSessionQuestions(sessionId: string): Promise<GeneratedQuestion[]>;
    private generateQuestionsWithAI;
    private generateQuestionsFromTemplates;
    private fillTemplate;
    private getTechnologyForPosition;
    private getScenarioForPosition;
    private getConstraintForLevel;
    private getSituationForType;
    private getDomainForPosition;
    private getCompanyValue;
    private getChallengeForLevel;
    private getSystemForPosition;
    private generateFollowUpQuestions;
    private getExpectedKeywords;
    private getPositionKeywords;
    private buildPrompt;
    private getRoleSpecificContext;
    private getExperienceLevelContext;
    private getCategoryContext;
    private parseAIResponse;
    private extractQuestionsFromText;
    private getRelevantTemplates;
    private createQuestionSession;
    private storeGeneratedQuestions;
    private generateSessionId;
}
export default AIQuestionService;
//# sourceMappingURL=AIQuestionService.d.ts.map