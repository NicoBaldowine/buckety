-- Fix Auto Deposits RLS Policies
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security for auto_deposits table
ALTER TABLE auto_deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auto_deposits table
CREATE POLICY "Users can view their own auto deposits" 
  ON auto_deposits FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto deposits" 
  ON auto_deposits FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto deposits" 
  ON auto_deposits FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auto deposits" 
  ON auto_deposits FOR DELETE 
  USING (auth.uid() = user_id);