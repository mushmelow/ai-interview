-- Add score column to question_answers table for AI scoring
ALTER TABLE question_answers 
ADD COLUMN IF NOT EXISTS score DECIMAL(3,1) CHECK (score >= 0 AND score <= 10),
ADD COLUMN IF NOT EXISTS score_feedback TEXT,
ADD COLUMN IF NOT EXISTS scored_at TIMESTAMP WITH TIME ZONE;

-- Create index for score queries
CREATE INDEX IF NOT EXISTS idx_question_answers_score ON question_answers(score);

