-- Disable Row Level Security for development
-- Version: 1.1.0
-- Description: Drop existing RLS policies and disable RLS until authentication is implemented in Phase 8

-- Drop existing RLS policies on notes table (if they exist)
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Drop existing RLS policies on notecards table (if they exist)  
DROP POLICY IF EXISTS "Users can view their own notecards" ON notecards;
DROP POLICY IF EXISTS "Users can create their own notecards" ON notecards;
DROP POLICY IF EXISTS "Users can update their own notecards" ON notecards;
DROP POLICY IF EXISTS "Users can delete their own notecards" ON notecards;

-- Disable RLS on both tables
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notecards DISABLE ROW LEVEL SECURITY;

-- Note: RLS will be re-enabled in Phase 8 when we implement authentication
-- with proper policies for authenticated users 