-- Temporarily disable RLS for development/testing
-- Run this in Supabase SQL Editor if you want to test without authentication

-- Disable RLS on all tables for development
ALTER TABLE buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE main_bucket DISABLE ROW LEVEL SECURITY;
ALTER TABLE auto_deposits DISABLE ROW LEVEL SECURITY;

-- Insert a default main bucket for testing (without user_id constraint)
INSERT INTO main_bucket (user_id, current_amount) 
VALUES ('00000000-0000-0000-0000-000000000001', 1200.00)
ON CONFLICT (user_id) DO UPDATE SET current_amount = EXCLUDED.current_amount;

-- Note: This is for development only
-- In production, you should enable RLS and use proper authentication