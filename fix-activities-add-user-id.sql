-- Fix activities table by adding user_id column if it doesn't exist
DO $$ 
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column
        ALTER TABLE activities 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Update existing rows to set user_id from their bucket
        UPDATE activities a
        SET user_id = b.user_id
        FROM buckets b
        WHERE a.bucket_id = b.id
        AND a.user_id IS NULL;
        
        RAISE NOTICE 'Added user_id column to activities table';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- Create indexes for performance (IF NOT EXISTS handles if they already exist)
CREATE INDEX IF NOT EXISTS idx_activities_bucket_id ON activities(bucket_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view activities for their buckets" ON activities;
DROP POLICY IF EXISTS "Users can create activities for their buckets" ON activities;
DROP POLICY IF EXISTS "Users can update their activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their activities" ON activities;

-- Create new RLS policies
CREATE POLICY "Users can view activities for their buckets" ON activities
  FOR SELECT USING (
    bucket_id IN (
      SELECT id FROM buckets WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create activities for their buckets" ON activities
  FOR INSERT WITH CHECK (
    bucket_id IN (
      SELECT id FROM buckets WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their activities" ON activities
  FOR UPDATE USING (
    bucket_id IN (
      SELECT id FROM buckets WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can delete their activities" ON activities
  FOR DELETE USING (
    bucket_id IN (
      SELECT id FROM buckets WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_activity_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not provided, get it from the bucket
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM buckets
    WHERE id = NEW.bucket_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set user_id
DROP TRIGGER IF EXISTS set_activity_user_id_trigger ON activities;
CREATE TRIGGER set_activity_user_id_trigger
  BEFORE INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION set_activity_user_id();

-- Grant necessary permissions
GRANT ALL ON activities TO authenticated;
GRANT ALL ON activities TO service_role;

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activities'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Activities table fixed successfully!';
    RAISE NOTICE 'user_id column added and policies updated.';
END $$;