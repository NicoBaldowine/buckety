-- Buckety Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable Row Level Security (RLS)
-- Note: You can enable authentication later if needed

-- Create enum for activity types
CREATE TYPE activity_type AS ENUM (
  'bucket_created',
  'money_added',
  'money_removed', 
  'withdrawal',
  'apy_earnings',
  'auto_deposit'
);

-- 1. Buckets table - stores user savings buckets
CREATE TABLE buckets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  target_amount DECIMAL(10,2) NOT NULL,
  background_color TEXT NOT NULL DEFAULT '#B6F3AD',
  apy DECIMAL(5,2) DEFAULT 3.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Activities table - stores comprehensive transaction history for buckets
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id UUID REFERENCES buckets(id) ON DELETE CASCADE NOT NULL,
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0, -- Can be 0 for non-monetary activities like bucket_created
  from_source TEXT, -- e.g., 'Main Bucket', 'External Account', null for earnings
  to_destination TEXT, -- e.g., 'Main Bucket', 'External Account', null for deposits
  date DATE NOT NULL,
  description TEXT, -- Additional details about the activity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Main bucket table - stores the main account balance for each user
CREATE TABLE main_bucket (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_amount DECIMAL(10,2) DEFAULT 1200.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_buckets_user_id ON buckets(user_id);
CREATE INDEX idx_buckets_created_at ON buckets(created_at);
CREATE INDEX idx_activities_bucket_id ON activities(bucket_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_main_bucket_user_id ON main_bucket(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_bucket ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buckets table
CREATE POLICY "Users can view their own buckets" 
  ON buckets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own buckets" 
  ON buckets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buckets" 
  ON buckets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buckets" 
  ON buckets FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for activities table (activities belong to buckets, which belong to users)
CREATE POLICY "Users can view activities for their own buckets" 
  ON activities FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM buckets 
    WHERE buckets.id = activities.bucket_id 
    AND buckets.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert activities for their own buckets" 
  ON activities FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM buckets 
    WHERE buckets.id = activities.bucket_id 
    AND buckets.user_id = auth.uid()
  ));

-- RLS Policies for main_bucket table
CREATE POLICY "Users can view their own main bucket" 
  ON main_bucket FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own main bucket" 
  ON main_bucket FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own main bucket" 
  ON main_bucket FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_buckets_updated_at 
  BEFORE UPDATE ON buckets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_main_bucket_updated_at 
  BEFORE UPDATE ON main_bucket 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- Note: This will only work if you have authentication disabled or are logged in

-- Sample buckets
-- INSERT INTO buckets (title, current_amount, target_amount, background_color, apy) VALUES
--   ('Vacation Fund 🏖️', 1250, 3000, '#B6F3AD', 3.8),
--   ('Emergency Fund 🚨', 890, 2000, '#BFB0FF', 4.2),
--   ('New Car 🚗', 2300, 8000, '#FDB86A', 3.5),
--   ('Electronic Drumset 🥁', 675, 1500, '#FF97D0', 4.0),
--   ('Gaming Setup 🎮', 420, 2500, '#A3D5FF', 3.9),
--   ('Coffee Shop Business ☕', 1800, 5000, '#FFB366', 4.1);

-- Sample activities for the first bucket showing different activity types
-- (update bucket_id as needed)
-- INSERT INTO activities (bucket_id, activity_type, title, amount, from_source, to_destination, date, description) VALUES
--   ((SELECT id FROM buckets WHERE title LIKE 'Vacation Fund%' LIMIT 1), 'bucket_created', 'Bucket created', 0, null, null, '2024-11-01', 'Vacation Fund bucket was created with target of $3,000'),
--   ((SELECT id FROM buckets WHERE title LIKE 'Vacation Fund%' LIMIT 1), 'money_added', 'Money transfer', 200, 'Main Bucket', null, '2024-12-15', 'Monthly savings transfer'),
--   ((SELECT id FROM buckets WHERE title LIKE 'Vacation Fund%' LIMIT 1), 'money_added', 'Bonus allocation', 500, 'Main Bucket', null, '2024-12-10', 'End of year bonus added'),
--   ((SELECT id FROM buckets WHERE title LIKE 'Vacation Fund%' LIMIT 1), 'auto_deposit', 'Weekly auto-deposit', 50, 'Main Bucket', null, '2024-12-08', 'Automatic weekly savings'),
--   ((SELECT id FROM buckets WHERE title LIKE 'Vacation Fund%' LIMIT 1), 'apy_earnings', 'Interest earned', 12.50, null, null, '2024-12-01', 'Monthly interest at 3.8% APY'),
--   ((SELECT id FROM buckets WHERE title LIKE 'Vacation Fund%' LIMIT 1), 'money_removed', 'Partial withdrawal', -100, null, 'Main Bucket', '2024-11-20', 'Emergency expense coverage'),
--   ((SELECT id FROM buckets WHERE title LIKE 'Vacation Fund%' LIMIT 1), 'money_added', 'Initial deposit', 500, 'Main Bucket', null, '2024-11-01', 'Starting the vacation savings');

-- Insert default main bucket
-- INSERT INTO main_bucket (current_amount) VALUES (1200.00);