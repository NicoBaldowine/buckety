-- Fix main bucket issue by creating the test user's main bucket
-- Run this in your Supabase SQL Editor

-- Insert the main bucket record for our test user
INSERT INTO main_bucket (user_id, current_amount) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 1200.00)
ON CONFLICT (user_id) DO UPDATE SET 
  current_amount = 1200.00,
  updated_at = NOW();

-- Verify the record was created
SELECT * FROM main_bucket WHERE user_id = '00000000-0000-0000-0000-000000000001';