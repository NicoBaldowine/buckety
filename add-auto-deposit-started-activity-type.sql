-- Add 'auto_deposit_started' to the activity_type enum if it doesn't exist
-- First check if the enum value already exists
DO $$ 
BEGIN
    -- Check if 'auto_deposit_started' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'auto_deposit_started' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type')
    ) THEN
        -- Add the new enum value
        ALTER TYPE activity_type ADD VALUE 'auto_deposit_started';
        RAISE NOTICE 'Added auto_deposit_started to activity_type enum';
    ELSE
        RAISE NOTICE 'auto_deposit_started already exists in activity_type enum';
    END IF;
END $$;

-- Verify the enum values
SELECT enumlabel as activity_types 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type')
ORDER BY enumlabel;