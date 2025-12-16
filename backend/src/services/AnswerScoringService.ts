// Note: AnswerScoringService doesn't need database connection
// import { query } from '../database/connection';

export interface AnswerScore {
    score: number; // 0-10
    feedback: string;
    reasoning?: string;
    strengths?: string[];
    improvements?: string[];
    suggestions?: string[];
}

class AnswerScoringService {
    private openaiApiKey: string | undefined;
    private openaiApiUrl: string;

    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.openaiApiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    }

    /**
     * Score an answer from 0-10 based on quality, relevance, completeness, etc.
     */
    async scoreAnswer(question: string, answer: string, expectedKeywords?: string[], category?: string, difficulty?: string): Promise<AnswerScore> {
        try {
            console.log('Starting answer scoring...');
            console.log('Question:', question.substring(0, 100));
            console.log('Answer length:', answer.length);
            console.log('Expected keywords:', expectedKeywords);
            
            let result;
            // Try OpenAI first if available
            if (this.openaiApiKey) {
                console.log('Using OpenAI for scoring');
                result = await this.scoreWithOpenAI(question, answer, expectedKeywords, category, difficulty);
            } else {
                // Fallback to Ollama
                console.log('Using Ollama for scoring');
                result = await this.scoreWithOllama(question, answer, expectedKeywords, category, difficulty);
            }
            
            console.log('Scoring result:', { 
                score: result.score, 
                feedbackLength: result.feedback.length,
                hasReasoning: !!result.reasoning,
                strengthsCount: result.strengths?.length || 0,
                improvementsCount: result.improvements?.length || 0
            });
            
            // Validate that we got a real AI response, not a default
            if (result.reasoning === 'Scoring service unavailable, using default feedback') {
                console.error('❌ ERROR: Got default score - AI scoring failed!');
                throw new Error('AI scoring failed - received default response. Check Ollama connection.');
            }
            
            // Warn if score is exactly 5.0 (might be suspicious)
            if (result.score === 5.0) {
                console.warn('⚠️ Score is exactly 5.0. Reasoning:', result.reasoning?.substring(0, 100));
                // Check if feedback is generic
                const genericIndicators = ['addresses the question', 'could benefit from', 'consider expanding'];
                const isGeneric = genericIndicators.some(phrase => 
                    result.feedback.toLowerCase().includes(phrase)
                );
                if (isGeneric && result.feedback.length < 150) {
                    console.error('❌ ERROR: Feedback appears generic and score is 5.0 - AI may not be working correctly!');
                    throw new Error('AI returned generic feedback with default score - scoring may have failed');
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error scoring answer:', error);
            console.error('Error details:', error instanceof Error ? error.stack : error);
            // Return a default score with constructive feedback if AI scoring fails
            return {
                score: 5.0,
                feedback: 'Answer received and recorded. The answer addresses the question but could benefit from more detail and specific examples. Consider expanding on technical concepts and providing concrete examples to strengthen your response.',
                reasoning: 'Scoring service unavailable, using default feedback',
                strengths: ['Answer submitted', 'Addresses the question'],
                improvements: ['Could use more detail', 'Add specific examples'],
                suggestions: ['Expand on technical concepts', 'Provide concrete examples']
            };
        }
    }

    /**
     * Score using OpenAI
     */
    private async scoreWithOpenAI(question: string, answer: string, expectedKeywords?: string[], category?: string, difficulty?: string): Promise<AnswerScore> {
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
                            temperature: 0.2, // Lower temperature for more consistent scoring
                            max_tokens: 800, // More tokens for detailed feedback
                        })
            });

            const data = await response.json() as any;

            if (!response.ok) {
                throw new Error(`OpenAI scoring failed: ${data.error?.message || 'Unknown error'}`);
            }

            return this.parseScoringResponse(data.choices[0].message.content);
        } catch (error) {
            console.error('OpenAI scoring error:', error);
            throw error;
        }
    }

    /**
     * Score using Ollama (fallback)
     */
    private async scoreWithOllama(question: string, answer: string, expectedKeywords?: string[], category?: string, difficulty?: string): Promise<AnswerScore> {
        const prompt = this.buildScoringPrompt(question, answer, expectedKeywords, category, difficulty);

        // Try larger models first for better quality, fallback to smaller ones
        const models = ['llama3.2:3b', 'llama3.2:1b', 'phi3:mini', 'mistral:7b', 'llama2'];
        let response;
        let lastError;

        for (const model of models) {
            try {
                console.log(`Trying Ollama model: ${model}`);
                
                // Add timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: model,
                        prompt: prompt,
                        stream: false,
                        options: {
                            temperature: 0.6, // Higher temperature for more varied responses
                            max_tokens: 1200, // More tokens for detailed feedback
                            top_p: 0.95, // Nucleus sampling for better quality
                            top_k: 50, // Limit to top K tokens
                            repeat_penalty: 1.1 // Penalize repetition
                        }
                    })
                });
                
                clearTimeout(timeoutId);

                if (response.ok) {
                    console.log(`✅ Using Ollama model for scoring: ${model}`);
                    break;
                } else {
                    const errorData = await response.json() as any;
                    lastError = errorData.error || `HTTP ${response.status}`;
                    console.warn(`❌ Model ${model} failed:`, lastError);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    lastError = 'Request timeout (30s)';
                    console.error(`❌ Model ${model} timed out`);
                } else {
                    lastError = (error as Error).message;
                    console.error(`❌ Model ${model} error:`, lastError);
                }
            }
        }

        if (!response || !response.ok) {
            const errorMsg = `All Ollama models failed. Last error: ${lastError}`;
            console.error('❌ Ollama scoring failed:', errorMsg);
            throw new Error(errorMsg);
        }

        const data = await response.json() as { response?: string };
        const content = data.response || '';
        
        if (!content || content.trim().length < 10) {
            console.error('❌ Ollama returned empty or very short response');
            throw new Error('Ollama returned empty response');
        }
        
        console.log('✅ Ollama response received, length:', content.length);
        return this.parseScoringResponse(content);
    }

    /**
     * Build the prompt for AI scoring
     */
    private buildScoringPrompt(question: string, answer: string, expectedKeywords?: string[], category?: string, difficulty?: string): string {
        const keywordsText = expectedKeywords && expectedKeywords.length > 0 
            ? `Expected keywords: ${expectedKeywords.join(', ')}` 
            : '';
        
        const categoryText = category ? `Category: ${category}` : '';
        const difficultyText = difficulty ? `Difficulty: ${difficulty}` : '';

        // Calculate answer metrics for more precise scoring
        const answerLength = answer.length;
        const wordCount = answer.split(/\s+/).filter(w => w.length > 0).length;
        const hasExamples = /example|instance|case|scenario|for instance|such as/i.test(answer);
        const hasTechnicalTerms = /(?:function|class|method|algorithm|query|database|api|endpoint|variable|constant|loop|condition)/i.test(answer);
        const hasCodeSnippets = /[{}();=<>\[\]]/.test(answer) || /\$[a-zA-Z]/.test(answer);
        
        // Analyze answer quality indicators
        const isVeryShort = wordCount < 20;
        const isShort = wordCount < 50;
        const isLong = wordCount > 200;
        const hasDetailedExplanation = wordCount > 100 && (hasExamples || hasTechnicalTerms);
        const isOffTopic = !answer.toLowerCase().includes(question.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase());
        
        return `You are an expert technical interviewer. Your task is to score this candidate's answer from 0-10 with SPECIFIC, PERSONALIZED feedback.

QUESTION:
"${question}"

${categoryText ? categoryText + '\n' : ''}${difficultyText ? difficultyText + '\n' : ''}${keywordsText ? `Expected keywords: ${keywordsText}\n` : ''}

CANDIDATE'S ANSWER:
"${answer}"

ANSWER ANALYSIS:
- Length: ${answerLength} characters, ${wordCount} words ${isVeryShort ? '(VERY SHORT - likely incomplete)' : isShort ? '(SHORT - may lack detail)' : isLong ? '(LONG - comprehensive)' : '(moderate length)'}
- Examples present: ${hasExamples ? 'YES' : 'NO'} ${!hasExamples ? '- This is a weakness' : ''}
- Technical terms: ${hasTechnicalTerms ? 'YES' : 'NO'} ${!hasTechnicalTerms && category === 'technical' ? '- Missing technical depth' : ''}
- Code/syntax: ${hasCodeSnippets ? 'YES' : 'NO'}
- Relevance check: ${isOffTopic ? 'POTENTIALLY OFF-TOPIC' : 'Appears relevant'}

SCORING RUBRIC - Calculate each component:

1. RELEVANCE (0-2 points):
   ${isOffTopic ? '   → Score 0-0.5: Answer does not address the question' : `   → Score 1.5-2: Directly answers "${question.substring(0, 50)}..."`}
   → Score 1: Partially relevant but misses key aspects
   → Score 0: Completely off-topic

2. COMPLETENESS (0-2 points):
   ${isVeryShort ? '   → Score 0-0.5: Answer is too brief (less than 20 words)' : isShort ? '   → Score 0.5-1: Answer is short and likely incomplete' : hasDetailedExplanation ? '   → Score 1.5-2: Answer is comprehensive and detailed' : '   → Score 1-1.5: Answer covers basics but could be more thorough'}
   → Consider: Does it answer WHAT, WHY, and HOW?

3. TECHNICAL ACCURACY (0-2 points):
   ${hasTechnicalTerms ? '   → Analyze if technical concepts are CORRECT' : '   → Score 0-0.5: No technical details provided'}
   → Score 2: All technical details are accurate
   → Score 1: Mostly correct with minor issues
   → Score 0: Contains errors or misunderstandings

4. DEPTH & INSIGHT (0-2 points):
   ${hasDetailedExplanation ? '   → Score 1.5-2: Shows deep understanding' : '   → Score 0.5-1: Surface-level understanding'}
   → Does it explain WHY, not just WHAT?
   → Does it show critical thinking?

5. CLARITY (0-1 point):
   → Score 1: Clear and well-organized
   → Score 0.5: Somewhat clear
   → Score 0: Confusing or poorly structured

6. EXAMPLES/EVIDENCE (0-1 point):
   ${hasExamples ? '   → Score 0.5-1: Examples provided' : '   → Score 0: No examples - this is a weakness'}
   → Concrete examples strengthen the answer

CALCULATE TOTAL: Add all 6 components (0-10 total)

SCORE DISTRIBUTION EXAMPLES:
- 9-10: Excellent - comprehensive, accurate, insightful, well-structured
- 7-8: Good - solid answer with minor gaps
- 5-6: Average - addresses question but lacks depth or detail
- 3-4: Below average - partially relevant but incomplete or inaccurate
- 0-2: Poor - off-topic, incorrect, or too brief

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. DO NOT DEFAULT TO 5.0! Calculate the score by adding the 6 components above.
2. If the answer is ${isVeryShort ? 'VERY SHORT (less than 20 words)' : isShort ? 'SHORT (less than 50 words)' : 'adequate length'}, this MUST be reflected in the score (short answers should score lower on completeness).
3. If the answer ${hasExamples ? 'HAS examples' : 'LACKS examples'}, this MUST be reflected in scoring (no examples = lower score on Examples/Evidence).
4. You MUST quote or paraphrase specific parts of the answer in your feedback. Do not use generic phrases.
5. Be honest and specific:
   - If answer is excellent (comprehensive, accurate, detailed) → Score 8-10
   - If answer is good but has gaps → Score 6-7.5
   - If answer is average (basic, incomplete) → Score 4-5.5
   - If answer is poor (brief, incorrect, off-topic) → Score 2-3.5
   - If answer is very poor (almost no content) → Score 0-1.5
6. The score MUST vary based on actual quality. Two different answers should get different scores.
7. In your reasoning, show the calculation: "Relevance: X/2, Completeness: Y/2, Technical: Z/2, Depth: A/2, Clarity: B/1, Examples: C/1 = TOTAL/10"

Return ONLY valid JSON (no markdown, no code blocks):
{
  "score": <number 0-10 with one decimal>,
  "feedback": "<4-6 sentences. Start by quoting or paraphrasing what the candidate said. Then explain what was good and what needs improvement. Be specific - mention actual content from the answer.>",
  "reasoning": "<Breakdown: Relevance X/2, Completeness X/2, Technical X/2, Depth X/2, Clarity X/1, Examples X/1 = TOTAL/10>",
  "strengths": ["<Specific strength from the answer>", "<Another specific strength>"],
  "improvements": ["<Specific weakness from the answer>", "<Another specific weakness>"],
  "suggestions": ["<Actionable suggestion based on the answer>", "<Another suggestion>"]
}

IMPORTANT: 
- Score must be between 0-10 (can be 3.5, 7.2, 9.8, etc.)
- Feedback must quote or reference specific parts of the answer
- If the answer is "${answer.substring(0, 100)}${answer.length > 100 ? '...' : ''}", analyze THIS specific content
- Vary scores: excellent answers get 8-10, poor answers get 2-4, average get 5-7

Return ONLY the JSON object, nothing else.`;
    }

    /**
     * Parse the AI response to extract score and feedback
     */
    private parseScoringResponse(content: string): AnswerScore {
        try {
            console.log('Parsing AI response, content length:', content.length);
            console.log('First 500 chars of response:', content.substring(0, 500));
            
            // Clean the content - remove markdown code blocks if present
            let cleanedContent = content.trim();
            cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
            
            // Try multiple strategies to find JSON
            // Strategy 1: Look for JSON object (most common)
            let jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            
            // Strategy 2: If that fails, look for JSON after common prefixes
            if (!jsonMatch) {
                // Look for JSON after phrases like "Here's the JSON:" or "```json"
                const jsonAfterPrefix = cleanedContent.match(/(?:json|JSON|return|result)[\s:]*\{[\s\S]*\}/i);
                if (jsonAfterPrefix) {
                    jsonMatch = jsonAfterPrefix[0].match(/\{[\s\S]*\}/);
                }
            }
            
            // Strategy 3: Look for the last complete JSON object in the response (often the final answer)
            if (!jsonMatch) {
                // Find all potential JSON starts
                const jsonStarts: number[] = [];
                for (let i = 0; i < cleanedContent.length; i++) {
                    if (cleanedContent[i] === '{') {
                        jsonStarts.push(i);
                    }
                }
                
                // Try to parse each JSON object from the end
                for (let i = jsonStarts.length - 1; i >= 0; i--) {
                    const start = jsonStarts[i];
                    let braceCount = 0;
                    let end = start;
                    
                    for (let j = start; j < cleanedContent.length; j++) {
                        if (cleanedContent[j] === '{') braceCount++;
                        if (cleanedContent[j] === '}') braceCount--;
                        if (braceCount === 0) {
                            end = j;
                            break;
                        }
                    }
                    
                    if (braceCount === 0) {
                        const potentialJson = cleanedContent.substring(start, end + 1);
                        try {
                            JSON.parse(potentialJson);
                            jsonMatch = [potentialJson];
                            console.log('✅ Found valid JSON using Strategy 3');
                            break;
                        } catch (e) {
                            // Not valid JSON, continue
                        }
                    }
                }
            }
            
            // Strategy 4: Look for JSON with score field specifically
            if (!jsonMatch) {
                const scoreJsonMatch = cleanedContent.match(/\{[^}]*"score"[^}]*\}/);
                if (scoreJsonMatch) {
                    jsonMatch = scoreJsonMatch;
                }
            }
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
                    
                    const rawScore = parseFloat(parsed.score);
                    if (isNaN(rawScore)) {
                        console.warn('Invalid score in response:', parsed.score);
                        throw new Error('Invalid score');
                    }
                    
                    const score = Math.max(0, Math.min(10, rawScore));
                    console.log('✅ Extracted score from AI:', score);
                    
                    // Validate score is not defaulting to 5.0
                    if (score === 5.0 && parsed.reasoning && !parsed.reasoning.includes('5.0')) {
                        console.log('⚠️ Score is exactly 5.0 - this might be a default. Check reasoning:', parsed.reasoning);
                    }
                    
                    // Ensure feedback is detailed and not generic
                    let feedback = parsed.feedback || '';
                    if (feedback.length < 50) {
                        console.warn('⚠️ Feedback is too short, enhancing...');
                        feedback = 'Answer evaluated. ' + feedback;
                    }
                    
                    // Check if feedback is generic
                    const genericPhrases = [
                        'addresses the question',
                        'could benefit from more detail',
                        'consider expanding',
                        'answer received and recorded'
                    ];
                    const isGeneric = genericPhrases.some(phrase => 
                        feedback.toLowerCase().includes(phrase) && feedback.length < 100
                    );
                    
                    if (isGeneric) {
                        console.warn('⚠️ Feedback appears generic. Original:', feedback.substring(0, 100));
                    }
                    
                    return {
                        score: Math.round(score * 10) / 10, // Round to 1 decimal place
                        feedback: feedback || 'Answer evaluated. Consider providing more detail and specific examples.',
                        reasoning: parsed.reasoning || `Score: ${score}/10`,
                        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : (parsed.strengths ? [parsed.strengths] : []),
                        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : (parsed.improvements ? [parsed.improvements] : []),
                        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : (parsed.suggestions ? [parsed.suggestions] : [])
                    };
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    console.error('JSON content:', jsonMatch[0]);
                }
            }

            // Fallback: try to extract score from text
            const scoreMatch = cleanedContent.match(/score["\s:]*([0-9.]+)/i);
            if (scoreMatch) {
                const score = Math.max(0, Math.min(10, parseFloat(scoreMatch[1])));
                console.log('Extracted score from text:', score);
                return {
                    score: Math.round(score * 10) / 10,
                    feedback: cleanedContent.substring(0, 300) || 'Answer evaluated',
                    reasoning: 'Extracted from text response',
                    strengths: [],
                    improvements: [],
                    suggestions: []
                };
            }

            // Default fallback - log warning and throw error to prevent silent failure
            console.error('❌ Could not parse AI response!');
            console.error('Response content:', cleanedContent.substring(0, 1000));
            throw new Error(`Failed to parse AI scoring response. Response was: ${cleanedContent.substring(0, 200)}`);
        } catch (error) {
            console.error('❌ Error parsing scoring response:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
            // Re-throw the error instead of returning default 5.0
            throw new Error(`Failed to parse AI scoring response: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default new AnswerScoringService();

