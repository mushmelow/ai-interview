"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../database/connection");
class AIQuestionService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY || '';
        console.log('OpenAI API Key loaded:', this.openaiApiKey ? 'Yes (length: ' + this.openaiApiKey.length + ')' : 'No');
        console.log('Using Ollama for free AI question generation');
    }
    async generateQuestions(request) {
        try {
            const sessionId = this.generateSessionId();
            await this.createQuestionSession(request, sessionId);
            const questions = await this.generateQuestionsWithAI(request);
            await this.storeGeneratedQuestions(sessionId, questions);
            return {
                success: true,
                questions,
                sessionId,
                metadata: {
                    position: request.position,
                    experienceLevel: request.experienceLevel,
                    categories: request.categories,
                    generatedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            console.error('Error generating questions:', error);
            throw error;
        }
    }
    async getSessionQuestions(sessionId) {
        try {
            const result = await (0, connection_1.query)(`SELECT * FROM generated_questions 
                 WHERE session_id = $1 
                 ORDER BY order_index ASC`, [sessionId]);
            return result.rows.map(row => ({
                id: row.id,
                question: row.question,
                category: row.category,
                type: row.type,
                difficulty: row.difficulty,
                context: row.context,
                followUpQuestions: row.follow_up_questions || [],
                expectedKeywords: row.expected_keywords || []
            }));
        }
        catch (error) {
            console.error('Error getting session questions:', error);
            throw new Error('Failed to retrieve questions');
        }
    }
    async generateQuestionsWithAI(request) {
        try {
            const prompt = this.buildPrompt(request);
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
                                max_tokens: 2000
                            }
                        })
                    });
                    if (response.ok) {
                        console.log(`✅ Using Ollama model: ${model}`);
                        break;
                    }
                    else {
                        const errorData = await response.json();
                        lastError = errorData.error || `HTTP ${response.status}`;
                        console.log(`❌ Model ${model} failed: ${lastError}`);
                    }
                }
                catch (error) {
                    lastError = error.message;
                    console.log(`❌ Model ${model} error: ${lastError}`);
                }
            }
            if (!response || !response.ok) {
                throw new Error(`All Ollama models failed. Last error: ${lastError}. Please install a model with: ollama pull llama3.2:1b`);
            }
            const data = await response.json();
            return this.parseAIResponse(data.response, request);
        }
        catch (error) {
            console.error('Ollama API error:', error);
            throw error;
        }
    }
    async generateQuestionsFromTemplates(request, templates) {
        const questions = [];
        const usedTemplates = new Set();
        for (let i = 0; i < request.numberOfQuestions; i++) {
            const templateIndex = i % templates.length;
            const template = templates[templateIndex];
            const variedRequest = { ...request };
            if (i >= templates.length) {
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
    fillTemplate(template, request) {
        let question = template.template;
        const replacements = {
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
    getTechnologyForPosition(position) {
        const techMap = {
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
        if (lowerPosition.includes('react'))
            return techMap['react'];
        if (lowerPosition.includes('vue'))
            return techMap['vue'];
        if (lowerPosition.includes('angular'))
            return techMap['angular'];
        if (lowerPosition.includes('c#') || lowerPosition.includes('csharp'))
            return techMap['c#'];
        if (lowerPosition.includes('dotnet') || lowerPosition.includes('.net'))
            return techMap['dotnet'];
        if (lowerPosition.includes('java'))
            return techMap['java'];
        if (lowerPosition.includes('python'))
            return techMap['python'];
        if (lowerPosition.includes('node'))
            return techMap['node'];
        for (const [key, value] of Object.entries(techMap)) {
            if (lowerPosition.includes(key)) {
                return value;
            }
        }
        return 'relevant technologies and tools';
    }
    getScenarioForPosition(position) {
        const scenarios = {
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
        if (lowerPosition.includes('react'))
            return scenarios['react'];
        if (lowerPosition.includes('vue'))
            return scenarios['vue'];
        if (lowerPosition.includes('angular'))
            return scenarios['angular'];
        if (lowerPosition.includes('c#') || lowerPosition.includes('csharp'))
            return scenarios['c#'];
        if (lowerPosition.includes('dotnet') || lowerPosition.includes('.net'))
            return scenarios['dotnet'];
        if (lowerPosition.includes('java'))
            return scenarios['java'];
        if (lowerPosition.includes('python'))
            return scenarios['python'];
        if (lowerPosition.includes('node'))
            return scenarios['node'];
        for (const [key, value] of Object.entries(scenarios)) {
            if (lowerPosition.includes(key)) {
                return value;
            }
        }
        return 'a complex technical challenge';
    }
    getConstraintForLevel(level) {
        const constraints = {
            'entry': 'limited resources and tight deadlines',
            'mid': 'complex requirements and multiple stakeholders',
            'senior': 'ambiguous requirements and high-stakes decisions'
        };
        return constraints[level] || constraints['mid'];
    }
    getSituationForType(type) {
        const situations = {
            'behavioral': 'conflicting priorities',
            'technical': 'technical disagreements',
            'situational': 'unexpected challenges',
            'cultural': 'diverse team dynamics'
        };
        return situations[type] || 'difficult situations';
    }
    getDomainForPosition(position) {
        return this.getTechnologyForPosition(position);
    }
    getCompanyValue() {
        const values = ['innovation', 'collaboration', 'excellence', 'integrity', 'customer focus'];
        return values[Math.floor(Math.random() * values.length)];
    }
    getChallengeForLevel(level) {
        const challenges = {
            'entry': 'a difficult technical problem',
            'mid': 'a complex project with multiple teams',
            'senior': 'a major organizational change'
        };
        return challenges[level] || challenges['mid'];
    }
    getSystemForPosition(position) {
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
    generateFollowUpQuestions(type) {
        const followUps = {
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
    getExpectedKeywords(type, position) {
        const keywords = {
            'behavioral': ['problem-solving', 'communication', 'teamwork', 'leadership'],
            'technical': ['architecture', 'best practices', 'testing', 'optimization'],
            'situational': ['analysis', 'decision-making', 'prioritization', 'results'],
            'cultural': ['values', 'collaboration', 'growth', 'impact']
        };
        const baseKeywords = keywords[type] || keywords['behavioral'];
        const positionKeywords = this.getPositionKeywords(position);
        return [...baseKeywords, ...positionKeywords];
    }
    getPositionKeywords(position) {
        const keywords = {
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
        if (lowerPosition.includes('c#') || lowerPosition.includes('csharp'))
            return keywords['c#'];
        if (lowerPosition.includes('dotnet') || lowerPosition.includes('.net'))
            return keywords['dotnet'];
        if (lowerPosition.includes('java'))
            return keywords['java'];
        if (lowerPosition.includes('python'))
            return keywords['python'];
        if (lowerPosition.includes('node'))
            return keywords['node'];
        for (const [key, value] of Object.entries(keywords)) {
            if (lowerPosition.includes(key)) {
                return value;
            }
        }
        return [];
    }
    buildPrompt(request) {
        const roleContext = this.getRoleSpecificContext(request.position);
        const experienceContext = this.getExperienceLevelContext(request.experienceLevel);
        const categoryContext = this.getCategoryContext(request.categories);
        return `You are an expert technical recruiter and interviewer. Generate ${request.numberOfQuestions} highly specific, role-targeted interview questions for a ${request.experienceLevel} ${request.position} position.

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

OUTPUT FORMAT:
Return a JSON array of objects with these exact keys:
- "question": The interview question (string)
- "category": One of: ${request.categories.join(', ')} (string)
- "type": One of: "technical", "behavioral", "situational", "cultural" (string)
- "difficulty": "${request.difficulty}" (string)
- "followUpQuestions": Array of 2-3 follow-up questions (string[])
- "expectedKeywords": Array of 3-5 keywords a good answer should include (string[])

IMPORTANT: Make each question unique, specific to the ${request.position} role, and progressively challenging. Avoid generic questions that could apply to any role.`;
    }
    getRoleSpecificContext(position) {
        const roleContexts = {
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
        for (const [key, value] of Object.entries(roleContexts)) {
            const baseRole = key.replace(' developer', '').replace(' engineer', '').replace(' manager', '').replace(' designer', '');
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
        return `
- Role: ${position}
- Focus: General software development and problem-solving
- Key areas: Technical skills, problem-solving, communication, teamwork
- Common challenges: Technical implementation, system design, collaboration, continuous learning
- Skills to assess: Technical proficiency, analytical thinking, communication, adaptability
- Real-world scenarios: Problem-solving, technical implementation, team collaboration, project delivery`;
    }
    getExperienceLevelContext(level) {
        const levelContexts = {
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
    getCategoryContext(categories) {
        const categoryDescriptions = {
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
    parseAIResponse(content, request) {
        try {
            const questions = JSON.parse(content);
            return questions.map((q, index) => ({
                id: (Date.now() + index).toString(),
                question: q.question,
                category: q.category,
                type: q.type,
                difficulty: q.difficulty,
                context: request.customContext,
                followUpQuestions: q.followUpQuestions || [],
                expectedKeywords: q.expectedKeywords || []
            }));
        }
        catch (error) {
            console.error('Error parsing AI response:', error);
            throw new Error('Invalid AI response format');
        }
    }
    async getRelevantTemplates(request) {
        try {
            let result = await (0, connection_1.query)(`SELECT qt.*, qc.name as category_name 
                 FROM question_templates qt
                 JOIN question_categories qc ON qt.category_id = qc.id
                 WHERE qt.is_active = true 
                 AND qt.difficulty = $1
                 AND qc.name = ANY($2)
                 ORDER BY RANDOM()`, [request.difficulty, request.categories]);
            let templates = result.rows.map(row => ({
                id: row.id,
                category: row.category_name,
                type: row.type,
                template: row.template,
                variables: row.variables || [],
                difficulty: row.difficulty
            }));
            if (templates.length < request.numberOfQuestions) {
                const additionalResult = await (0, connection_1.query)(`SELECT qt.*, qc.name as category_name 
                     FROM question_templates qt
                     JOIN question_categories qc ON qt.category_id = qc.id
                     WHERE qt.is_active = true 
                     AND qt.difficulty = $1
                     AND qc.name NOT IN (SELECT unnest($2::text[]))
                     ORDER BY RANDOM()
                     LIMIT $3`, [request.difficulty, request.categories, request.numberOfQuestions - templates.length]);
                const additionalTemplates = additionalResult.rows.map(row => ({
                    id: row.id,
                    category: row.category_name,
                    type: row.type,
                    template: row.template,
                    variables: row.variables || [],
                    difficulty: row.difficulty
                }));
                templates = [...templates, ...additionalTemplates];
            }
            if (templates.length < request.numberOfQuestions) {
                const difficulties = ['beginner', 'intermediate', 'advanced'].filter(d => d !== request.difficulty);
                for (const difficulty of difficulties) {
                    if (templates.length >= request.numberOfQuestions)
                        break;
                    const fallbackResult = await (0, connection_1.query)(`SELECT qt.*, qc.name as category_name 
                         FROM question_templates qt
                         JOIN question_categories qc ON qt.category_id = qc.id
                         WHERE qt.is_active = true 
                         AND qt.difficulty = $1
                         ORDER BY RANDOM()
                         LIMIT $2`, [difficulty, request.numberOfQuestions - templates.length]);
                    const fallbackTemplates = fallbackResult.rows.map(row => ({
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
        }
        catch (error) {
            console.error('Error getting templates:', error);
            return [];
        }
    }
    async createQuestionSession(request, sessionId) {
        await (0, connection_1.query)(`INSERT INTO question_sessions (user_id, session_id, position, experience_level, categories, difficulty, custom_context)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            request.userId,
            sessionId,
            request.position,
            request.experienceLevel,
            JSON.stringify(request.categories),
            request.difficulty,
            request.customContext
        ]);
    }
    async storeGeneratedQuestions(sessionId, questions) {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            await (0, connection_1.query)(`INSERT INTO generated_questions (session_id, question, category, type, difficulty, context, follow_up_questions, expected_keywords, order_index)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                sessionId,
                q.question,
                q.category,
                q.type,
                q.difficulty,
                q.context,
                JSON.stringify(q.followUpQuestions),
                JSON.stringify(q.expectedKeywords),
                i
            ]);
        }
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.default = AIQuestionService;
//# sourceMappingURL=AIQuestionService.js.map