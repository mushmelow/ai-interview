const { query } = require('../database/connection');
import {
    QuestionGenerationRequest,
    QuestionGenerationResponse,
    GeneratedQuestion,
    QuestionTemplate,
    QuestionCategory
} from '../types/questions';

class AIQuestionService {
    private openaiApiKey: string;

    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY || '';
        console.log('OpenAI API Key loaded:', this.openaiApiKey ? 'Yes (length: ' + this.openaiApiKey.length + ')' : 'No');
        console.log('Using Ollama for free AI question generation');
    }

    // Generate questions using AI
    async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
        try {
            const sessionId = this.generateSessionId();

            // Store the question session
            await this.createQuestionSession(request, sessionId);

            // Generate questions using AI ONLY - no template fallback
            const questions = await this.generateQuestionsWithAI(request);

            // Store generated questions and get database IDs
            const storedQuestions = await this.storeGeneratedQuestions(sessionId, questions);

            return {
                success: true,
                questions: storedQuestions, // Return questions with database IDs
                sessionId,
                metadata: {
                    position: request.position,
                    experienceLevel: request.experienceLevel,
                    categories: request.categories,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error generating questions:', error);
            throw error; // Re-throw the original error instead of generic message
        }
    }

    // Get questions for a session
    async getSessionQuestions(sessionId: string): Promise<GeneratedQuestion[]> {
        try {
            const result = await query(
                `SELECT * FROM generated_questions 
                 WHERE session_id = $1 
                 ORDER BY order_index ASC`,
                [sessionId]
            );

            return result.rows.map((row: any) => ({
                id: row.id,
                question: row.question,
                category: row.category,
                type: row.type,
                difficulty: row.difficulty,
                context: row.context,
                followUpQuestions: row.follow_up_questions || [],
                expectedKeywords: row.expected_keywords || []
            }));
        } catch (error) {
            console.error('Error getting session questions:', error);
            throw new Error('Failed to retrieve questions');
        }
    }

    // Generate questions using Ollama (Free AI)
    private async generateQuestionsWithAI(
        request: QuestionGenerationRequest
    ): Promise<GeneratedQuestion[]> {
        try {
            const prompt = this.buildPrompt(request);

            // Use Ollama instead of OpenAI - try multiple models
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
                                temperature: 0.7,
                                max_tokens: Math.max(2000, request.numberOfQuestions * 500) // More tokens for more questions
                            }
                        })
                    });

                    if (response.ok) {
                        console.log(`✅ Using Ollama model: ${model}`);
                        break;
                    } else {
                        const errorData = await response.json() as any;
                        lastError = errorData.error || `HTTP ${response.status}`;
                        console.log(`❌ Model ${model} failed: ${lastError}`);
                    }
                } catch (error) {
                    lastError = (error as Error).message;
                    console.log(`❌ Model ${model} error: ${lastError}`);
                }
            }

            if (!response || !response.ok) {
                throw new Error(`All Ollama models failed. Last error: ${lastError}. Please install a model with: ollama pull llama3.2:1b`);
            }

            const data = await response.json();
            return this.parseAIResponse((data as any).response, request);
        } catch (error) {
            console.error('Ollama API error:', error);
            throw error; // Re-throw the error to be handled by the controller
        }
    }

    // Fallback: Generate questions from templates
    private async generateQuestionsFromTemplates(
        request: QuestionGenerationRequest,
        templates: QuestionTemplate[]
    ): Promise<GeneratedQuestion[]> {
        const questions: GeneratedQuestion[] = [];
        const usedTemplates = new Set<number>();

        // Generate the requested number of questions by cycling through available templates
        for (let i = 0; i < request.numberOfQuestions; i++) {
            const templateIndex = i % templates.length; // Cycle through templates
            const template = templates[templateIndex];

            // Create variation in the request to generate different questions
            const variedRequest = { ...request };
            if (i >= templates.length) {
                // Add variation for repeated templates
                variedRequest.customContext = `${request.customContext} - Focus area ${Math.floor(i / templates.length) + 1}`;
            }

            const question = this.fillTemplate(template, variedRequest);

            questions.push({
                id: (Date.now() + i).toString(),
                question,
                category: template.category,
                type: template.type,
                difficulty: template.difficulty,
                context: variedRequest.customContext,
                followUpQuestions: this.generateFollowUpQuestions(template.type),
                expectedKeywords: this.getExpectedKeywords(template.type, request.position)
            });
        }

        return questions;
    }

    // Fill template with dynamic content
    private fillTemplate(template: QuestionTemplate, request: QuestionGenerationRequest): string {
        let question = template.template;

        // Replace variables with context-appropriate content
        const replacements: { [key: string]: string } = {
            technology: this.getTechnologyForPosition(request.position),
            scenario: this.getScenarioForPosition(request.position),
            constraint: this.getConstraintForLevel(request.experienceLevel),
            situation: this.getSituationForType(template.type),
            domain: this.getDomainForPosition(request.position),
            company_value: this.getCompanyValue(),
            challenge: this.getChallengeForLevel(request.experienceLevel),
            system: this.getSystemForPosition(request.position)
        };

        template.variables.forEach(variable => {
            if (replacements[variable]) {
                question = question.replace(`{${variable}}`, replacements[variable]);
            }
        });

        return question;
    }

    // Helper methods for template filling
    private getTechnologyForPosition(position: string): string {
        const techMap: { [key: string]: string } = {
            'frontend': 'React, Vue.js, Angular, JavaScript/TypeScript, CSS, HTML5',
            'react': 'React, Redux, Next.js, JavaScript/TypeScript, CSS, HTML5, JSX',
            'vue': 'Vue.js, Vuex, Nuxt.js, JavaScript/TypeScript, CSS, HTML5',
            'angular': 'Angular, RxJS, TypeScript, CSS, HTML5, Material Design',
            'backend': 'Node.js, Python, Java, C#, PostgreSQL, MongoDB, Redis, Docker',
            'c#': 'C#, .NET Core, .NET Framework, ASP.NET, Entity Framework, LINQ, Visual Studio',
            'csharp': 'C#, .NET Core, .NET Framework, ASP.NET, Entity Framework, LINQ, Visual Studio',
            'dotnet': 'C#, .NET Core, .NET Framework, ASP.NET, Entity Framework, LINQ, Visual Studio',
            'java': 'Java, Spring Framework, Maven, Gradle, JUnit, Hibernate, IntelliJ IDEA',
            'python': 'Python, Django, Flask, FastAPI, NumPy, Pandas, SQLAlchemy, PyCharm',
            'node': 'Node.js, Express.js, npm, TypeScript, MongoDB, PostgreSQL, Jest',
            'fullstack': 'React/Node.js, Python/Django, JavaScript ecosystem, databases, cloud platforms',
            'mobile': 'React Native, Flutter, Swift, Kotlin, iOS/Android native development',
            'data': 'Python, R, SQL, TensorFlow, PyTorch, Jupyter, pandas, scikit-learn',
            'devops': 'Docker, Kubernetes, AWS/Azure/GCP, Terraform, Jenkins, GitLab CI/CD',
            'software': 'Multiple programming languages, frameworks, databases, cloud platforms',
            'product': 'Product management tools, analytics platforms, user research tools',
            'design': 'Figma, Sketch, Adobe Creative Suite, user research tools, prototyping tools'
        };

        const lowerPosition = position.toLowerCase();

        // Enhanced detection for specific technologies
        if (lowerPosition.includes('react')) return techMap['react'];
        if (lowerPosition.includes('vue')) return techMap['vue'];
        if (lowerPosition.includes('angular')) return techMap['angular'];
        if (lowerPosition.includes('c#') || lowerPosition.includes('csharp')) return techMap['c#'];
        if (lowerPosition.includes('dotnet') || lowerPosition.includes('.net')) return techMap['dotnet'];
        if (lowerPosition.includes('java')) return techMap['java'];
        if (lowerPosition.includes('python')) return techMap['python'];
        if (lowerPosition.includes('node')) return techMap['node'];

        for (const [key, value] of Object.entries(techMap)) {
            if (lowerPosition.includes(key)) {
                return value;
            }
        }
        return 'relevant technologies and tools';
    }

    private getScenarioForPosition(position: string): string {
        const scenarios: { [key: string]: string } = {
            'frontend': 'building a responsive user interface with complex state management',
            'react': 'building a React application with hooks, state management, and component architecture',
            'vue': 'building a Vue.js application with composition API and state management',
            'angular': 'building an Angular application with services, components, and dependency injection',
            'backend': 'designing a scalable API with microservices architecture',
            'c#': 'building a C# application with .NET Core, Entity Framework, and clean architecture patterns',
            'csharp': 'building a C# application with .NET Core, Entity Framework, and clean architecture patterns',
            'dotnet': 'building a .NET application with ASP.NET Core, Entity Framework, and microservices',
            'java': 'building a Java application with Spring Boot, Hibernate, and enterprise patterns',
            'python': 'building a Python application with Django/Flask, SQLAlchemy, and REST APIs',
            'node': 'building a Node.js application with Express, MongoDB, and real-time features',
            'fullstack': 'architecting a complete application from frontend to database',
            'mobile': 'developing a cross-platform mobile app with offline capabilities',
            'data': 'analyzing large datasets and building predictive models',
            'devops': 'setting up automated deployment pipelines and monitoring systems',
            'software': 'designing a scalable software system with performance optimization',
            'product': 'developing a product strategy based on user research and market analysis',
            'design': 'creating a comprehensive design system and user experience strategy'
        };

        const lowerPosition = position.toLowerCase();

        // Enhanced detection for specific technologies
        if (lowerPosition.includes('react')) return scenarios['react'];
        if (lowerPosition.includes('vue')) return scenarios['vue'];
        if (lowerPosition.includes('angular')) return scenarios['angular'];
        if (lowerPosition.includes('c#') || lowerPosition.includes('csharp')) return scenarios['c#'];
        if (lowerPosition.includes('dotnet') || lowerPosition.includes('.net')) return scenarios['dotnet'];
        if (lowerPosition.includes('java')) return scenarios['java'];
        if (lowerPosition.includes('python')) return scenarios['python'];
        if (lowerPosition.includes('node')) return scenarios['node'];

        for (const [key, value] of Object.entries(scenarios)) {
            if (lowerPosition.includes(key)) {
                return value;
            }
        }
        return 'a complex technical challenge';
    }

    private getConstraintForLevel(level: string): string {
        const constraints: { [key: string]: string } = {
            'entry': 'limited resources and tight deadlines',
            'mid': 'complex requirements and multiple stakeholders',
            'senior': 'ambiguous requirements and high-stakes decisions'
        };
        return constraints[level] || constraints['mid'];
    }

    private getSituationForType(type: string): string {
        const situations: { [key: string]: string } = {
            'behavioral': 'conflicting priorities',
            'technical': 'technical disagreements',
            'situational': 'unexpected challenges',
            'cultural': 'diverse team dynamics'
        };
        return situations[type] || 'difficult situations';
    }

    private getDomainForPosition(position: string): string {
        return this.getTechnologyForPosition(position);
    }

    private getCompanyValue(): string {
        const values = ['innovation', 'collaboration', 'excellence', 'integrity', 'customer focus'];
        return values[Math.floor(Math.random() * values.length)];
    }

    private getChallengeForLevel(level: string): string {
        const challenges: { [key: string]: string } = {
            'entry': 'a difficult technical problem',
            'mid': 'a complex project with multiple teams',
            'senior': 'a major organizational change'
        };
        return challenges[level] || challenges['mid'];
    }

    private getSystemForPosition(position: string): string {
        const systems = {
            'frontend': 'our current user interface',
            'backend': 'our API architecture',
            'fullstack': 'our application stack',
            'mobile': 'our mobile app',
            'data': 'our data pipeline',
            'devops': 'our deployment process'
        };

        const lowerPosition = position.toLowerCase();
        for (const [key, value] of Object.entries(systems)) {
            if (lowerPosition.includes(key)) {
                return value;
            }
        }
        return 'our current system';
    }

    // Generate follow-up questions
    private generateFollowUpQuestions(type: string): string[] {
        const followUps: { [key: string]: string[] } = {
            'behavioral': [
                'What was the outcome?',
                'What would you do differently?',
                'How did this experience shape your approach?'
            ],
            'technical': [
                'What challenges did you face?',
                'How did you ensure quality?',
                'What tools did you use?'
            ],
            'situational': [
                'How did you prioritize?',
                'What alternatives did you consider?',
                'How did you measure success?'
            ],
            'cultural': [
                'How do you maintain this approach?',
                'What examples can you share?',
                'How does this align with your values?'
            ]
        };
        return followUps[type] || followUps['behavioral'];
    }

    // Get expected keywords for evaluation
    private getExpectedKeywords(type: string, position: string): string[] {
        const keywords: { [key: string]: string[] } = {
            'behavioral': ['problem-solving', 'communication', 'teamwork', 'leadership'],
            'technical': ['architecture', 'best practices', 'testing', 'optimization'],
            'situational': ['analysis', 'decision-making', 'prioritization', 'results'],
            'cultural': ['values', 'collaboration', 'growth', 'impact']
        };

        const baseKeywords = keywords[type] || keywords['behavioral'];
        const positionKeywords = this.getPositionKeywords(position);

        return [...baseKeywords, ...positionKeywords];
    }

    private getPositionKeywords(position: string): string[] {
        const keywords: { [key: string]: string[] } = {
            'frontend': ['UI/UX', 'responsive design', 'performance', 'accessibility'],
            'backend': ['scalability', 'security', 'API design', 'database optimization'],
            'c#': ['.NET Core', 'Entity Framework', 'LINQ', 'ASP.NET', 'Visual Studio', 'NuGet'],
            'csharp': ['.NET Core', 'Entity Framework', 'LINQ', 'ASP.NET', 'Visual Studio', 'NuGet'],
            'dotnet': ['.NET Core', 'Entity Framework', 'LINQ', 'ASP.NET', 'Visual Studio', 'NuGet'],
            'java': ['Spring Boot', 'Hibernate', 'Maven', 'Gradle', 'JUnit', 'IntelliJ IDEA'],
            'python': ['Django', 'Flask', 'SQLAlchemy', 'NumPy', 'Pandas', 'PyCharm'],
            'node': ['Express.js', 'npm', 'MongoDB', 'PostgreSQL', 'Jest', 'TypeScript'],
            'fullstack': ['end-to-end', 'system design', 'integration', 'architecture'],
            'mobile': ['cross-platform', 'native performance', 'user experience', 'app store'],
            'data': ['analytics', 'machine learning', 'data quality', 'insights'],
            'devops': ['automation', 'monitoring', 'deployment', 'infrastructure']
        };

        const lowerPosition = position.toLowerCase();

        // Enhanced detection for specific technologies
        if (lowerPosition.includes('c#') || lowerPosition.includes('csharp')) return keywords['c#'];
        if (lowerPosition.includes('dotnet') || lowerPosition.includes('.net')) return keywords['dotnet'];
        if (lowerPosition.includes('java')) return keywords['java'];
        if (lowerPosition.includes('python')) return keywords['python'];
        if (lowerPosition.includes('node')) return keywords['node'];

        for (const [key, value] of Object.entries(keywords)) {
            if (lowerPosition.includes(key)) {
                return value;
            }
        }
        return [];
    }

    // Build prompt for OpenAI
    private buildPrompt(request: QuestionGenerationRequest): string {
        const roleContext = this.getRoleSpecificContext(request.position);
        const experienceContext = this.getExperienceLevelContext(request.experienceLevel);
        const categoryContext = this.getCategoryContext(request.categories);

        return `You are an expert technical recruiter and interviewer. Generate EXACTLY ${request.numberOfQuestions} highly specific, role-targeted interview questions for a ${request.experienceLevel} ${request.position} position.

CRITICAL: You MUST generate ${request.numberOfQuestions} questions. Do not stop at 1 question. Generate all ${request.numberOfQuestions} questions.

ROLE-SPECIFIC CONTEXT:
${roleContext}

EXPERIENCE LEVEL CONTEXT:
${experienceContext}

CATEGORY FOCUS:
${categoryContext}

DIFFICULTY LEVEL: ${request.difficulty}
${request.customContext ? `ADDITIONAL CONTEXT: ${request.customContext}` : ''}

REQUIREMENTS FOR EACH QUESTION:
1. Must be highly specific to the ${request.position} role
2. Should test practical, real-world skills relevant to this position
3. Must be appropriate for ${request.experienceLevel} level
4. Should cover different aspects: technical skills, problem-solving, communication, experience
5. Include specific technologies, tools, or methodologies relevant to the role

OUTPUT FORMAT - YOU MUST RETURN A JSON ARRAY WITH EXACTLY ${request.numberOfQuestions} OBJECTS:
[
  {
    "question": "First interview question here",
    "category": "${request.categories[0] || 'Technical Skills'}",
    "type": "technical",
    "difficulty": "${request.difficulty}",
    "followUpQuestions": ["follow-up 1", "follow-up 2"],
    "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  {
    "question": "Second interview question here",
    "category": "${request.categories[1] || request.categories[0] || 'Technical Skills'}",
    "type": "behavioral",
    "difficulty": "${request.difficulty}",
    "followUpQuestions": ["follow-up 1", "follow-up 2"],
    "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
  }
  ... continue for all ${request.numberOfQuestions} questions ...
]

IMPORTANT: 
- Return ONLY the JSON array, no other text before or after
- Generate EXACTLY ${request.numberOfQuestions} questions, not just 1
- Make each question unique, specific to the ${request.position} role, and progressively challenging
- Avoid generic questions that could apply to any role`;
    }

    // Get role-specific context for question generation
    private getRoleSpecificContext(position: string): string {
        const roleContexts: { [key: string]: string } = {
            'frontend developer': `
- Primary focus: User interface, user experience, client-side technologies
- Key technologies: React, Vue.js, Angular, JavaScript/TypeScript, CSS, HTML5
- Responsibilities: Component architecture, state management, responsive design, performance optimization
- Common challenges: Cross-browser compatibility, accessibility, mobile responsiveness, bundle size optimization
- Skills to assess: UI/UX design principles, modern JavaScript frameworks, CSS preprocessors, build tools (Webpack, Vite)
- Real-world scenarios: Implementing complex user interactions, optimizing page load times, handling large datasets in UI`,

            'backend developer': `
- Primary focus: Server-side logic, APIs, databases, system architecture
- Key technologies: Node.js, Python, Java, C#, PostgreSQL, MongoDB, Redis, Docker
- Responsibilities: API design, database optimization, security implementation, microservices architecture
- Common challenges: Scalability, data consistency, security vulnerabilities, performance bottlenecks
- Skills to assess: RESTful API design, database design, authentication/authorization, caching strategies
- Real-world scenarios: Designing scalable APIs, optimizing database queries, implementing security measures`,

            'full stack developer': `
- Primary focus: End-to-end application development, system integration
- Key technologies: React/Node.js, Python/Django, JavaScript ecosystem, databases, cloud platforms
- Responsibilities: Full application lifecycle, system integration, deployment, maintenance
- Common challenges: Technology stack decisions, system integration, deployment complexity, maintenance overhead
- Skills to assess: Full-stack architecture, DevOps practices, system design, technology evaluation
- Real-world scenarios: Building complete applications, system integration, deployment automation`,

            'mobile developer': `
- Primary focus: Mobile application development, cross-platform solutions
- Key technologies: React Native, Flutter, Swift, Kotlin, iOS/Android native development
- Responsibilities: Mobile UI/UX, performance optimization, platform-specific features, app store deployment
- Common challenges: Platform differences, performance optimization, offline functionality, app store guidelines
- Skills to assess: Mobile UI patterns, platform APIs, performance optimization, app lifecycle management
- Real-world scenarios: Building responsive mobile apps, handling platform differences, optimizing for mobile performance`,

            'data scientist': `
- Primary focus: Data analysis, machine learning, statistical modeling
- Key technologies: Python, R, SQL, TensorFlow, PyTorch, Jupyter, pandas, scikit-learn
- Responsibilities: Data analysis, model development, statistical analysis, data visualization
- Common challenges: Data quality, model accuracy, feature engineering, scalability
- Skills to assess: Statistical analysis, machine learning algorithms, data preprocessing, model evaluation
- Real-world scenarios: Building predictive models, analyzing large datasets, feature engineering, model deployment`,

            'devops engineer': `
- Primary focus: Infrastructure, automation, deployment, monitoring
- Key technologies: Docker, Kubernetes, AWS/Azure/GCP, Terraform, Jenkins, GitLab CI/CD
- Responsibilities: Infrastructure management, CI/CD pipelines, monitoring, security
- Common challenges: Infrastructure scaling, deployment automation, monitoring complexity, security compliance
- Skills to assess: Containerization, orchestration, cloud platforms, automation tools, monitoring systems
- Real-world scenarios: Setting up CI/CD pipelines, managing cloud infrastructure, implementing monitoring solutions`,

            'software engineer': `
- Primary focus: General software development, system design, problem-solving
- Key technologies: Multiple programming languages, frameworks, databases, cloud platforms
- Responsibilities: Software design, development, testing, maintenance, system architecture
- Common challenges: System design, code quality, performance optimization, scalability
- Skills to assess: Programming fundamentals, system design, algorithms, software engineering practices
- Real-world scenarios: Designing software systems, optimizing performance, implementing best practices`,

            'product manager': `
- Primary focus: Product strategy, user research, cross-functional collaboration
- Key responsibilities: Product roadmap, user research, stakeholder management, market analysis
- Common challenges: Prioritization, stakeholder alignment, market validation, resource constraints
- Skills to assess: Strategic thinking, user research, data analysis, communication, leadership
- Real-world scenarios: Product strategy development, user research, stakeholder management, market analysis`,

            'ui/ux designer': `
- Primary focus: User experience design, interface design, user research
- Key tools: Figma, Sketch, Adobe Creative Suite, user research tools, prototyping tools
- Responsibilities: User research, wireframing, prototyping, design systems, usability testing
- Common challenges: User needs understanding, design consistency, accessibility, stakeholder alignment
- Skills to assess: User research, design thinking, prototyping, design systems, usability principles
- Real-world scenarios: User research, design system development, usability testing, stakeholder collaboration`
        };

        const lowerPosition = position.toLowerCase();

        // Enhanced role detection with more variations
        for (const [key, value] of Object.entries(roleContexts)) {
            const baseRole = key.replace(' developer', '').replace(' engineer', '').replace(' manager', '').replace(' designer', '');

            // Check for exact match or variations
            if (lowerPosition.includes(baseRole) ||
                lowerPosition.includes(key) ||
                (baseRole === 'frontend' && (lowerPosition.includes('react') || lowerPosition.includes('vue') || lowerPosition.includes('angular'))) ||
                (baseRole === 'backend' && (lowerPosition.includes('node') || lowerPosition.includes('python') || lowerPosition.includes('java'))) ||
                (baseRole === 'data' && (lowerPosition.includes('scientist') || lowerPosition.includes('analyst') || lowerPosition.includes('ml'))) ||
                (baseRole === 'devops' && (lowerPosition.includes('ops') || lowerPosition.includes('infrastructure') || lowerPosition.includes('cloud'))) ||
                (baseRole === 'mobile' && (lowerPosition.includes('ios') || lowerPosition.includes('android') || lowerPosition.includes('flutter'))) ||
                (baseRole === 'product' && (lowerPosition.includes('pm') || lowerPosition.includes('owner'))) ||
                (baseRole === 'ui' && (lowerPosition.includes('ux') || lowerPosition.includes('design'))) ||
                (baseRole === 'software' && (lowerPosition.includes('engineer') || lowerPosition.includes('programmer')))) {
                return value;
            }
        }

        // Default context for unknown roles
        return `
- Role: ${position}
- Focus: General software development and problem-solving
- Key areas: Technical skills, problem-solving, communication, teamwork
- Common challenges: Technical implementation, system design, collaboration, continuous learning
- Skills to assess: Technical proficiency, analytical thinking, communication, adaptability
- Real-world scenarios: Problem-solving, technical implementation, team collaboration, project delivery`;
    }

    // Get experience level context
    private getExperienceLevelContext(level: string): string {
        const levelContexts: { [key: string]: string } = {
            'entry': `
- Experience: 0-2 years, recent graduate or career changer
- Expectations: Basic technical skills, eagerness to learn, fundamental understanding
- Focus areas: Technical fundamentals, learning ability, problem-solving approach, communication
- Question depth: Basic technical concepts, learning experiences, simple problem-solving scenarios
- Assessment criteria: Potential, learning ability, basic technical knowledge, communication skills`,

            'mid': `
- Experience: 2-5 years, established professional with solid foundation
- Expectations: Strong technical skills, independent work capability, mentoring others
- Focus areas: Technical expertise, project experience, leadership potential, system thinking
- Question depth: Complex technical problems, project management, team collaboration, architecture decisions
- Assessment criteria: Technical depth, project experience, problem-solving skills, leadership potential`,

            'senior': `
- Experience: 5+ years, expert level with leadership responsibilities
- Expectations: Technical leadership, system architecture, mentoring, strategic thinking
- Focus areas: System design, technical leadership, architecture decisions, team building
- Question depth: Complex system design, technical leadership, strategic decisions, team management
- Assessment criteria: Technical leadership, system design, strategic thinking, team building`
        };

        return levelContexts[level] || levelContexts['mid'];
    }

    // Get category context
    private getCategoryContext(categories: string[]): string {
        const categoryDescriptions: { [key: string]: string } = {
            'Technical Skills': 'Assess specific technical knowledge, tools, frameworks, and methodologies',
            'Problem Solving': 'Evaluate analytical thinking, debugging skills, and solution design approach',
            'Communication': 'Test ability to explain technical concepts, collaborate, and present ideas',
            'Experience': 'Explore past projects, achievements, and real-world application of skills',
            'Cultural Fit': 'Assess alignment with company values, work style, and team dynamics',
            'Leadership': 'Evaluate leadership potential, mentoring ability, and team management skills',
            'Innovation': 'Test creativity, forward-thinking, and ability to drive innovation'
        };

        return categories.map(cat => `- ${cat}: ${categoryDescriptions[cat] || 'General assessment of this area'}`).join('\n');
    }

    // Clean question text - removes markdown, leading text, and extracts just the question
    private cleanQuestionText(text: string): string {
        if (!text) return text;

        let cleaned = text;

        // Remove markdown code blocks (```json, ```, etc.)
        cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').replace(/```/g, '');

        // Remove leading descriptive text patterns (before any JSON or question)
        cleaned = cleaned.replace(/^Here are \d+.*?questions?.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^Here are.*?interview questions?.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^The following.*?questions?.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^.*?highly specific.*?questions?.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^.*?for a.*?position.*?:?\s*/i, '');

        // If the entire text is a JSON structure, extract the question from it
        // Try to extract JSON array first
        const jsonArrayMatch = cleaned.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (jsonArrayMatch) {
            try {
                const jsonData = JSON.parse(jsonArrayMatch[0]);
                if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].question) {
                    return jsonData[0].question.trim();
                }
            } catch (e) {
                // Continue with other extraction methods
            }
        }

        // Remove any JSON array structure that might be in the text (after trying to extract)
        cleaned = cleaned.replace(/\[\s*\{[\s\S]*?\}\s*\]/g, '');

        // Remove any JSON object structure and extract question
        const jsonObjectMatch = cleaned.match(/\{\s*"question"\s*:\s*"([^"]+)"[\s\S]*?\}/);
        if (jsonObjectMatch && jsonObjectMatch[1]) {
            return jsonObjectMatch[1].trim();
        }
        cleaned = cleaned.replace(/\{\s*"question"\s*:\s*"([^"]+)"[\s\S]*?\}/g, '$1');

        // Try to extract incomplete JSON array (missing closing bracket)
        const incompleteArrayMatch = cleaned.match(/\[\s*\{[\s\S]*/);
        if (incompleteArrayMatch) {
            const jsonStr = incompleteArrayMatch[0];
            // Try to extract question from incomplete JSON
            const questionMatch = jsonStr.match(/"question"\s*:\s*"([^"]*(?:"[^"]*")*[^"]*)/);
            if (questionMatch && questionMatch[1]) {
                // Handle escaped quotes and incomplete strings
                let question = questionMatch[1].replace(/\\"/g, '"');
                // If question doesn't end with quote, it might be incomplete - take what we have
                if (!question.endsWith('"')) {
                    question = question.replace(/["\s]*$/, '');
                } else {
                    question = question.slice(0, -1); // Remove trailing quote
                }
                return question.trim();
            }
        }

        // Extract question from JSON object pattern (handles incomplete JSON and multiline)
        // Use a more robust pattern that handles escaped quotes and newlines
        const questionPattern = /"question"\s*:\s*"((?:[^"\\]|\\.)*?)"/s;
        const questionMatch = cleaned.match(questionPattern);
        if (questionMatch && questionMatch[1]) {
            let extracted = questionMatch[1]
                .replace(/\\"/g, '"')
                .replace(/\\n/g, ' ')
                .replace(/\\t/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            // Make sure we didn't extract JSON structure
            if (!extracted.startsWith('[') && !extracted.startsWith('{')) {
                return extracted;
            }
        }

        // Try pattern for incomplete question (no closing quote) - but only if it doesn't look like JSON
        const incompleteQuestionMatch = cleaned.match(/"question"\s*:\s*"([^"]+)/);
        if (incompleteQuestionMatch && incompleteQuestionMatch[1]) {
            let extracted = incompleteQuestionMatch[1]
                .replace(/\\"/g, '"')
                .replace(/\\n/g, ' ')
                .replace(/\\t/g, ' ')
                .trim();
            // Remove any trailing JSON structure
            extracted = extracted.replace(/["\s,}].*$/, '').trim();
            if (extracted && !extracted.startsWith('[') && !extracted.startsWith('{')) {
                return extracted;
            }
        }

        // Remove JSON structure markers if present
        cleaned = cleaned.replace(/\{\s*"question"\s*:\s*"/, '');
        cleaned = cleaned.replace(/"\s*[,}].*$/, '');
        cleaned = cleaned.replace(/\[\s*\{/, '');
        cleaned = cleaned.replace(/\}\s*\]/, '');

        // Remove numbering (1., 2., etc.)
        cleaned = cleaned.replace(/^\d+\.\s*/, '');

        // Remove "Question X:" patterns
        cleaned = cleaned.replace(/^Question\s*\d*:?\s*/i, '');

        // Trim and clean up
        cleaned = cleaned.trim();

        // Remove quotes if the entire text is quoted
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1);
        }

        cleaned = cleaned.trim();

        // Final validation - if it still looks like JSON structure, try to extract question from it
        if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
            // Try one more time to extract question from JSON
            const lastAttempt = cleaned.match(/"question"\s*:\s*"([^"]+)"/);
            if (lastAttempt && lastAttempt[1]) {
                return lastAttempt[1].trim();
            }
            // If we can't extract, return empty (will be filtered out)
            return '';
        }

        // Remove any remaining intro text patterns
        cleaned = cleaned.replace(/^Here are \d+.*?questions?.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^.*?highly specific.*?questions?.*?:?\s*/i, '');

        return cleaned.trim();
    }

    // Parse AI response
    private parseAIResponse(content: string, request: QuestionGenerationRequest): GeneratedQuestion[] {
        console.log('Parsing AI response, requested questions:', request.numberOfQuestions);
        console.log('Response length:', content.length);
        console.log('Response preview:', content.substring(0, 500));
        
        // Clean content first - remove markdown code blocks
        let cleanedContent = content;
        cleanedContent = cleanedContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').replace(/```/g, '');

        // Remove leading descriptive text before JSON
        cleanedContent = cleanedContent.replace(/^[^[]*?(\[)/, '$1');

        // Try to extract JSON array from the content (handles incomplete arrays too)
        const jsonArrayMatch = cleanedContent.match(/\[\s*\{[\s\S]*/);
        if (jsonArrayMatch) {
            let jsonStr = jsonArrayMatch[0];

            // First, try to extract all question objects using regex (works even with incomplete JSON)
            const questionObjects: any[] = [];

            // Match complete question objects: "question": "text" (handles multiline and escaped quotes)
            // This regex matches the question field value, handling escaped quotes and newlines
            const questionRegex = /"question"\s*:\s*"((?:[^"\\]|\\.|\\n|\\t)*?)"/gs;
            let match;

            while ((match = questionRegex.exec(jsonStr)) !== null) {
                try {
                    let questionText = match[1]
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, ' ')
                        .replace(/\\t/g, ' ')
                        .replace(/\\r/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    // Remove any remaining JSON structure that might be in the question text
                    questionText = questionText.replace(/^\[.*?\]/, '').trim();
                    questionText = questionText.replace(/^\{.*?"question".*?\}/, '').trim();

                    // Remove intro text if somehow still present
                    questionText = questionText.replace(/^Here are \d+.*?questions?.*?:?\s*/i, '');
                    questionText = questionText.replace(/^.*?highly specific.*?questions?.*?:?\s*/i, '');

                    if (questionText && questionText.length > 10 && !questionText.startsWith('[') && !questionText.startsWith('{')) {
                        questionObjects.push({ question: questionText });
                    }
                } catch (e) {
                    // Skip invalid matches
                }
            }

            // If no complete matches, try to extract incomplete questions (missing closing quote)
            if (questionObjects.length === 0) {
                const incompleteRegex = /"question"\s*:\s*"([^"]+)/g;
                let incompleteMatch;
                while ((incompleteMatch = incompleteRegex.exec(jsonStr)) !== null) {
                    const questionText = incompleteMatch[1]
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, ' ')
                        .replace(/\\t/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    // Remove trailing JSON structure if present
                    const cleanText = questionText.replace(/["\s,}].*$/, '').trim();
                    if (cleanText && cleanText.length > 10) {
                        questionObjects.push({ question: cleanText });
                    }
                }
            }

            // If we found question objects, use them
            if (questionObjects.length > 0) {
                console.log(`Found ${questionObjects.length} questions via regex extraction`);
                const questions = questionObjects.slice(0, request.numberOfQuestions)
                    .map((q: any, index: number) => {
                        // Final cleanup pass
                        let questionText = this.cleanQuestionText(q.question);
                        return {
                            id: (Date.now() + index).toString(),
                            question: questionText,
                            category: request.categories[index % request.categories.length] || request.categories[0] || 'technical',
                            type: 'open-ended',
                            difficulty: request.experienceLevel,
                            context: request.customContext,
                            followUpQuestions: [],
                            expectedKeywords: []
                        };
                    })
                    .filter(q => q.question && q.question.length > 10 && !q.question.startsWith('[') && !q.question.startsWith('{') && !q.question.includes('"question"'));
                
                console.log(`Returning ${questions.length} questions after filtering`);
                
                // If we got fewer questions than requested, try to generate more
                if (questions.length < request.numberOfQuestions) {
                    console.warn(`Only got ${questions.length} questions, requested ${request.numberOfQuestions}`);
                }
                
                return questions;
            }

            // Try to parse as complete JSON array
            try {
                // Try to complete the JSON by finding the end
                let completeJson = jsonStr;
                // Count open brackets and try to close them
                const openBraces = (completeJson.match(/\{/g) || []).length;
                const closeBraces = (completeJson.match(/\}/g) || []).length;
                const openBrackets = (completeJson.match(/\[/g) || []).length;
                const closeBrackets = (completeJson.match(/\]/g) || []).length;

                // Add missing closing brackets
                if (openBraces > closeBraces) {
                    completeJson += '}'.repeat(openBraces - closeBraces);
                }
                if (openBrackets > closeBrackets) {
                    completeJson += ']'.repeat(openBrackets - closeBrackets);
                }

                const questions = JSON.parse(completeJson);
                if (Array.isArray(questions)) {
                    return questions.map((q: any, index: number) => {
                        let questionText = (q.question || q.text || '').trim();

                        // Final cleanup - ensure no JSON structure remains
                        questionText = this.cleanQuestionText(questionText);

                        return {
                            id: (Date.now() + index).toString(),
                            question: questionText,
                            category: q.category || request.categories[0] || 'technical',
                            type: q.type || 'open-ended',
                            difficulty: q.difficulty || request.experienceLevel,
                            context: request.customContext,
                            followUpQuestions: q.followUpQuestions || [],
                            expectedKeywords: q.expectedKeywords || []
                        };
                    }).filter(q => q.question && q.question.length > 10 && !q.question.startsWith('[') && !q.question.startsWith('{') && !q.question.includes('"question"')); // Filter out invalid questions
                }
            } catch (e) {
                console.log('Failed to parse JSON array, trying text extraction...');
            }
        }

        // Try to parse entire content as direct JSON
        try {
            const questions = JSON.parse(cleanedContent);
            if (Array.isArray(questions)) {
                return questions.map((q: any, index: number) => {
                    let questionText = (q.question || q.text || '').trim();
                    questionText = this.cleanQuestionText(questionText);

                    return {
                        id: (Date.now() + index).toString(),
                        question: questionText,
                        category: q.category || request.categories[0] || 'technical',
                        type: q.type || 'open-ended',
                        difficulty: q.difficulty || request.experienceLevel,
                        context: request.customContext,
                        followUpQuestions: q.followUpQuestions || [],
                        expectedKeywords: q.expectedKeywords || []
                    };
                }).filter(q => q.question && q.question.length > 10 && !q.question.startsWith('[') && !q.question.startsWith('{') && !q.question.includes('"question"'));
            }

            // If it's a single object
            if (questions && questions.question) {
                let questionText = questions.question.trim();
                questionText = this.cleanQuestionText(questionText);

                return [{
                    id: Date.now().toString(),
                    question: questionText,
                    category: questions.category || request.categories[0] || 'technical',
                    type: questions.type || 'open-ended',
                    difficulty: questions.difficulty || request.experienceLevel,
                    context: request.customContext,
                    followUpQuestions: questions.followUpQuestions || [],
                    expectedKeywords: questions.expectedKeywords || []
                }];
            }
        } catch (error) {
            // If JSON parsing fails, try to extract questions from text response
            console.log('JSON parsing failed, trying text extraction...');
        }

        // Fallback to text extraction
        return this.extractQuestionsFromText(content, request);
    }

    private extractQuestionsFromText(content: string, request: QuestionGenerationRequest): GeneratedQuestion[] {
        const questions: GeneratedQuestion[] = [];

        // Split content by common question patterns
        const questionPatterns = [
            /(\d+\.\s*[^?]+\?)/g,
            /([A-Z][^?]+\?)/g,
            /(Question\s*\d*:?\s*[^?]+\?)/gi
        ];

        let extractedTexts: string[] = [];

        for (const pattern of questionPatterns) {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
                extractedTexts = matches;
                break;
            }
        }

        // If no patterns match, try to split by lines and filter for questions
        if (extractedTexts.length === 0) {
            const lines = content.split('\n').filter(line =>
                line.trim().length > 10 &&
                (line.includes('?') || line.includes('Question'))
            );
            extractedTexts = lines.slice(0, 5); // Take first 5 potential questions
        }

        // Create question objects
        extractedTexts.forEach((text, index) => {
            if (text.trim().length > 10) {
                const cleanedQuestion = this.cleanQuestionText(text);
                if (cleanedQuestion && cleanedQuestion.length > 10) {
                    questions.push({
                        id: (Date.now() + index).toString(),
                        question: cleanedQuestion,
                        category: request.categories[0] || 'technical',
                        type: 'open-ended',
                        difficulty: request.experienceLevel,
                        context: request.customContext,
                        followUpQuestions: [],
                        expectedKeywords: []
                    });
                }
            }
        });

        // If still no questions, create a fallback
        if (questions.length === 0) {
            questions.push({
                id: Date.now().toString(),
                question: `Tell me about your experience with ${request.position} and how you would approach solving complex problems in this role.`,
                category: request.categories[0] || 'technical',
                type: 'open-ended',
                difficulty: request.experienceLevel,
                context: request.customContext,
                followUpQuestions: [],
                expectedKeywords: []
            });
        }

        return questions.slice(0, request.numberOfQuestions);
    }

    // Get relevant templates
    private async getRelevantTemplates(request: QuestionGenerationRequest): Promise<QuestionTemplate[]> {
        try {
            // First, try to get templates for the exact difficulty and categories
            let result = await query(
                `SELECT qt.*, qc.name as category_name 
                 FROM question_templates qt
                 JOIN question_categories qc ON qt.category_id = qc.id
                 WHERE qt.is_active = true 
                 AND qt.difficulty = $1
                 AND qc.name = ANY($2)
                 ORDER BY RANDOM()`,
                [request.difficulty, request.categories]
            );

            let templates = result.rows.map((row: any) => ({
                id: row.id,
                category: row.category_name,
                type: row.type,
                template: row.template,
                variables: row.variables || [],
                difficulty: row.difficulty
            }));

            // If we don't have enough templates, get more from related categories
            if (templates.length < request.numberOfQuestions) {
                const additionalResult = await query(
                    `SELECT qt.*, qc.name as category_name 
                     FROM question_templates qt
                     JOIN question_categories qc ON qt.category_id = qc.id
                     WHERE qt.is_active = true 
                     AND qt.difficulty = $1
                     AND qc.name NOT IN (SELECT unnest($2::text[]))
                     ORDER BY RANDOM()
                     LIMIT $3`,
                    [request.difficulty, request.categories, request.numberOfQuestions - templates.length]
                );

                const additionalTemplates = additionalResult.rows.map((row: any) => ({
                    id: row.id,
                    category: row.category_name,
                    type: row.type,
                    template: row.template,
                    variables: row.variables || [],
                    difficulty: row.difficulty
                }));

                templates = [...templates, ...additionalTemplates];
            }

            // If still not enough, get templates from different difficulties
            if (templates.length < request.numberOfQuestions) {
                const difficulties = ['beginner', 'intermediate', 'advanced'].filter(d => d !== request.difficulty);

                for (const difficulty of difficulties) {
                    if (templates.length >= request.numberOfQuestions) break;

                    const fallbackResult = await query(
                        `SELECT qt.*, qc.name as category_name 
                         FROM question_templates qt
                         JOIN question_categories qc ON qt.category_id = qc.id
                         WHERE qt.is_active = true 
                         AND qt.difficulty = $1
                         ORDER BY RANDOM()
                         LIMIT $2`,
                        [difficulty, request.numberOfQuestions - templates.length]
                    );

                    const fallbackTemplates = fallbackResult.rows.map((row: any) => ({
                        id: row.id,
                        category: row.category_name,
                        type: row.type,
                        template: row.template,
                        variables: row.variables || [],
                        difficulty: row.difficulty
                    }));

                    templates = [...templates, ...fallbackTemplates];
                }
            }

            return templates;
        } catch (error) {
            console.error('Error getting templates:', error);
            return [];
        }
    }

    // Create question session
    private async createQuestionSession(request: QuestionGenerationRequest, sessionId: string): Promise<void> {
        await query(
            `INSERT INTO question_sessions (user_id, session_id, position, experience_level, categories, difficulty, custom_context)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                request.userId,
                sessionId,
                request.position,
                request.experienceLevel,
                JSON.stringify(request.categories),
                request.difficulty,
                request.customContext
            ]
        );
    }

    // Store generated questions
    private async storeGeneratedQuestions(sessionId: string, questions: GeneratedQuestion[]): Promise<GeneratedQuestion[]> {
        const storedQuestions: GeneratedQuestion[] = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const result = await query(
                `INSERT INTO generated_questions (session_id, question, category, type, difficulty, context, follow_up_questions, expected_keywords, order_index)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                    sessionId,
                    q.question,
                    q.category,
                    q.type,
                    q.difficulty,
                    q.context,
                    JSON.stringify(q.followUpQuestions),
                    JSON.stringify(q.expectedKeywords),
                    i
                ]
            );
            // Return question with database ID
            storedQuestions.push({
                ...q,
                id: result.rows[0].id
            });
        }
        return storedQuestions;
    }

    // Generate unique session ID
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export default AIQuestionService;
