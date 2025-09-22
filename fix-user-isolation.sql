-- Fix user data isolation in Supabase
-- This script ensures each user only sees their own data

-- Enable RLS on buckets table
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own buckets" ON buckets;
DROP POLICY IF EXISTS "Users can only insert their own buckets" ON buckets;
DROP POLICY IF EXISTS "Users can only update their own buckets" ON buckets;
DROP POLICY IF EXISTS "Users can only delete their own buckets" ON buckets;

-- Create policies for buckets table
CREATE POLICY "Users can only see their own buckets" ON buckets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own buckets" ON buckets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own buckets" ON buckets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own buckets" ON buckets
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on activities table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own activities" ON activities;
DROP POLICY IF EXISTS "Users can only insert their own activities" ON activities;
DROP POLICY IF EXISTS "Users can only update their own activities" ON activities;
DROP POLICY IF EXISTS "Users can only delete their own activities" ON activities;

-- Create policies for activities table
CREATE POLICY "Users can only see their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on main_bucket table
ALTER TABLE main_bucket ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own main bucket" ON main_bucket;
DROP POLICY IF EXISTS "Users can only insert their own main bucket" ON main_bucket;
DROP POLICY IF EXISTS "Users can only update their own main bucket" ON main_bucket;
DROP POLICY IF EXISTS "Users can only delete their own main bucket" ON main_bucket;

-- Create policies for main_bucket table
CREATE POLICY "Users can only see their own main bucket" ON main_bucket
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own main bucket" ON main_bucket
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own main bucket" ON main_bucket
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own main bucket" ON main_bucket
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on auto_deposits table
ALTER TABLE auto_deposits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own auto deposits" ON auto_deposits;
DROP POLICY IF EXISTS "Users can only insert their own auto deposits" ON auto_deposits;
DROP POLICY IF EXISTS "Users can only update their own auto deposits" ON auto_deposits;
DROP POLICY IF EXISTS "Users can only delete their own auto deposits" ON auto_deposits;

-- Create policies for auto_deposits table
CREATE POLICY "Users can only see their own auto deposits" ON auto_deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own auto deposits" ON auto_deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own auto deposits" ON auto_deposits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own auto deposits" ON auto_deposits
  FOR DELETE USING (auth.uid() = user_id);