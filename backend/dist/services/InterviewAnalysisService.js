"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
class InterviewAnalysisService {
    constructor() {
        this.pool = new pg_1.Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432', 10),
        });
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.openaiApiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    }
    async analyzeInterview(interviewId, recordingPath, questions) {
        try {
            console.log(`Starting analysis for interview ${interviewId}`);
            const transcript = await this.transcribeAudio(recordingPath);
            console.log('Transcript generated:', transcript.substring(0, 100) + '...');
            const analysis = await this.performAIAnalysis(transcript, questions);
            const metrics = this.calculateMetrics(transcript, recordingPath);
            const result = {
                id: generateId(),
                interviewId,
                transcript,
                sentiment: analysis.sentiment,
                confidence: analysis.confidence,
                emotions: analysis.emotions,
                keywords: analysis.keywords,
                answerQuality: analysis.answerQuality,
                feedback: analysis.feedback,
                analysisMetadata: {
                    duration: metrics.duration,
                    wordCount: metrics.wordCount,
                    speakingRate: metrics.speakingRate,
                    pauseFrequency: metrics.pauseFrequency,
                    analyzedAt: new Date()
                }
            };
            await this.saveAnalysisResult(result);
            console.log(`Analysis completed for interview ${interviewId}`);
            return result;
        }
        catch (error) {
            console.error('Error analyzing interview:', error);
            throw error;
        }
    }
    async transcribeAudio(recordingPath) {
        try {
            if (this.openaiApiKey) {
                return await this.transcribeWithOpenAI(recordingPath);
            }
            else {
                return await this.transcribeWithFallback(recordingPath);
            }
        }
        catch (error) {
            console.error('Transcription error:', error);
            return await this.transcribeWithFallback(recordingPath);
        }
    }
    async transcribeWithOpenAI(recordingPath) {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const formData = new FormData();
        const fileBuffer = fs_1.default.readFileSync(recordingPath);
        const blob = new Blob([fileBuffer], { type: 'audio/webm' });
        formData.append('file', blob, 'recording.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
            },
            body: formData
        });
        if (!response.ok) {
            throw new Error(`OpenAI transcription failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data.text || '';
    }
    async transcribeWithFallback(recordingPath) {
        console.log('Using fallback transcription for:', recordingPath);
        const mockTranscriptions = [
            "Hello, thank you for this opportunity. I'm excited to discuss my experience with React and JavaScript development. I have been working with these technologies for over three years, and I've built several web applications including e-commerce platforms and data visualization tools. I'm particularly interested in this role because it allows me to work on challenging problems and collaborate with a talented team.",
            "I would approach this technical challenge by first understanding the requirements clearly, then breaking down the problem into smaller components. I would start by researching the best practices and existing solutions, then create a prototype to validate my approach. Throughout the process, I would maintain clean code practices and ensure proper testing.",
            "In my previous role, I successfully led a project that improved our application's performance by 40%. The challenge was that our database queries were taking too long. I implemented database indexing, optimized our queries, and introduced caching mechanisms. The result was a significant improvement in user experience and reduced server costs."
        ];
        return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    }
    async performAIAnalysis(transcript, questions) {
        if (this.openaiApiKey) {
            return await this.analyzeWithOpenAI(transcript, questions);
        }
        else {
            return this.analyzeWithFallback(transcript, questions);
        }
    }
    async analyzeWithOpenAI(transcript, questions) {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const prompt = this.constructAnalysisPrompt(transcript, questions);
        try {
            const response = await fetch(this.openaiApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 2000,
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`OpenAI analysis failed: ${data.error?.message || 'Unknown error'}`);
            }
            return this.parseAIAnalysisResponse(data.choices[0].message.content);
        }
        catch (error) {
            console.error('OpenAI analysis error:', error);
            return this.analyzeWithFallback(transcript, questions);
        }
    }
    analyzeWithFallback(transcript, questions) {
        console.log('Using fallback analysis');
        const wordCount = transcript.split(' ').length;
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const keywords = this.extractKeywords(transcript);
        const positiveWords = ['excellent', 'great', 'successful', 'improved', 'excited', 'interested', 'challenging', 'talented'];
        const negativeWords = ['difficult', 'problem', 'issue', 'failed', 'struggled', 'challenging'];
        const positiveCount = positiveWords.filter(word => transcript.toLowerCase().includes(word)).length;
        const negativeCount = negativeWords.filter(word => transcript.toLowerCase().includes(word)).length;
        let sentiment = 'neutral';
        if (positiveCount > negativeCount)
            sentiment = 'positive';
        else if (negativeCount > positiveCount)
            sentiment = 'negative';
        const relevanceScore = this.calculateRelevanceScore(transcript, questions);
        const completenessScore = this.calculateCompletenessScore(transcript, questions);
        const clarityScore = this.calculateClarityScore(transcript);
        const technicalScore = this.calculateTechnicalScore(transcript, questions);
        return {
            sentiment,
            confidence: 0.75,
            emotions: ['confident', 'professional', 'enthusiastic'],
            keywords,
            answerQuality: {
                relevance: relevanceScore,
                completeness: completenessScore,
                clarity: clarityScore,
                technicalAccuracy: technicalScore,
                overallScore: Math.round((relevanceScore + completenessScore + clarityScore + technicalScore) / 4)
            },
            feedback: {
                strengths: this.generateStrengths(transcript),
                improvements: this.generateImprovements(transcript),
                suggestions: this.generateSuggestions(transcript, questions)
            }
        };
    }
    constructAnalysisPrompt(transcript, questions) {
        const questionsText = questions.map((q, i) => `${i + 1}. ${q.question}\n   Expected keywords: ${q.expectedKeywords.join(', ')}\n   Category: ${q.category}\n   Difficulty: ${q.difficulty}`).join('\n\n');
        return `Analyze this interview transcript and provide a comprehensive evaluation:

TRANSCRIPT:
"${transcript}"

QUESTIONS ASKED:
${questionsText}

Please provide a JSON response with the following structure:
{
  "sentiment": "positive|neutral|negative",
  "confidence": 0.0-1.0,
  "emotions": ["emotion1", "emotion2", "emotion3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "answerQuality": {
    "relevance": 0-100,
    "completeness": 0-100,
    "clarity": 0-100,
    "technicalAccuracy": 0-100,
    "overallScore": 0-100
  },
  "feedback": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "suggestions": ["suggestion1", "suggestion2"]
  }
}

Evaluate based on:
1. How well the answers address the questions
2. Use of relevant technical terms and concepts
3. Clarity and structure of responses
4. Completeness of answers
5. Professional communication style
6. Problem-solving approach demonstrated`;
    }
    parseAIAnalysisResponse(content) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No valid JSON found in response');
        }
        catch (error) {
            console.error('Error parsing AI analysis response:', error);
            throw new Error('Invalid AI analysis response format');
        }
    }
    calculateMetrics(transcript, recordingPath) {
        const wordCount = transcript.split(' ').length;
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const duration = 120;
        const speakingRate = wordCount / (duration / 60);
        const pauseFrequency = sentences.length / (duration / 60);
        return {
            duration,
            wordCount,
            speakingRate: Math.round(speakingRate),
            pauseFrequency: Math.round(pauseFrequency * 10) / 10
        };
    }
    extractKeywords(transcript) {
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
        const words = transcript.toLowerCase().split(/\W+/).filter(word => word.length > 3 && !commonWords.includes(word));
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        return Object.entries(wordCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }
    calculateRelevanceScore(transcript, questions) {
        let totalScore = 0;
        questions.forEach(question => {
            const expectedKeywords = question.expectedKeywords;
            const foundKeywords = expectedKeywords.filter(keyword => transcript.toLowerCase().includes(keyword.toLowerCase()));
            totalScore += (foundKeywords.length / expectedKeywords.length) * 100;
        });
        return Math.round(totalScore / questions.length);
    }
    calculateCompletenessScore(transcript, questions) {
        const avgWordsPerAnswer = transcript.split(' ').length / questions.length;
        if (avgWordsPerAnswer >= 50)
            return 90;
        if (avgWordsPerAnswer >= 30)
            return 75;
        if (avgWordsPerAnswer >= 20)
            return 60;
        return 40;
    }
    calculateClarityScore(transcript) {
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = transcript.split(' ').length / sentences.length;
        if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20)
            return 90;
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25)
            return 75;
        if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 30)
            return 60;
        return 40;
    }
    calculateTechnicalScore(transcript, questions) {
        const technicalTerms = ['algorithm', 'database', 'api', 'framework', 'architecture', 'optimization', 'performance', 'scalability', 'testing', 'debugging', 'code', 'function', 'method', 'class', 'object', 'variable', 'loop', 'condition', 'recursion', 'iteration'];
        const foundTerms = technicalTerms.filter(term => transcript.toLowerCase().includes(term.toLowerCase()));
        return Math.min(100, Math.round((foundTerms.length / technicalTerms.length) * 100));
    }
    generateStrengths(transcript) {
        const strengths = [];
        if (transcript.length > 200)
            strengths.push('Provided detailed responses');
        if (transcript.includes('experience') || transcript.includes('worked'))
            strengths.push('Demonstrated relevant experience');
        if (transcript.includes('challenge') || transcript.includes('problem'))
            strengths.push('Showed problem-solving approach');
        if (transcript.includes('team') || transcript.includes('collaborate'))
            strengths.push('Emphasized teamwork');
        return strengths.length > 0 ? strengths : ['Clear communication', 'Professional demeanor'];
    }
    generateImprovements(transcript) {
        const improvements = [];
        if (transcript.length < 100)
            improvements.push('Provide more detailed examples');
        if (!transcript.includes('specific') && !transcript.includes('example'))
            improvements.push('Include specific examples');
        if (!transcript.includes('result') && !transcript.includes('outcome'))
            improvements.push('Mention measurable results');
        return improvements.length > 0 ? improvements : ['Consider providing more technical details', 'Add specific examples'];
    }
    generateSuggestions(transcript, questions) {
        return [
            'Practice structuring answers using STAR method (Situation, Task, Action, Result)',
            'Prepare specific examples for common technical questions',
            'Research the company and role to provide more targeted responses',
            'Practice explaining technical concepts in simple terms'
        ];
    }
    async saveAnalysisResult(result) {
        const query = `
            INSERT INTO interview_analyses (
                id, interview_id, transcript, sentiment, confidence, emotions, keywords,
                relevance_score, completeness_score, clarity_score, technical_score, overall_score,
                strengths, improvements, suggestions, duration, word_count, speaking_rate, pause_frequency, analyzed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;
        const values = [
            result.id,
            result.interviewId,
            result.transcript,
            result.sentiment,
            result.confidence,
            result.emotions,
            result.keywords,
            result.answerQuality.relevance,
            result.answerQuality.completeness,
            result.answerQuality.clarity,
            result.answerQuality.technicalAccuracy,
            result.answerQuality.overallScore,
            result.feedback.strengths,
            result.feedback.improvements,
            result.feedback.suggestions,
            result.analysisMetadata.duration,
            result.analysisMetadata.wordCount,
            result.analysisMetadata.speakingRate,
            result.analysisMetadata.pauseFrequency,
            result.analysisMetadata.analyzedAt
        ];
        await this.pool.query(query, values);
    }
    async getAnalysisResult(interviewId) {
        const query = `
            SELECT * FROM interview_analyses 
            WHERE interview_id = $1 
            ORDER BY analyzed_at DESC 
            LIMIT 1
        `;
        const result = await this.pool.query(query, [interviewId]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            interviewId: row.interview_id,
            transcript: row.transcript,
            sentiment: row.sentiment,
            confidence: row.confidence,
            emotions: row.emotions,
            keywords: row.keywords,
            answerQuality: {
                relevance: row.relevance_score,
                completeness: row.completeness_score,
                clarity: row.clarity_score,
                technicalAccuracy: row.technical_score,
                overallScore: row.overall_score
            },
            feedback: {
                strengths: row.strengths,
                improvements: row.improvements,
                suggestions: row.suggestions
            },
            analysisMetadata: {
                duration: row.duration,
                wordCount: row.word_count,
                speakingRate: row.speaking_rate,
                pauseFrequency: row.pause_frequency,
                analyzedAt: row.analyzed_at
            }
        };
    }
}
exports.default = InterviewAnalysisService;
//# sourceMappingURL=InterviewAnalysisService.js.map