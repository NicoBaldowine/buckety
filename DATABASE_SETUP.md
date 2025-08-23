# Database Setup Instructions

The auto deposits feature requires the Supabase database schema to be set up. Here's how to enable it:

## Steps to Set Up Auto Deposits

### 1. Access Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** from the left sidebar

### 2. Run the Schema
1. Copy the contents of `supabase-schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the schema

This will create:
- `auto_deposits` table for storing recurring deposit rules
- `activities` table enhancements for auto deposit tracking
- Proper indexes and Row Level Security (RLS) policies

### 3. Verify Setup
After running the schema, the auto deposits feature will be fully functional:
- Auto deposit creation page (`/auto-deposit`)
- Auto deposit banner in bucket details
- Edit auto deposit page (`/edit-auto-deposit`)

## Alternative: Test Without Database

The app will work without the database setup, but auto deposits features will be disabled:
- Auto deposit creation will work but won't persist
- No auto deposit banners will show
- Edit functionality will be unavailable

## Environment Variables

Make sure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema Overview

The auto deposits feature adds:

1. **auto_deposits table**: Stores recurring deposit rules
2. **Enhanced activities**: Tracks auto deposit setup and execution
3. **Status management**: Active, paused, completed, cancelled states
4. **Smart scheduling**: Calculates next execution dates

Once set up, users can:
- ✅ Create recurring deposits to savings buckets
- ✅ Edit existing auto deposit settings  
- ✅ Cancel auto deposits
- ✅ View auto deposit status in bucket details