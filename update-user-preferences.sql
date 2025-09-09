-- User Preferences Table for Theme and Settings - SAFE UPDATE
-- Run this SQL in your Supabase SQL Editor

-- Check if user_preferences table exists and create only if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_preferences'
    ) THEN
        -- Create user_preferences table
        CREATE TABLE user_preferences (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
            theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create index for better performance
        CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
        
        RAISE NOTICE 'user_preferences table created successfully';
    ELSE
        RAISE NOTICE 'user_preferences table already exists, skipping creation';
    END IF;
END $$;

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
    DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;
    
    -- Recreate RLS policies
    CREATE POLICY "Users can view their own preferences" 
        ON user_preferences FOR SELECT 
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own preferences" 
        ON user_preferences FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own preferences" 
        ON user_preferences FOR UPDATE 
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own preferences" 
        ON user_preferences FOR DELETE 
        USING (auth.uid() = user_id);
        
    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- Check if trigger exists and create only if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_user_preferences_updated_at'
    ) THEN
        -- Trigger to automatically update updated_at
        CREATE TRIGGER update_user_preferences_updated_at 
            BEFORE UPDATE ON user_preferences 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Trigger created successfully';
    ELSE
        RAISE NOTICE 'Trigger already exists, skipping creation';
    END IF;
END $$;

-- Verify the setup
SELECT 'Setup completed successfully!' as status;