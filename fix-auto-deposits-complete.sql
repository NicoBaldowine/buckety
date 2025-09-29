-- Complete fix for auto deposits issue
-- 1. Add last_executed_at column to track executions
-- 2. Clean up duplicate activities 
-- 3. Reset next_execution_date to proper intervals

-- Step 1: Add last_executed_at column if it doesn't exist
ALTER TABLE auto_deposits 
ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_auto_deposits_last_executed 
ON auto_deposits(last_executed_at);

-- Add comment
COMMENT ON COLUMN auto_deposits.last_executed_at IS 'Timestamp of when this auto deposit was last executed';

-- Step 2: Clean up duplicate auto deposit activities from today (Sep 29, 2025)
-- Keep only the first auto deposit activity for each bucket from today
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY bucket_id, DATE(created_at)
      ORDER BY created_at ASC
    ) as rnum
  FROM activities
  WHERE activity_type = 'auto_deposit'
    AND DATE(created_at) = CURRENT_DATE
)
DELETE FROM activities
WHERE id IN (
  SELECT id FROM duplicates WHERE rnum > 1
);

-- Step 3: Update next_execution_date for all active auto deposits
-- Set them to tomorrow at 1 AM to ensure proper 24-hour intervals
UPDATE auto_deposits
SET 
  next_execution_date = (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '1 hour')::timestamptz,
  last_executed_at = CURRENT_TIMESTAMP
WHERE status = 'active';

-- Step 4: Verify the fix
SELECT 
  id,
  bucket_id,
  amount,
  repeat_type,
  next_execution_date,
  last_executed_at,
  status
FROM auto_deposits
WHERE status = 'active'
ORDER BY created_at;

-- Step 5: Count activities to verify cleanup
SELECT 
  bucket_id,
  COUNT(*) as activity_count,
  DATE(created_at) as activity_date
FROM activities
WHERE activity_type = 'auto_deposit'
  AND DATE(created_at) >= CURRENT_DATE - INTERVAL '2 days'
GROUP BY bucket_id, DATE(created_at)
ORDER BY activity_date DESC, bucket_id;