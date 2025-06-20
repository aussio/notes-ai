-- Spaced repetition tables migration
-- Version: 1.1.0
-- Description: Add tables for spaced repetition functionality

-- Create notecard review stats table
CREATE TABLE IF NOT EXISTS notecard_review_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notecard_id UUID NOT NULL REFERENCES notecards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    easiness_factor DECIMAL(3,2) DEFAULT 2.5, -- SM-2 ease factor (1.3 to 2.5+)
    interval_days INTEGER DEFAULT 1, -- Current interval in days
    repetitions INTEGER DEFAULT 0, -- Number of successful reviews
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When card is due
    last_review_date TIMESTAMP WITH TIME ZONE NULL, -- Last review timestamp (null for new cards)
    total_reviews INTEGER DEFAULT 0, -- Total review count
    correct_reviews INTEGER DEFAULT 0, -- Successful reviews
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one stats record per notecard per user
    UNIQUE(notecard_id, user_id)
);

-- Create review sessions table
CREATE TABLE IF NOT EXISTS review_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NULL,
    cards_reviewed INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notecard_review_stats_user_id ON notecard_review_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_notecard_review_stats_notecard_id ON notecard_review_stats(notecard_id);
CREATE INDEX IF NOT EXISTS idx_notecard_review_stats_user_notecard ON notecard_review_stats(user_id, notecard_id);
CREATE INDEX IF NOT EXISTS idx_notecard_review_stats_next_review ON notecard_review_stats(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_notecard_review_stats_due_cards ON notecard_review_stats(user_id, next_review_date) WHERE next_review_date <= NOW();

CREATE INDEX IF NOT EXISTS idx_review_sessions_user_id ON review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_user_date ON review_sessions(user_id, start_time DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_notecard_review_stats_updated_at
    BEFORE UPDATE ON notecard_review_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_sessions_updated_at
    BEFORE UPDATE ON review_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 