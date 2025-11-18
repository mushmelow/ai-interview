-- Question categories
CREATE TABLE IF NOT EXISTS question_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question templates
CREATE TABLE IF NOT EXISTS question_templates (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES question_categories(id),
    type VARCHAR(50) CHECK (type IN ('behavioral', 'technical', 'situational', 'cultural')),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated questions sessions
CREATE TABLE IF NOT EXISTS question_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    position VARCHAR(200),
    experience_level VARCHAR(20),
    categories JSONB DEFAULT '[]',
    difficulty VARCHAR(20),
    custom_context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated questions
CREATE TABLE IF NOT EXISTS generated_questions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES question_sessions(session_id),
    question TEXT NOT NULL,
    category VARCHAR(100),
    type VARCHAR(50),
    difficulty VARCHAR(20),
    context TEXT,
    follow_up_questions JSONB DEFAULT '[]',
    expected_keywords JSONB DEFAULT '[]',
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default question categories
INSERT INTO question_categories (name, description, difficulty) VALUES
('Technical Skills', 'Questions about programming, tools, and technical knowledge', 'intermediate'),
('Problem Solving', 'Scenarios requiring analytical thinking and solution design', 'intermediate'),
('Communication', 'Questions about teamwork, leadership, and interpersonal skills', 'beginner'),
('Experience', 'Questions about past projects, achievements, and career history', 'beginner'),
('Cultural Fit', 'Questions about values, work style, and company alignment', 'beginner'),
('Leadership', 'Questions about management, mentoring, and team building', 'advanced'),
('Innovation', 'Questions about creativity, new ideas, and future thinking', 'intermediate')
ON CONFLICT (name) DO NOTHING;

-- Insert sample question templates
INSERT INTO question_templates (category_id, type, template, variables, difficulty) VALUES
(1, 'technical', 'Tell me about your experience with {technology}. How would you approach {scenario}?', '["technology", "scenario"]', 'intermediate'),
(2, 'situational', 'Describe a time when you had to solve a complex problem with {constraint}. What was your approach?', '["constraint"]', 'intermediate'),
(3, 'behavioral', 'How do you handle {situation} in a team environment? Give me a specific example.', '["situation"]', 'beginner'),
(4, 'behavioral', 'Walk me through your most challenging project involving {domain}. What did you learn?', '["domain"]', 'intermediate'),
(5, 'cultural', 'What motivates you in your work? How do you align with {company_value}?', '["company_value"]', 'beginner'),
(6, 'behavioral', 'Describe a time when you had to lead a team through {challenge}. How did you handle it?', '["challenge"]', 'advanced'),
(7, 'situational', 'If you could redesign {system}, what improvements would you make and why?', '["system"]', 'intermediate')
ON CONFLICT DO NOTHING;
