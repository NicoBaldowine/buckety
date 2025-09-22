-- Script to fix Main Bucket balance inconsistencies
-- This will recalculate the correct balance based on activities

-- First, let's see the current state of main buckets
SELECT 
  mb.user_id,
  mb.current_amount as current_balance,
  COALESCE(
    1200 + SUM(
      CASE 
        WHEN a.activity_type = 'money_added' THEN a.amount
        WHEN a.activity_type = 'money_removed' THEN -ABS(a.amount)
        ELSE 0
      END
    ), 1200
  ) as calculated_balance
FROM main_bucket mb
LEFT JOIN activities a ON a.user_id = mb.user_id 
  AND a.bucket_id = 'main-bucket'
GROUP BY mb.user_id, mb.current_amount;

-- Update main bucket balances based on calculated amounts
-- UNCOMMENT TO EXECUTE:
/*
UPDATE main_bucket mb
SET current_amount = subq.calculated_balance,
    updated_at = NOW()
FROM (
  SELECT 
    mb2.user_id,
    COALESCE(
      1200 + SUM(
        CASE 
          WHEN a.activity_type = 'money_added' THEN a.amount
          WHEN a.activity_type = 'money_removed' THEN -ABS(a.amount)
          ELSE 0
        END
      ), 1200
    ) as calculated_balance
  FROM main_bucket mb2
  LEFT JOIN activities a ON a.user_id = mb2.user_id 
    AND a.bucket_id = 'main-bucket'
  GROUP BY mb2.user_id
) subq
WHERE mb.user_id = subq.user_id
  AND mb.current_amount != subq.calculated_balance;
*/

-- Check for missing Main Bucket activities from auto deposits
SELECT 
  ad.user_id,
  ad.bucket_id,
  b.title as bucket_name,
  ad.amount,
  ad.last_executed_at,
  COUNT(a.id) as activity_count
FROM auto_deposits ad
JOIN buckets b ON b.id = ad.bucket_id
LEFT JOIN activities a ON a.user_id = ad.user_id 
  AND a.bucket_id = 'main-bucket'
  AND a.activity_type = 'money_removed'
  AND DATE(a.created_at) = DATE(ad.last_executed_at)
WHERE ad.status = 'active'
  AND ad.last_executed_at IS NOT NULL
GROUP BY ad.user_id, ad.bucket_id, b.title, ad.amount, ad.last_executed_at
HAVING COUNT(a.id) = 0;