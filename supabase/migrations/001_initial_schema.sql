-- Initial schema migration for notes-ai application
-- Version: 1.0.0
-- Description: Create notes and notecards tables with multi-user support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled',
    content JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create notecards table
CREATE TABLE IF NOT EXISTS notecards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    front_content JSONB NOT NULL DEFAULT '[]',
    back_content JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_id_user ON notes(id, user_id);

CREATE INDEX IF NOT EXISTS idx_notecards_user_id ON notecards(user_id);
CREATE INDEX IF NOT EXISTS idx_notecards_user_updated ON notecards(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notecards_id_user ON notecards(id, user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notecards_updated_at
    BEFORE UPDATE ON notecards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 