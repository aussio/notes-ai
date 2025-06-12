-- Row Level Security policies for multi-user data isolation
-- Version: 1.1.0
-- Description: Enable RLS and create policies for notes and notecards tables

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notecards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notes table
CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for notecards table
CREATE POLICY "Users can view their own notecards" ON notecards
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own notecards" ON notecards
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notecards" ON notecards
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own notecards" ON notecards
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profiles table for user metadata
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 