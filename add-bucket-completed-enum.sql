-- Migration to add 'bucket_completed' to activity_type enum
-- Run this in Supabase SQL Editor if you get an error about missing 'bucket_completed'

-- First, check if the enum value already exists
DO $$ 
BEGIN
    -- Try to add the new value
    ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'bucket_completed' AFTER 'bucket_created';
EXCEPTION
    WHEN others THEN
        -- If it fails, the value probably already exists
        RAISE NOTICE 'bucket_completed value might already exist in activity_type enum';
END $$;