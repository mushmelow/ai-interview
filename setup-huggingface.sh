#!/bin/bash

# Alternative: Hugging Face Free AI Setup
echo "🤗 Setting up Hugging Face free AI..."

# Create a simple fallback service for Hugging Face
cat > /Users/zhenghao/Desktop/ai\ interview/backend/src/services/HuggingFaceService.ts << 'EOF'
import { QuestionGenerationRequest, GeneratedQuestion } from '../types/questions';

class HuggingFaceService {
    private apiUrl = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

    async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
        try {
            const prompt = this.buildPrompt(request);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_HUGGING_FACE_TOKEN' // Optional for free tier
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 1000,
                        temperature: 0.7,
                        do_sample: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Hugging Face API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseResponse(data, request);
        } catch (error) {
            console.error('Hugging Face API error:', error);
            throw error;
        }
    }

    private buildPrompt(request: QuestionGenerationRequest): string {
        return `Generate ${request.numberOfQuestions} interview questions for a ${request.experienceLevel} ${request.position} position. Focus on: ${request.categories.join(', ')}. Difficulty: ${request.difficulty}.`;
    }

    private parseResponse(data: any, request: QuestionGenerationRequest): GeneratedQuestion[] {
        // Parse Hugging Face response and convert to our format
        const questions: GeneratedQuestion[] = [];
        
        // Simple parsing - you can enhance this
        const text = data[0]?.generated_text || '';
        const questionLines = text.split('\n').filter(line => line.includes('?'));
        
        questionLines.slice(0, request.numberOfQuestions).forEach((line, index) => {
            questions.push({
                id: (Date.now() + index).toString(),
                question: line.trim(),
                category: request.categories[0] || 'General',
                type: 'technical',
                difficulty: request.difficulty,
                context: request.customContext,
                followUpQuestions: ['Can you elaborate?', 'What challenges did you face?'],
                expectedKeywords: ['experience', 'skills', 'problem-solving']
            });
        });

        return questions;
    }
}

export default HuggingFaceService;
EOF

echo "✅ Hugging Face service created!"
echo ""
echo "📝 To use Hugging Face:"
echo "   1. Get a free token at: https://huggingface.co/settings/tokens"
echo "   2. Replace 'YOUR_HUGGING_FACE_TOKEN' in the service file"
echo "   3. Update AIQuestionService to use HuggingFaceService"
echo ""
echo "🎯 Benefits:"
echo "   - Free tier with generous limits"
echo "   - No local installation required"
echo "   - Multiple open source models available"
