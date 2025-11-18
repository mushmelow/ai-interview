// Question types and categories
export interface QuestionCategory {
    id: string;
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface QuestionTemplate {
    id: string;
    category: string;
    type: 'behavioral' | 'technical' | 'situational' | 'cultural';
    template: string;
    variables: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedQuestion {
    id: string;
    question: string;
    category: string;
    type: string;
    difficulty: string;
    context?: string;
    followUpQuestions?: string[];
    expectedKeywords?: string[];
}

export interface QuestionGenerationRequest {
    userId: number;
    position: string;
    experienceLevel: 'entry' | 'mid' | 'senior';
    categories: string[];
    numberOfQuestions: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    customContext?: string;
}

export interface QuestionGenerationResponse {
    success: boolean;
    questions: GeneratedQuestion[];
    sessionId: string;
    metadata: {
        position: string;
        experienceLevel: string;
        categories: string[];
        generatedAt: string;
    };
}
