import { createClient } from '@supabase/supabase-js'

// Helper function to get local date in YYYY-MM-DD format
const getLocalDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a dummy client for build time when env vars might not be available
const createSupabaseClient = () => {
  // For production, we need real credentials
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      // If we're in production and don't have credentials, that's a critical error
      if (isProduction) {
        console.error('CRITICAL: Supabase environment variables not found in production!')
        console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
        console.log('Key:', supabaseAnonKey ? 'Found' : 'Missing')
      }
      // Only use placeholder during build time, not in production runtime
      if (typeof window === 'undefined') {
        return createClient(
          'https://placeholder.supabase.co',
          'placeholder-key'
        )
      }
      // In production runtime, use the hardcoded values as fallback
      return createClient(
        'https://tbhfbpykuidbcfmmcskf.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaGZicHlrdWlkYmNmbW1jc2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTc3NzQsImV4cCI6MjA3MTIzMzc3NH0.lOWd7Q3FdU_o1f6pTQgUvevv56ChsT4fmzdBlwwFY3M',
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            flowType: 'pkce'
          }
        }
      )
    }
    // Validate URL format before passing to createClient
    new URL(supabaseUrl) // This will throw if URL is invalid
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Enable longer session storage
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'pkce'
      }
    })
  } catch (error) {
    console.warn('Invalid Supabase URL, using hardcoded values:', error)
    // Use hardcoded values as absolute fallback
    return createClient(
      'https://tbhfbpykuidbcfmmcskf.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaGZicHlrdWlkYmNmbW1jc2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTc3NzQsImV4cCI6MjA3MTIzMzc3NH0.lOWd7Q3FdU_o1f6pTQgUvevv56ChsT4fmzdBlwwFY3M',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          flowType: 'pkce'
        }
      }
    )
  }
}

export const supabase = createSupabaseClient()

// Retry wrapper for database operations
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error)
      lastError = error
      
      if (attempt < maxRetries) {
        // Wait before retrying, with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }
  
  throw lastError
}

// Helper function to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Types for our database tables
export type ActivityType = 
  | 'bucket_created'
  | 'bucket_completed'
  | 'money_added'
  | 'money_removed'
  | 'withdrawal'
  | 'apy_earnings'
  | 'auto_deposit'
  | 'auto_deposit_started'

export interface Bucket {
  id: string
  user_id?: string
  title: string
  current_amount: number
  target_amount: number
  background_color: string
  apy: number
  created_at?: string
  updated_at?: string
}

export interface Activity {
  id: string
  bucket_id: string
  user_id?: string | null
  activity_type: ActivityType
  title: string
  amount: number
  from_source?: string | null
  to_destination?: string | null
  date: string
  description?: string | null
  created_at?: string
}

export interface MainBucket {
  id: string
  user_id?: string
  current_amount: number
  created_at?: string
  updated_at?: string
}

export interface AutoDeposit {
  id: string
  user_id: string
  bucket_id: string
  amount: number
  repeat_type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
  repeat_every_days?: number
  end_type: 'bucket_completed' | 'specific_date'
  end_date?: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  next_execution_date: string
  last_executed_at?: string
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

// Database functions
export const bucketService = {
  // Get a single bucket by ID
  async getBucket(bucketId: string): Promise<Bucket | null> {
    try {
      const { data, error } = await supabase
        .from('buckets')
        .select('*')
        .eq('id', bucketId)
        .single()
      
      if (error) {
        console.error('Error fetching bucket:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error fetching bucket:', error)
      return null
    }
  },
  
  // Get all buckets for a user
  async getBuckets(userId?: string): Promise<Bucket[]> {
    // Use provided userId or get current user
    let targetUserId: string | null = null
    
    try {
      targetUserId = userId || await getCurrentUserId()
      
      // Always require userId for data isolation
      if (!targetUserId) {
        console.warn('⚠️ getBuckets called without userId - returning empty array for security')
        return []
      }
      
      const { data, error } = await supabase
        .from('buckets')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching buckets:', {
          message: error.message || 'Unknown error',
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        // Return empty array to fallback to localStorage
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching buckets:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error,
        userId: targetUserId || userId || 'undefined'
      })
      return []
    }
  },

  // Create a new bucket and log creation activity
  async createBucket(bucket: Omit<Bucket, 'id' | 'created_at' | 'updated_at'>): Promise<Bucket | null> {
    // Use reduced retry for bucket creation to avoid long waits (1 retry, 500ms delay)
    return withRetry(async () => {
      try {
        // Ensure we have a user_id
        const bucketWithUserId = {
          ...bucket,
          user_id: bucket.user_id || await getCurrentUserId()
        }
        
        console.log('Creating bucket in database:', bucketWithUserId)
        
        // Add timeout to prevent hanging (15 seconds for bucket creation)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Bucket creation timeout')), 15000)
        )
        
        const createPromise = supabase
          .from('buckets')
          .insert([bucketWithUserId])
          .select()
          .single()
        
        const { data, error } = await Promise.race([
          createPromise,
          timeoutPromise
        ]) as any
        
        if (error) {
          console.error('Error creating bucket:', error)
          throw error // Throw to trigger retry
        }
        
        // Log bucket creation activity
        if (data) {
          try {
            await activityService.createActivity({
              bucket_id: data.id,
              activity_type: 'bucket_created',
              title: 'Bucket created',
              amount: 0,
              date: getLocalDate(),
              description: `${data.title} bucket was created with target of $${data.target_amount.toLocaleString()}`
            })
          } catch (activityError) {
            console.warn('Failed to log bucket creation activity:', activityError)
            // Don't fail bucket creation if activity logging fails
          }
        }
        
        return data
      } catch (error) {
        console.error('Error in createBucket:', error)
        throw error // Re-throw to trigger retry
      }
    }, 1, 500).catch(error => {
      console.error('Failed to create bucket after retry:', error)
      return null
    })
  },

  // Update a bucket
  async updateBucket(id: string, updates: Partial<Bucket>): Promise<Bucket | null> {
    try {
      console.log('🔧 Attempting to update bucket:', { id, updates })
      
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 User authenticated for bucket update:', {
        isAuthenticated: !!user,
        userId: user?.id
      })
      
      if (!user?.id) {
        console.error('❌ No authenticated user found for bucket update')
        return null
      }
      
      const updateData = { 
        ...updates, 
        updated_at: new Date().toISOString() 
      }
      
      console.log('📝 Update data being sent to Supabase:', updateData)
      
      const { data, error } = await supabase
        .from('buckets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error updating bucket:', {
          error,
          errorDetails: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          },
          bucketId: id,
          updates,
          updateData
        })
        
        // Check for common issues
        if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.error('💡 Permission denied on bucket update. Check RLS policies and user authentication.')
        }
        if (error.message?.includes('JWT')) {
          console.error('💡 JWT token issue. User may not be properly authenticated.')
        }
        
        return null
      }
      
      console.log('✅ Bucket updated successfully in database:', data)
      return data
    } catch (error) {
      console.error('❌ Unexpected error updating bucket:', error)
      return null
    }
  },

  // Delete a bucket
  async deleteBucket(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('buckets')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting bucket:', error)
      return false
    }
    
    return true
  }
}

export const activityService = {
  // Get activities for a bucket (with user verification)
  async getActivities(bucketId: string, userId?: string): Promise<Activity[]> {
    try {
      // Use provided userId or get current user
      const targetUserId = userId || await getCurrentUserId()
      
      // Always require userId for data isolation
      if (!targetUserId) {
        console.warn('⚠️ getActivities called without userId - returning empty array for security')
        return []
      }
      
      // Join with buckets table to ensure user owns the bucket
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          bucket:buckets!inner(user_id)
        `)
        .eq('bucket_id', bucketId)
        .eq('bucket.user_id', targetUserId)
        .order('created_at', { ascending: false })
        .order('date', { ascending: false })
      
      if (error) {
        console.warn('Error fetching activities for bucket:', bucketId, {
          message: error?.message || 'Unknown error',
          code: error?.code,
          details: error?.details,
          hint: error?.hint
        })
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching activities:', error)
      return []
    }
  },

  // Create a new activity with user verification
  async createActivity(activity: Omit<Activity, 'id' | 'created_at'> & { user_id?: string }): Promise<Activity | null> {
    try {
      // Ensure we have a user_id for security
      const userId = activity.user_id || await getCurrentUserId()
      if (!userId) {
        console.warn('⚠️ createActivity called without userId - skipping for security')
        return null
      }
      
      // Verify user owns the bucket before creating activity (skip if user_id was explicitly provided)
      if (activity.bucket_id && !activity.user_id) {
        const { data: bucketCheck, error: bucketError } = await supabase
          .from('buckets')
          .select('user_id')
          .eq('id', activity.bucket_id)
          .eq('user_id', userId)
          .single()
        
        if (bucketError || !bucketCheck) {
          console.warn('⚠️ User does not own bucket, cannot create activity:', activity.bucket_id)
          return null
        }
      }
      
      const activityWithUserId = {
        ...activity,
        user_id: userId
      }
      
      const { data, error } = await supabase
        .from('activities')
        .insert([activityWithUserId])
        .select()
        .single()
      
      if (error) {
        console.warn('Could not create activity in database (likely FK constraint):', error.message)
        return null
      }
      
      console.log('✅ Activity logged successfully:', data)
      return data
    } catch (error) {
      console.warn('Activity logging failed, continuing without database activity log:', error)
      return null
    }
  },

  // Helper function to log money transfer TO a bucket
  async logMoneyAdded(bucketId: string, amount: number, fromSource: string, description?: string): Promise<Activity | null> {
    return this.createActivity({
      bucket_id: bucketId,
      activity_type: 'money_added',
      title: `From ${fromSource}`,
      amount,
      from_source: fromSource,
      date: getLocalDate(),
      description: description || `Transferred $${amount.toLocaleString()} from ${fromSource}`
    })
  },

  // Helper function to log money transfer FROM a bucket
  async logMoneyRemoved(bucketId: string, amount: number, toDestination: string, description?: string): Promise<Activity | null> {
    return this.createActivity({
      bucket_id: bucketId,
      activity_type: 'money_removed',
      title: `To ${toDestination}`,
      amount: -Math.abs(amount), // Ensure negative for removals
      to_destination: toDestination,
      date: getLocalDate(),
      description: description || `Transferred $${amount.toLocaleString()} to ${toDestination}`
    })
  },

  // Helper function to log withdrawal
  async logWithdrawal(bucketId: string, amount: number, description?: string): Promise<Activity | null> {
    return this.createActivity({
      bucket_id: bucketId,
      activity_type: 'withdrawal',
      title: 'Withdrawal',
      amount: -Math.abs(amount), // Ensure negative for withdrawals
      date: getLocalDate(),
      description: description || `Withdrew $${amount.toLocaleString()} from bucket`
    })
  },

  // Helper function to log APY earnings
  async logAPYEarnings(bucketId: string, amount: number, apyRate: number): Promise<Activity | null> {
    return this.createActivity({
      bucket_id: bucketId,
      activity_type: 'apy_earnings',
      title: 'Interest earned',
      amount,
      date: getLocalDate(),
      description: `Monthly interest earned at ${apyRate}% APY`
    })
  },

  // Helper function to log auto-deposit
  async logAutoDeposit(bucketId: string, amount: number, fromSource: string = 'Main Bucket'): Promise<Activity | null> {
    return this.createActivity({
      bucket_id: bucketId,
      activity_type: 'auto_deposit',
      title: 'Auto-deposit',
      amount,
      from_source: fromSource,
      date: getLocalDate(),
      description: `Automatic deposit of $${amount.toLocaleString()} from ${fromSource}`
    })
  },

  // Helper function to log auto-deposit setup
  async logAutoDepositStarted(bucketId: string, amount: number, frequency: string): Promise<Activity | null> {
    return this.createActivity({
      bucket_id: bucketId,
      activity_type: 'auto_deposit_started',
      title: 'Auto deposit setup',
      amount: 0, // No money moved at setup
      date: getLocalDate(),
      description: `Set up ${frequency} auto-deposit of $${amount.toLocaleString()}`
    })
  },

  // Get main bucket transfer activities - money sent from main bucket to savings buckets
  async getMainBucketTransferActivities(userId: string): Promise<Activity[]> {
    // Get all activities where money was added to buckets from Main Bucket
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        bucket:buckets!inner(title, user_id)
      `)
      .eq('activity_type', 'money_added')
      .eq('from_source', 'Main Bucket')
      .eq('bucket.user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching main bucket activities:', error)
      return []
    }
    
    // Transform the activities to show negative amounts for main bucket perspective
    return (data || []).map((activity: Activity & { bucket?: { title: string } }) => ({
      ...activity,
      amount: -Math.abs(activity.amount), // Show as negative since money left main bucket
      title: `To ${activity.bucket?.title || 'savings bucket'}`
    }))
  }
}

export const mainBucketService = {
  // Get main bucket for a user
  async getMainBucket(userId?: string): Promise<MainBucket | null> {
    try {
      // Always require userId for data isolation
      if (!userId) {
        console.warn('⚠️ getMainBucket called without userId - returning null for security')
        return null
      }
      
      const { data, error } = await supabase
        .from('main_bucket')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        // For testing without authentication, gracefully handle missing main bucket
        if (error.message.includes('no rows returned') || error.code === 'PGRST116') {
          console.warn('No main bucket found in database. Using localStorage fallback.')
          return null // Let hybrid storage handle the fallback
        }
        console.warn('Main bucket access issue (likely RLS/auth):', error.message)
        return null // Gracefully return null to use localStorage
      }
      
      return data
    } catch (error) {
      console.warn('Main bucket database unavailable, using localStorage fallback:', error)
      return null
    }
  },

  // Transfer money from main bucket to a savings bucket
  async transferFromMainBucket(userId: string, toBucketId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current main bucket balance
      const mainBucket = await this.getMainBucket(userId)
      if (!mainBucket) {
        // Create main bucket if it doesn't exist
        const { data, error } = await supabase
          .from('main_bucket')
          .insert({ user_id: userId, current_amount: 1200 })
          .select()
          .single()
        
        if (error) {
          return { success: false, error: 'Failed to access main bucket' }
        }
        
        if (data && data.current_amount < amount) {
          return { success: false, error: 'Insufficient funds in main bucket' }
        }
      } else if (mainBucket.current_amount < amount) {
        return { success: false, error: 'Insufficient funds in main bucket' }
      }
      
      // Get destination bucket
      const toBucket = await bucketService.getBucket(toBucketId)
      if (!toBucket) {
        return { success: false, error: 'Destination bucket not found' }
      }
      
      // Update main bucket balance
      const newMainBalance = (mainBucket?.current_amount || 1200) - amount
      await this.updateMainBucket(userId, newMainBalance)
      
      // Update destination bucket balance
      const newBucketBalance = toBucket.current_amount + amount
      await bucketService.updateBucket(toBucketId, { current_amount: newBucketBalance })
      
      // Create activity record for Main Bucket (money going out)
      try {
        await activityService.createActivity({
          bucket_id: 'main-bucket',
          user_id: userId,
          title: `To ${toBucket.title}`,
          amount: -amount, // Negative because money is leaving
          activity_type: 'money_removed',
          from_source: 'Main Bucket',
          to_destination: toBucket.title,
          date: new Date().toISOString().split('T')[0],
          description: `Transfer to ${toBucket.title}`
        })
      } catch (activityError) {
        console.warn('Failed to create Main Bucket activity:', activityError)
        // Don't fail the transfer if activity creation fails
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error transferring from main bucket:', error)
      return { success: false, error: 'Transfer failed' }
    }
  },
  
  // Update main bucket amount
  async updateMainBucket(userId: string, amount: number): Promise<MainBucket | null> {
    try {
      // First, try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('main_bucket')
        .update({ 
          current_amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()
      
      if (updateData && !updateError) {
        return updateData
      }
      
      // If update failed (record doesn't exist), try to create new record
      const { data: insertData, error: insertError } = await supabase
        .from('main_bucket')
        .insert({ 
          user_id: userId, 
          current_amount: amount
        })
        .select()
        .single()
      
      if (insertError) {
        console.warn('Cannot create main bucket in database (likely RLS/auth issue). Using localStorage only.')
        return null // Gracefully fail - hybrid storage will use localStorage
      }
      
      return insertData
    } catch (error) {
      console.warn('Main bucket database operation failed, using localStorage fallback:', error)
      return null
    }
  }
}

// Comprehensive transfer service for money movements
export const transferService = {
  // Transfer money from main bucket to a savings bucket
  async transferToSavingsBucket(
    bucketId: string, 
    newTotalAmount: number,
    transferAmount: number,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update the savings bucket amount
      const bucket = await bucketService.updateBucket(bucketId, {
        current_amount: newTotalAmount // The NEW total amount in the bucket
      })
      
      if (!bucket) {
        return { success: false, error: 'Failed to update bucket' }
      }

      // Activity is already logged in HybridStorage.transferMoney - don't create duplicate
      // await activityService.logMoneyAdded(bucketId, transferAmount, 'Main Bucket')
      
      // Update main bucket (decrease by transfer amount)
      if (userId) {
        const mainBucket = await mainBucketService.getMainBucket(userId)
        if (mainBucket) {
          await mainBucketService.updateMainBucket(userId, mainBucket.current_amount - transferAmount)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Transfer error:', error)
      return { success: false, error: 'Transfer failed' }
    }
  },

  // Transfer money from savings bucket back to main bucket
  async transferFromSavingsBucket(
    bucketId: string, 
    amount: number, 
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current bucket to calculate new amount
      const buckets = await bucketService.getBuckets(userId)
      const bucket = buckets.find(b => b.id === bucketId)
      
      if (!bucket || bucket.current_amount < amount) {
        return { success: false, error: 'Insufficient funds in bucket' }
      }

      // Update the savings bucket amount (decrease)
      const updatedBucket = await bucketService.updateBucket(bucketId, {
        current_amount: bucket.current_amount - amount
      })
      
      if (!updatedBucket) {
        return { success: false, error: 'Failed to update bucket' }
      }

      // Log the activity
      await activityService.logMoneyRemoved(bucketId, amount, 'Main Bucket')
      
      // Update main bucket (increase by transfer amount)
      if (userId) {
        const mainBucket = await mainBucketService.getMainBucket(userId)
        if (mainBucket) {
          await mainBucketService.updateMainBucket(userId, mainBucket.current_amount + amount)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Transfer error:', error)
      return { success: false, error: 'Transfer failed' }
    }
  },

  // Make a withdrawal from a bucket (money leaves the system)
  async withdrawFromBucket(
    bucketId: string, 
    amount: number, 
    description?: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current bucket to calculate new amount
      const buckets = await bucketService.getBuckets(userId)
      const bucket = buckets.find(b => b.id === bucketId)
      
      if (!bucket || bucket.current_amount < amount) {
        return { success: false, error: 'Insufficient funds in bucket' }
      }

      // Update the bucket amount (decrease)
      const updatedBucket = await bucketService.updateBucket(bucketId, {
        current_amount: bucket.current_amount - amount
      })
      
      if (!updatedBucket) {
        return { success: false, error: 'Failed to update bucket' }
      }

      // Log the withdrawal activity
      await activityService.logWithdrawal(bucketId, amount, description)

      return { success: true }
    } catch (error) {
      console.error('Withdrawal error:', error)
      return { success: false, error: 'Withdrawal failed' }
    }
  },

  // Process APY earnings for a bucket
  async processAPYEarnings(
    bucketId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current bucket
      const buckets = await bucketService.getBuckets(userId)
      const bucket = buckets.find(b => b.id === bucketId)
      
      if (!bucket) {
        return { success: false, error: 'Bucket not found' }
      }

      // Calculate monthly APY earnings (APY / 12)
      const monthlyRate = bucket.apy / 100 / 12
      const earnings = bucket.current_amount * monthlyRate

      // Update bucket with earnings
      const updatedBucket = await bucketService.updateBucket(bucketId, {
        current_amount: bucket.current_amount + earnings
      })
      
      if (!updatedBucket) {
        return { success: false, error: 'Failed to update bucket' }
      }

      // Log the APY earnings
      await activityService.logAPYEarnings(bucketId, earnings, bucket.apy)

      return { success: true }
    } catch (error) {
      console.error('APY processing error:', error)
      return { success: false, error: 'APY processing failed' }
    }
  }
}

export const autoDepositService = {
  // Create a new auto deposit rule
  async createAutoDeposit(autoDeposit: Omit<AutoDeposit, 'id' | 'created_at' | 'updated_at'>): Promise<AutoDeposit | null> {
    try {
      console.log('🚀 Creating auto deposit with data:', autoDeposit)
      console.log('🔑 Current user ID:', await getCurrentUserId())
      console.log('🔗 Supabase client initialized:', !!supabase)
      
      // Check if user is authenticated before making the request
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 User authentication status:', {
        isAuthenticated: !!user,
        userId: user?.id,
        userRole: user?.role
      })
      
      const { data, error } = await supabase
        .from('auto_deposits')
        .insert([autoDeposit])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating auto deposit:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Check for common issues
        if (error.message?.includes('relation "auto_deposits" does not exist')) {
          console.error('💡 Auto deposits table not found. Please run the database migration.')
        }
        if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.error('💡 Permission denied. Check RLS policies and user authentication.')
        }
        if (error.message?.includes('JWT')) {
          console.error('💡 JWT token issue. User may not be properly authenticated.')
        }
        
        return null
      }
      
      console.log('✅ Auto deposit created successfully in database:', data)
      
      // Create "Auto deposit started" activity
      try {
        console.log('📝 Creating "Auto deposit started" activity for bucket:', autoDeposit.bucket_id)
        const bucket = await bucketService.getBucket(autoDeposit.bucket_id)
        console.log('📝 Found bucket:', bucket?.title)
        
        const now = new Date()
        const activityData = {
          bucket_id: autoDeposit.bucket_id,
          title: 'Auto deposit started',
          amount: 0, // No amount for start notification
          activity_type: 'auto_deposit_started' as ActivityType,
          from_source: 'System',
          to_destination: bucket?.title || 'Bucket',
          date: now.toISOString().split('T')[0],
          description: `Auto deposit of $${autoDeposit.amount} ${autoDeposit.repeat_type} started`,
          user_id: autoDeposit.user_id
        }
        
        console.log('📝 Activity data:', activityData)
        const activityResult = await activityService.createActivity(activityData)
        console.log('📝 Activity creation result:', activityResult)
        
        if (activityResult) {
          console.log('✅ Created "Auto deposit started" activity successfully')
        } else {
          console.warn('⚠️ Activity creation returned null/false')
        }
      } catch (activityError) {
        console.error('❌ Could not create auto deposit started activity:', activityError)
        // Don't fail the whole operation if activity creation fails
      }
      
      return data
    } catch (error) {
      console.error('❌ Unexpected error creating auto deposit:', error)
      return null
    }
  },

  // Get auto deposits for a user
  async getAutoDeposits(userId: string): Promise<AutoDeposit[]> {
    try {
      const { data, error } = await supabase
        .from('auto_deposits')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching auto deposits:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching auto deposits:', error)
      return []
    }
  },

  // Get auto deposits for a specific bucket
  async getBucketAutoDeposits(bucketId: string): Promise<AutoDeposit[]> {
    return withRetry(async () => {
      console.log('🔍 Fetching auto deposits for bucket:', bucketId)
      
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 User authenticated for bucket query:', {
        isAuthenticated: !!user,
        userId: user?.id
      })
      
      const { data, error } = await supabase
        .from('auto_deposits')
        .select('*')
        .eq('bucket_id', bucketId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error fetching bucket auto deposits:', error)
        console.error('❌ Full error object:', JSON.stringify(error, null, 2))
        console.error('❌ Error details:', {
          message: error?.message || 'No message',
          code: error?.code || 'No code',
          details: error?.details || 'No details',
          hint: error?.hint || 'No hint'
        })
        
        // Check if table doesn't exist (common during development)
        if (error.message?.includes('relation "auto_deposits" does not exist')) {
          console.warn('💡 Auto deposits table not found. Please run the Supabase schema to create the auto_deposits table.')
          return []
        }
        if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.error('💡 Permission denied on bucket query. Check RLS policies.')
        }
        
        throw error
      }
      
      console.log('📋 Found auto deposits for bucket:', data ? data.length : 0, data)
      return data || []
    }).catch(error => {
      console.warn('⚠️ Failed to fetch bucket auto deposits after retries, returning empty array:', error)
      return []
    })
  },

  // Get auto deposit by ID
  async getAutoDepositById(id: string): Promise<AutoDeposit | null> {
    try {
      const { data, error } = await supabase
        .from('auto_deposits')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        // Check if table doesn't exist (common during development)
        if (error.message?.includes('relation "auto_deposits" does not exist')) {
          console.warn('Auto deposits table not found. Please run the Supabase schema to create the auto_deposits table.')
          return null
        }
        console.error('Error fetching auto deposit by ID:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error fetching auto deposit by ID:', error)
      return null
    }
  },

  // Calculate next execution date based on repeat type
  calculateNextExecutionDate(repeatType: AutoDeposit['repeat_type'], repeatEveryDays?: number): string {
    const now = new Date()
    const nextDate = new Date(now)
    
    switch (repeatType) {
      case 'daily':
        nextDate.setDate(now.getDate() + 1) // Daily = 24 hours
        break
      case 'weekly':
        nextDate.setDate(now.getDate() + 7)
        break
      case 'biweekly':
        nextDate.setDate(now.getDate() + 14)
        break
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1)
        break
      case 'custom':
        if (repeatEveryDays && repeatEveryDays >= 2) {
          nextDate.setDate(now.getDate() + repeatEveryDays)
        } else {
          nextDate.setDate(now.getDate() + 7) // Default to weekly
        }
        break
      default:
        nextDate.setDate(now.getDate() + 7)
    }
    
    return nextDate.toISOString() // Full timestamp for testing
  },

  // Update auto deposit status
  async updateAutoDepositStatus(id: string, status: AutoDeposit['status']): Promise<AutoDeposit | null> {
    try {
      console.log('🔄 Updating auto deposit status:', { id, status })
      
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 User authenticated for status update:', {
        isAuthenticated: !!user,
        userId: user?.id
      })
      
      const { data, error } = await supabase
        .from('auto_deposits')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id) // Add user filter for RLS
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error updating auto deposit status:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.error('💡 Permission denied on status update. Check RLS policies.')
        }
        
        return null
      }
      
      console.log('✅ Auto deposit status updated successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Unexpected error updating auto deposit status:', error)
      return null
    }
  },

  // Update auto deposit
  async updateAutoDeposit(id: string, updates: Partial<Omit<AutoDeposit, 'id' | 'user_id' | 'bucket_id' | 'created_at' | 'updated_at'>>): Promise<AutoDeposit | null> {
    try {
      const { data, error } = await supabase
        .from('auto_deposits')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating auto deposit:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error updating auto deposit:', error)
      return null
    }
  },

  // Execute auto deposits that are due
  async executeAutoDeposits(userId?: string): Promise<{ success: boolean; executed: number; error?: string }> {
    try {
      const now = new Date()
      
      // Use provided userId or get current user for data isolation
      const targetUserId = userId || await getCurrentUserId()
      
      // Get all active auto deposits that are due for this user (using full timestamp for testing)
      console.log('🕐 Current time:', now.toISOString())
      console.log('🔍 Checking auto deposits for user:', targetUserId)
      
      // First, get all active auto deposits to see their next execution dates
      let debugQuery = supabase
        .from('auto_deposits')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true })
      
      if (targetUserId) {
        debugQuery = debugQuery.eq('user_id', targetUserId)
      }
      
      const { data: allAutoDeposits } = await debugQuery
      console.log('🔍 All active auto deposits:', allAutoDeposits)
      allAutoDeposits?.forEach((d, index) => {
        console.log(`🔍 Auto deposit ${index + 1}:`, {
          id: d.id,
          amount: d.amount,
          next_execution_date: d.next_execution_date,
          repeat_type: d.repeat_type,
          status: d.status,
          created_at: d.created_at
        })
        console.log(`⏰ Next execution: ${d.next_execution_date} vs Current: ${now.toISOString()}`)
        console.log(`⏰ Is due? ${new Date(d.next_execution_date) <= now}`)
      })
      
      // Query for due deposits with additional safety check
      // Only execute if next_execution_date is in the past AND hasn't been executed in the last 23 hours
      const twentyThreeHoursAgo = new Date(now.getTime() - (23 * 60 * 60 * 1000))
      
      let query = supabase
        .from('auto_deposits')
        .select('*')
        .eq('status', 'active')
        .lte('next_execution_date', now.toISOString())
        .order('created_at', { ascending: true })
      
      // Filter by user if userId is provided (for security)
      if (targetUserId) {
        query = query.eq('user_id', targetUserId)
      }
      
      const { data: dueDeposits, error } = await query
      
      if (error) {
        console.error('Error fetching due auto deposits:', error)
        return { success: false, executed: 0, error: error.message }
      }
      
      if (!dueDeposits || dueDeposits.length === 0) {
        console.log('📅 No auto deposits due for execution')
        return { success: true, executed: 0 }
      }
      
      // Filter out deposits that were executed recently (within last 23 hours) to prevent duplicates
      // This only works if the last_executed_at column exists in the database
      const safeDeposits = dueDeposits.filter(d => {
        // If the column doesn't exist, d.last_executed_at will be undefined
        if (!d.last_executed_at || d.last_executed_at === undefined) return true // Never executed or column doesn't exist, safe to run
        
        try {
          const lastExecution = new Date(d.last_executed_at)
          const hoursSinceLastExecution = (now.getTime() - lastExecution.getTime()) / (1000 * 60 * 60)
          const isSafe = hoursSinceLastExecution >= 23
          if (!isSafe) {
            console.log(`⏸️ Skipping auto-deposit ${d.id} - executed ${hoursSinceLastExecution.toFixed(1)} hours ago (needs 23+ hours)`)
          }
          return isSafe
        } catch (e) {
          // If there's any error parsing the date, allow execution
          return true
        }
      })
      
      if (safeDeposits.length === 0) {
        console.log('📅 No auto deposits safe to execute (all executed recently)')
        return { success: true, executed: 0 }
      }
      
      console.log(`📋 Found ${safeDeposits.length} auto deposits safe for execution:`, safeDeposits.map(d => ({
        id: d.id,
        amount: d.amount,
        bucket_id: d.bucket_id,
        next_execution_date: d.next_execution_date,
        last_executed_at: d.last_executed_at,
        repeat_type: d.repeat_type
      })))
      
      let executedCount = 0
      
      for (const autoDeposit of safeDeposits) {
        try {
          // Check if bucket is completed
          const bucket = await bucketService.getBucket(autoDeposit.bucket_id)
          if (!bucket) continue
          
          // Auto-disable if bucket is completed (regardless of end_type)
          if (bucket.current_amount >= bucket.target_amount) {
            console.log(`🎯 Bucket ${bucket.title} is complete. Marking auto-deposit as completed.`)
            
            // Mark auto deposit as completed
            await this.updateAutoDepositStatus(autoDeposit.id, 'completed')
            
            // Create notification
            await notificationService.createNotification({
              user_id: autoDeposit.user_id,
              title: 'Goal Reached! 🎉',
              message: `Your ${bucket.title} bucket is complete! Auto-deposit has been completed.`,
              type: 'auto_deposit',
              bucket_id: autoDeposit.bucket_id
            })
            continue
          }
          
          // Skip if end date has passed
          if (autoDeposit.end_type === 'specific_date' && 
              autoDeposit.end_date && 
              new Date(autoDeposit.end_date) < now) {
            await this.updateAutoDepositStatus(autoDeposit.id, 'completed')
            continue
          }
          
          // Execute the transfer from main bucket to the target bucket
          console.log(`💰 Executing auto-deposit: $${autoDeposit.amount} from Main Bucket to ${bucket.title}`)
          const transferResult = await mainBucketService.transferFromMainBucket(
            autoDeposit.user_id,
            autoDeposit.bucket_id,
            autoDeposit.amount
          )
          
          console.log(`💰 Transfer result:`, transferResult)
          
          if (transferResult.success) {
            // Create activity record for the auto deposit with time
            const timeString = now.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit',
              hour12: true 
            })
            await activityService.createActivity({
              bucket_id: autoDeposit.bucket_id,
              title: `Auto deposited at ${timeString}`,
              amount: autoDeposit.amount,
              activity_type: 'auto_deposit',
              from_source: 'Main Bucket',
              to_destination: bucket.title,
              date: now.toISOString().split('T')[0],
              description: `Auto deposit of $${autoDeposit.amount} at ${timeString}`,
              user_id: autoDeposit.user_id // Explicitly pass user_id for RLS
            })
            
            // Create notification for the auto deposit
            await notificationService.createNotification({
              user_id: autoDeposit.user_id,
              title: 'Auto Deposit Complete',
              message: `Auto deposit of $${autoDeposit.amount} to ${bucket.title}`,
              type: 'auto_deposit',
              bucket_id: autoDeposit.bucket_id
            })
            
            // Calculate next execution date - IMPORTANT: Use a fixed time to avoid drift
            // Always set to the same time of day to ensure exactly 24 hours between executions
            const nextDate = new Date(autoDeposit.next_execution_date)
            
            // Reset to beginning of day and add the interval
            nextDate.setHours(0, 0, 0, 0) // Reset to midnight
            
            switch (autoDeposit.repeat_type) {
              case 'daily':
                nextDate.setDate(nextDate.getDate() + 1) // Exactly 1 day later at midnight
                break
              case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7) // Exactly 7 days later
                break
              case 'biweekly':
                nextDate.setDate(nextDate.getDate() + 14) // Exactly 14 days later
                break
              case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1) // Next month, same day
                break
              case 'custom':
                if (autoDeposit.repeat_every_days) {
                  nextDate.setDate(nextDate.getDate() + autoDeposit.repeat_every_days)
                }
                break
            }
            
            // Add a small offset to ensure it runs early in the day but not at exact midnight
            nextDate.setHours(1, 0, 0, 0) // Set to 1 AM to avoid timezone issues
            
            // Update next execution date immediately to prevent duplicate executions
            // Try to update last_executed_at if the column exists, otherwise just update next_execution_date
            console.log(`⏰ Updating next execution from ${autoDeposit.next_execution_date} to ${nextDate.toISOString()}`)
            
            // First try with both fields
            let updateResult = await this.updateAutoDeposit(autoDeposit.id, {
              next_execution_date: nextDate.toISOString(),
              last_executed_at: now.toISOString()
            })
            
            // If it failed, try without last_executed_at (column might not exist yet)
            if (!updateResult) {
              console.log('⚠️ Falling back to update without last_executed_at')
              updateResult = await this.updateAutoDeposit(autoDeposit.id, {
                next_execution_date: nextDate.toISOString()
              })
            }
            
            console.log(`📝 Update result:`, updateResult ? 'SUCCESS' : 'FAILED')
            
            executedCount++
            console.log(`✅ Auto deposit executed for bucket ${bucket.title}: $${autoDeposit.amount} (Next: ${nextDate.toLocaleTimeString()})`)
          }
        } catch (error) {
          console.error(`Error executing auto deposit ${autoDeposit.id}:`, error)
        }
      }
      
      return { success: true, executed: executedCount }
    } catch (error) {
      console.error('Error executing auto deposits:', error)
      return { success: false, executed: 0, error: 'Failed to execute auto deposits' }
    }
  }
}

export const userPreferencesService = {
  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return withRetry(async () => {
      console.log('🔍 Fetching user preferences for user:', userId)
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Authentication error:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }
      
      console.log('👤 User authenticated for preferences fetch:', {
        isAuthenticated: !!user,
        userId: user?.id,
        matchesTargetUser: user?.id === userId
      })
      
      if (!user || user.id !== userId) {
        console.error('❌ User not authenticated or ID mismatch')
        throw new Error('User authentication mismatch')
      }
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('❌ Error fetching user preferences:', error)
        console.error('❌ Full error object:', JSON.stringify(error, null, 2))
        console.error('❌ Error details:', {
          message: error?.message || 'No message',
          code: error?.code || 'No code',
          details: error?.details || 'No details',
          hint: error?.hint || 'No hint'
        })
        
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          console.log('📝 No preferences found (PGRST116), creating default preferences')
          return await this.createUserPreferences(userId, { theme: 'light' })
        }
        
        // Check for common issues
        if (error.message?.includes('relation "user_preferences" does not exist')) {
          console.error('💡 User preferences table not found. Please run the add-user-preferences.sql script.')
        }
        if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.error('💡 Permission denied on preferences fetch. Check RLS policies.')
        }
        
        throw error
      }
      
      console.log('✅ User preferences loaded:', data)
      return data
    }).catch(error => {
      console.error('❌ Failed to fetch user preferences after retries:', error)
      return null
    })
  },

  // Create user preferences
  async createUserPreferences(userId: string, preferences: Partial<Pick<UserPreferences, 'theme'>>): Promise<UserPreferences | null> {
    try {
      console.log('🚀 Creating user preferences:', { userId, preferences })
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Authentication error during creation:', authError)
        return null
      }
      
      console.log('👤 User authenticated for preferences creation:', {
        isAuthenticated: !!user,
        userId: user?.id,
        matchesTargetUser: user?.id === userId
      })
      
      if (!user || user.id !== userId) {
        console.error('❌ User not authenticated or ID mismatch during creation')
        return null
      }
      
      const insertData = {
        user_id: userId,
        theme: preferences.theme || 'light'
      }
      
      console.log('📝 Insert data for user preferences:', insertData)
      
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([insertData])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating user preferences:', error)
        console.error('❌ Full error object:', JSON.stringify(error, null, 2))
        console.error('❌ Error details:', {
          message: error?.message || 'No message',
          code: error?.code || 'No code',
          details: error?.details || 'No details',
          hint: error?.hint || 'No hint'
        })
        console.error('❌ Insert data was:', insertData)
        
        // Check for common issues
        if (error.message?.includes('relation "user_preferences" does not exist')) {
          console.error('💡 User preferences table not found. Please run the add-user-preferences.sql script.')
        }
        if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.error('💡 Permission denied on preferences creation. Check RLS policies.')
        }
        
        return null
      }
      
      console.log('✅ User preferences created successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Unexpected error creating user preferences:', error)
      return null
    }
  },

  // Update user preferences
  async updateUserPreferences(userId: string, updates: Partial<Pick<UserPreferences, 'theme'>>): Promise<UserPreferences | null> {
    try {
      console.log('🔧 Updating user preferences:', { userId, updates })
      
      // Use upsert to create if doesn't exist, update if exists
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()
      
      if (error) {
        // If upsert fails, it might be because the table doesn't exist
        // Just log a warning instead of an error since theme still works via localStorage
        console.warn('⚠️ Could not save theme to database (table may not exist), but theme is saved locally')
        return null
      }
      
      console.log('✅ User preferences updated successfully:', data)
      return data
    } catch (error) {
      console.warn('⚠️ Could not save theme to database, but theme is saved locally')
      return null
    }
  },

  // Update user theme specifically
  async updateUserTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<UserPreferences | null> {
    console.log('🎨 Updating user theme:', { userId, theme })
    return await this.updateUserPreferences(userId, { theme })
  }
}

// Notification types and service
export interface Notification {
  id: string
  user_id: string
  type: 'auto_deposit' | 'manual_deposit' | 'withdrawal' | 'goal_reached'
  title: string
  message: string
  amount?: number
  bucket_id?: string
  is_read: boolean
  created_at: string
  read_at?: string
  metadata?: {
    deposit_id?: string
    bucket_name?: string
    bucket_color?: string
  }
}

export const notificationService = {
  // Get all notifications for a user
  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const targetUserId = userId || await getCurrentUserId()
      
      if (!targetUserId) {
        console.warn('⚠️ getNotifications called without userId')
        return []
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  },

  // Get unread notification count
  async getUnreadCount(userId?: string): Promise<number> {
    try {
      const targetUserId = userId || await getCurrentUserId()
      
      if (!targetUserId) {
        return 0
      }
      
      const { data, error } = await supabase
        .rpc('get_unread_notification_count')
      
      if (error) {
        console.error('Error fetching unread count:', error)
        return 0
      }
      
      return data || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  },

  // Mark notifications as read
  async markAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('mark_notifications_read', { notification_ids: notificationIds })
      
      if (error) {
        console.error('Error marking notifications as read:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      return false
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || await getCurrentUserId()
      
      if (!targetUserId) {
        return false
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', targetUserId)
        .eq('is_read', false)
      
      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  },

  // Create a new notification
  async createNotification(notification: {
    user_id: string
    title: string
    message: string
    type?: string
    bucket_id?: string
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'auto_deposit',
          bucket_id: notification.bucket_id,
          is_read: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating notification:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating notification:', error)
      return false
    }
  },

  // Subscribe to new notifications (real-time)
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload.new)
          callback(payload.new as Notification)
        }
      )
      .subscribe()
  }
}