-- Question answers table for storing user responses
CREATE TABLE IF NOT EXISTS question_answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES generated_questions(id) ON DELETE CASCADE,
    session_id VARCHAR(100) REFERENCES question_sessions(session_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    answer_type VARCHAR(20) DEFAULT 'text' CHECK (answer_type IN ('text', 'voice', 'video')),
    recording_path VARCHAR(500), -- Path to audio/video recording if applicable
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_session_id ON question_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_user_id ON question_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_submitted_at ON question_answers(submitted_at);

-- Create trigger for updated_at
CREATE TRIGGER update_question_answers_updated_at BEFORE UPDATE ON question_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



