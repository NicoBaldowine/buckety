-- Fix Auto Deposits RLS Policies - SAFE UPDATE
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security for auto_deposits table (safe to run multiple times)
ALTER TABLE auto_deposits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view their own auto deposits" ON auto_deposits;
    DROP POLICY IF EXISTS "Users can insert their own auto deposits" ON auto_deposits;
    DROP POLICY IF EXISTS "Users can update their own auto deposits" ON auto_deposits;
    DROP POLICY IF EXISTS "Users can delete their own auto deposits" ON auto_deposits;
    
    -- Recreate RLS policies for auto_deposits
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
        
    RAISE NOTICE 'Auto deposits RLS policies created successfully';
END $$;

-- Verify the setup
SELECT 'Auto deposits RLS setup completed successfully!' as status;