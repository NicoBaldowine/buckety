-- Buckety Database Schema for Supabase (Safe Version)
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Create enum for activity types (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM (
      'bucket_created',
      'bucket_completed',
      'money_added',
      'money_removed', 
      'withdrawal',
      'apy_earnings',
      'auto_deposit',
      'auto_deposit_started'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Buckets table - stores user savings buckets (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS buckets (
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

-- 2. Activities table - stores comprehensive transaction history for buckets (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id UUID REFERENCES buckets(id) ON DELETE CASCADE NOT NULL,
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  from_source TEXT,
  to_destination TEXT,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Main bucket table - stores the main account balance for each user (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS main_bucket (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_amount DECIMAL(10,2) DEFAULT 1200.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Auto deposits table - stores recurring deposit rules (THIS IS THE NEW TABLE)
CREATE TABLE IF NOT EXISTS auto_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bucket_id UUID REFERENCES buckets(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  repeat_type TEXT NOT NULL CHECK (repeat_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  repeat_every_days INTEGER CHECK (repeat_every_days IS NULL OR repeat_every_days >= 2),
  end_type TEXT NOT NULL CHECK (end_type IN ('bucket_completed', 'specific_date')),
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  next_execution_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_buckets_user_id ON buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_buckets_created_at ON buckets(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_bucket_id ON activities(bucket_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_main_bucket_user_id ON main_bucket(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_deposits_user_id ON auto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_deposits_bucket_id ON auto_deposits(bucket_id);
CREATE INDEX IF NOT EXISTS idx_auto_deposits_status ON auto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_auto_deposits_next_execution ON auto_deposits(next_execution_date);

-- Enable Row Level Security (safe)
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_bucket ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_deposits ENABLE ROW LEVEL SECURITY;

-- Auto deposits RLS Policies
DO $$ BEGIN
    CREATE POLICY "Users can view their own auto deposits" 
      ON auto_deposits FOR SELECT 
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own auto deposits" 
      ON auto_deposits FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own auto deposits" 
      ON auto_deposits FOR UPDATE 
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own auto deposits" 
      ON auto_deposits FOR DELETE 
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at (safe)
DROP TRIGGER IF EXISTS update_auto_deposits_updated_at ON auto_deposits;
CREATE TRIGGER update_auto_deposits_updated_at 
  BEFORE UPDATE ON auto_deposits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();