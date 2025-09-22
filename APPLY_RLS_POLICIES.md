# CRITICAL: Apply Row Level Security Policies

**URGENT**: You need to apply the RLS policies in `fix-user-isolation.sql` to prevent users from seeing other users' data.

## How to Apply:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/tbhfbpykuidbcfmmcskf
2. Navigate to "SQL Editor" in the left sidebar
3. Copy and paste the entire content of `fix-user-isolation.sql` into a new query
4. Run the query to apply all Row Level Security policies

## What This Fixes:

- **CRITICAL SECURITY**: Prevents users from seeing other users' financial data
- Enables Row Level Security on all tables (buckets, activities, main_bucket, auto_deposits)
- Creates proper policies to ensure users can only access their own data

## Current Status:

✅ **Code-level fixes applied**:
- Fixed `mainBucketService.getMainBucket()` to require userId
- Fixed `bucketService.getBuckets()` to require userId  
- Fixed `activityService.getActivities()` to verify bucket ownership
- Fixed `activityService.createActivity()` to verify bucket ownership
- Fixed `autoDepositService.executeAutoDeposits()` to filter by userId

⚠️  **Database-level fixes needed**:
- RLS policies must be applied manually in Supabase dashboard

The user reported: "el main bucket here deberia estar vacio! este historial es de la otra cuenta no de la cuenta nueva" - this will be fixed once RLS policies are applied.