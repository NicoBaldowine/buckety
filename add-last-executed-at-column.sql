-- Add last_executed_at column to auto_deposits table to track when auto deposits were last executed
-- This prevents duplicate executions within 24 hours

ALTER TABLE auto_deposits 
ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_auto_deposits_last_executed 
ON auto_deposits(last_executed_at);

-- Add comment
COMMENT ON COLUMN auto_deposits.last_executed_at IS 'Timestamp of when this auto deposit was last executed';