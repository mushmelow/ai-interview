-- Create Interview Analyses Table
CREATE TABLE IF NOT EXISTS interview_analyses (
    id VARCHAR(255) PRIMARY KEY,
    interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    transcript TEXT NOT NULL,
    sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    emotions TEXT[] DEFAULT ARRAY[]::TEXT[],
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
    completeness_score INTEGER NOT NULL CHECK (completeness_score >= 0 AND completeness_score <= 100),
    clarity_score INTEGER NOT NULL CHECK (clarity_score >= 0 AND clarity_score <= 100),
    technical_score INTEGER NOT NULL CHECK (technical_score >= 0 AND technical_score <= 100),
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
    improvements TEXT[] DEFAULT ARRAY[]::TEXT[],
    suggestions TEXT[] DEFAULT ARRAY[]::TEXT[],
    duration INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,
    speaking_rate INTEGER NOT NULL DEFAULT 0,
    pause_frequency DECIMAL(5,2) NOT NULL DEFAULT 0,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_analyses_interview_id ON interview_analyses(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_analyses_analyzed_at ON interview_analyses(analyzed_at);

-- Add analysis status to interviews table
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(20) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS analysis_id VARCHAR(255) REFERENCES interview_analyses(id);

-- Create index for analysis status
CREATE INDEX IF NOT EXISTS idx_interviews_analysis_status ON interviews(analysis_status);
