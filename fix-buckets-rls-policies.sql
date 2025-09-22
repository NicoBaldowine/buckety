-- Fix Buckets Table RLS Policies - SAFE UPDATE
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security for buckets table (safe to run multiple times)
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view their own buckets" ON buckets;
    DROP POLICY IF EXISTS "Users can insert their own buckets" ON buckets;
    DROP POLICY IF EXISTS "Users can update their own buckets" ON buckets;
    DROP POLICY IF EXISTS "Users can delete their own buckets" ON buckets;
    
    -- Recreate RLS policies for buckets
    CREATE POLICY "Users can view their own buckets" 
        ON buckets FOR SELECT 
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own buckets" 
        ON buckets FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own buckets" 
        ON buckets FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own buckets" 
        ON buckets FOR DELETE 
        USING (auth.uid() = user_id);
        
    RAISE NOTICE 'Buckets RLS policies created successfully';
END $$;

-- Also ensure activities table has proper RLS policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view activities for their buckets" ON activities;
    DROP POLICY IF EXISTS "Users can insert activities for their buckets" ON activities;
    DROP POLICY IF EXISTS "Users can update activities for their buckets" ON activities;
    DROP POLICY IF EXISTS "Users can delete activities for their buckets" ON activities;
    
    -- Recreate RLS policies for activities
    CREATE POLICY "Users can view activities for their buckets" 
        ON activities FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM buckets 
                WHERE buckets.id = activities.bucket_id 
                AND buckets.user_id = auth.uid()
            )
        );

    CREATE POLICY "Users can insert activities for their buckets" 
        ON activities FOR INSERT 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM buckets 
                WHERE buckets.id = activities.bucket_id 
                AND buckets.user_id = auth.uid()
            )
        );

    CREATE POLICY "Users can update activities for their buckets" 
        ON activities FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM buckets 
                WHERE buckets.id = activities.bucket_id 
                AND buckets.user_id = auth.uid()
            )
        );

    CREATE POLICY "Users can delete activities for their buckets" 
        ON activities FOR DELETE 
        USING (
            EXISTS (
                SELECT 1 FROM buckets 
                WHERE buckets.id = activities.bucket_id 
                AND buckets.user_id = auth.uid()
            )
        );
        
    RAISE NOTICE 'Activities RLS policies created successfully';
END $$;

-- Also ensure main_bucket table has proper RLS policies
ALTER TABLE main_bucket ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view their own main bucket" ON main_bucket;
    DROP POLICY IF EXISTS "Users can insert their own main bucket" ON main_bucket;
    DROP POLICY IF EXISTS "Users can update their own main bucket" ON main_bucket;
    DROP POLICY IF EXISTS "Users can delete their own main bucket" ON main_bucket;
    
    -- Recreate RLS policies for main_bucket
    CREATE POLICY "Users can view their own main bucket" 
        ON main_bucket FOR SELECT 
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own main bucket" 
        ON main_bucket FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own main bucket" 
        ON main_bucket FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own main bucket" 
        ON main_bucket FOR DELETE 
        USING (auth.uid() = user_id);
        
    RAISE NOTICE 'Main bucket RLS policies created successfully';
END $$;

-- Verify the setup
SELECT 'All bucket-related RLS policies have been set up successfully!' as status;