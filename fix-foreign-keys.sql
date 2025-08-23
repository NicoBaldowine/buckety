-- Fix foreign key constraints for development
-- Run this SQL in Supabase to remove auth dependencies

-- Remove foreign key constraints that reference auth.users
ALTER TABLE buckets DROP CONSTRAINT IF EXISTS buckets_user_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;
ALTER TABLE main_bucket DROP CONSTRAINT IF EXISTS main_bucket_user_id_fkey;
ALTER TABLE auto_deposits DROP CONSTRAINT IF EXISTS auto_deposits_user_id_fkey;

-- Also remove bucket_id foreign key constraint from auto_deposits for now
ALTER TABLE auto_deposits DROP CONSTRAINT IF EXISTS auto_deposits_bucket_id_fkey;

-- Make user_id nullable for development (optional)
ALTER TABLE buckets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE auto_deposits ALTER COLUMN user_id DROP NOT NULL;

-- Insert a test user record if needed (alternative approach)
-- INSERT INTO auth.users (id, email, created_at, updated_at)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;