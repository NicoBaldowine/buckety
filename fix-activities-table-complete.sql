-- Drop and recreate activities table with proper structure
-- First check if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        -- Table exists, just update policies
        RAISE NOTICE 'Activities table already exists, updating policies...';
    ELSE
        -- Create the table
        CREATE TABLE activities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          amount DECIMAL(10, 2) DEFAULT 0,
          activity_type TEXT,
          from_source TEXT,
          to_destination TEXT,
          date DATE DEFAULT CURRENT_DATE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
        
        RAISE NOTICE 'Activities table created successfully';
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

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Activities table setup completed successfully!';
    RAISE NOTICE 'Table is ready to store bucket activities.';
END $$;