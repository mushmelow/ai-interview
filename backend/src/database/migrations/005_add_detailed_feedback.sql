-- Add detailed feedback columns to question_answers table
ALTER TABLE question_answers 
ADD COLUMN IF NOT EXISTS strengths TEXT[],
ADD COLUMN IF NOT EXISTS improvements TEXT[],
ADD COLUMN IF NOT EXISTS suggestions TEXT[];

-- Create index for score queries
CREATE INDEX IF NOT EXISTS idx_question_answers_strengths ON question_answers USING GIN(strengths);

