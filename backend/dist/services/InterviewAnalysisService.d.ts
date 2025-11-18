export interface AnalysisResult {
    id: string;
    interviewId: number;
    transcript: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: string[];
    keywords: string[];
    answerQuality: {
        relevance: number;
        completeness: number;
        clarity: number;
        technicalAccuracy: number;
        overallScore: number;
    };
    feedback: {
        strengths: string[];
        improvements: string[];
        suggestions: string[];
    };
    analysisMetadata: {
        duration: number;
        wordCount: number;
        speakingRate: number;
        pauseFrequency: number;
        analyzedAt: Date;
    };
}
export interface QuestionAnswerPair {
    question: string;
    expectedKeywords: string[];
    answer?: string;
    category: string;
    difficulty: string;
    type?: string;
}
declare class InterviewAnalysisService {
    private pool;
    private openaiApiKey;
    private openaiApiUrl;
    constructor();
    analyzeInterview(interviewId: number, recordingPath: string, questions: QuestionAnswerPair[]): Promise<AnalysisResult>;
    private transcribeAudio;
    private transcribeWithOpenAI;
    private transcribeWithFallback;
    private performAIAnalysis;
    private analyzeWithOpenAI;
    private analyzeWithFallback;
    private constructAnalysisPrompt;
    private parseAIAnalysisResponse;
    private calculateMetrics;
    private extractKeywords;
    private calculateRelevanceScore;
    private calculateCompletenessScore;
    private calculateClarityScore;
    private calculateTechnicalScore;
    private generateStrengths;
    private generateImprovements;
    private generateSuggestions;
    private saveAnalysisResult;
    getAnalysisResult(interviewId: number): Promise<AnalysisResult | null>;
}
export default InterviewAnalysisService;
//# sourceMappingURL=InterviewAnalysisService.d.ts.map