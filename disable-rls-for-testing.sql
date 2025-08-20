-- Temporarily disable RLS for testing
-- Run this in your Supabase SQL Editor to fix the main bucket error

-- Disable RLS on all tables for testing
ALTER TABLE buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE main_bucket DISABLE ROW LEVEL SECURITY;

-- Create a default main bucket entry for testing (using proper UUID)
INSERT INTO main_bucket (user_id, current_amount) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 1200.00)
ON CONFLICT (user_id) DO NOTHING;

-- Note: You can re-enable RLS later when you implement proper authentication:
-- ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE main_bucket ENABLE ROW LEVEL SECURITY;