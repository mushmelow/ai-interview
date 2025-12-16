"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AnswerScoringService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.openaiApiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    }
    async scoreAnswer(question, answer, expectedKeywords, category, difficulty) {
        try {
            if (this.openaiApiKey) {
                return await this.scoreWithOpenAI(question, answer, expectedKeywords, category, difficulty);
            }
            return await this.scoreWithOllama(question, answer, expectedKeywords, category, difficulty);
        }
        catch (error) {
            console.error('Error scoring answer:', error);
            return {
                score: 5.0,
                feedback: 'Unable to generate AI score. Answer received.',
                reasoning: 'Scoring service unavailable'
            };
        }
    }
    async scoreWithOpenAI(question, answer, expectedKeywords, category, difficulty) {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const prompt = this.buildScoringPrompt(question, answer, expectedKeywords, category, difficulty);
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
                    max_tokens: 500,
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`OpenAI scoring failed: ${data.error?.message || 'Unknown error'}`);
            }
            return this.parseScoringResponse(data.choices[0].message.content);
        }
        catch (error) {
            console.error('OpenAI scoring error:', error);
            throw error;
        }
    }
    async scoreWithOllama(question, answer, expectedKeywords, category, difficulty) {
        const prompt = this.buildScoringPrompt(question, answer, expectedKeywords, category, difficulty);
        const models = ['llama3.2:1b', 'phi3:mini', 'llama2', 'mistral:7b'];
        let response;
        let lastError;
        for (const model of models) {
            try {
                response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: model,
                        prompt: prompt,
                        stream: false,
                        options: {
                            temperature: 0.3,
                            max_tokens: 500
                        }
                    })
                });
                if (response.ok) {
                    console.log(`✅ Using Ollama model for scoring: ${model}`);
                    break;
                }
                else {
                    const errorData = await response.json();
                    lastError = errorData.error || `HTTP ${response.status}`;
                }
            }
            catch (error) {
                lastError = error.message;
            }
        }
        if (!response || !response.ok) {
            throw new Error(`All Ollama models failed. Last error: ${lastError}`);
        }
        const data = await response.json();
        const content = data.response || '';
        return this.parseScoringResponse(content);
    }
    buildScoringPrompt(question, answer, expectedKeywords, category, difficulty) {
        const keywordsText = expectedKeywords && expectedKeywords.length > 0
            ? `Expected keywords: ${expectedKeywords.join(', ')}`
            : '';
        const categoryText = category ? `Category: ${category}` : '';
        const difficultyText = difficulty ? `Difficulty: ${difficulty}` : '';
        return `You are an expert interviewer evaluating a candidate's answer. Score the answer from 0 to 10.

QUESTION:
"${question}"

${categoryText ? categoryText + '\n' : ''}${difficultyText ? difficultyText + '\n' : ''}${keywordsText ? keywordsText + '\n' : ''}

ANSWER:
"${answer}"

Evaluate the answer based on:
1. Relevance: Does it directly address the question?
2. Completeness: Is the answer thorough and complete?
3. Clarity: Is the answer clear and well-structured?
4. Technical accuracy: Are technical details correct (if applicable)?
5. Depth: Does it show understanding beyond surface level?

Return ONLY a valid JSON object with this exact structure:
{
  "score": 7.5,
  "feedback": "Brief feedback on strengths and areas for improvement",
  "reasoning": "Brief explanation of the score"
}

The score must be a number between 0 and 10 (can include one decimal place).
Score guidelines:
- 0-2: Completely irrelevant or no answer
- 3-4: Partially relevant but incomplete
- 5-6: Relevant but basic, missing key points
- 7-8: Good answer, addresses most points
- 9-10: Excellent answer, comprehensive and insightful

Return ONLY the JSON, no other text.`;
    }
    parseScoringResponse(content) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const score = Math.max(0, Math.min(10, parseFloat(parsed.score) || 5.0));
                return {
                    score: Math.round(score * 10) / 10,
                    feedback: parsed.feedback || 'Answer evaluated',
                    reasoning: parsed.reasoning
                };
            }
            const scoreMatch = content.match(/score["\s:]*([0-9.]+)/i);
            if (scoreMatch) {
                const score = Math.max(0, Math.min(10, parseFloat(scoreMatch[1]) || 5.0));
                return {
                    score: Math.round(score * 10) / 10,
                    feedback: content.substring(0, 200) || 'Answer evaluated',
                    reasoning: 'Extracted from text response'
                };
            }
            return {
                score: 5.0,
                feedback: 'Unable to parse AI response',
                reasoning: 'Response parsing failed'
            };
        }
        catch (error) {
            console.error('Error parsing scoring response:', error);
            return {
                score: 5.0,
                feedback: 'Error parsing AI response',
                reasoning: 'Parsing error'
            };
        }
    }
}
exports.default = new AnswerScoringService();
//# sourceMappingURL=AnswerScoringService.js.map