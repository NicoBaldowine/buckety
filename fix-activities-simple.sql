-- Simple fix for activities table - add user_id column without foreign key first

-- Step 1: Add the user_id column as a simple UUID (no foreign key yet)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 2: Update existing rows to set user_id from their bucket
UPDATE activities a
SET user_id = b.user_id
FROM buckets b
WHERE a.bucket_id = b.id
AND a.user_id IS NULL;

-- Step 3: Now add the foreign key constraint (only if auth.users exists)
DO $$ 
BEGIN
    -- Check if auth.users table exists before adding foreign key
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE activities 
        ADD CONSTRAINT activities_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_bucket_id ON activities(bucket_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);

-- Step 5: Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop and recreate policies
DROP POLICY IF EXISTS "Users can view activities for their buckets" ON activities;
DROP POLICY IF EXISTS "Users can create activities for their buckets" ON activities;
DROP POLICY IF EXISTS "Users can update their activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their activities" ON activities;

-- Create new RLS policies using just bucket relationship
CREATE POLICY "Users can view activities for their buckets" ON activities
  FOR SELECT USING (
    bucket_id IN (
      SELECT id FROM buckets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities for their buckets" ON activities
  FOR INSERT WITH CHECK (
    bucket_id IN (
      SELECT id FROM buckets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their activities" ON activities
  FOR UPDATE USING (
    bucket_id IN (
      SELECT id FROM buckets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their activities" ON activities
  FOR DELETE USING (
    bucket_id IN (
      SELECT id FROM buckets WHERE user_id = auth.uid()
    )
  );

-- Step 7: Create or replace the trigger function
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

-- Step 8: Create trigger
DROP TRIGGER IF EXISTS set_activity_user_id_trigger ON activities;
CREATE TRIGGER set_activity_user_id_trigger
  BEFORE INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION set_activity_user_id();

-- Step 9: Grant permissions
GRANT ALL ON activities TO authenticated;
GRANT ALL ON activities TO service_role;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'activities'
ORDER BY ordinal_position;