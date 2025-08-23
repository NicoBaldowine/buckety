import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  created_at: string
  updated_at: string
}

// Database functions
export const bucketService = {
  // Get all buckets for a user
  async getBuckets(userId?: string): Promise<Bucket[]> {
    try {
      // Use provided userId or get current user
      const targetUserId = userId || await getCurrentUserId()
      
      let query = supabase.from('buckets').select('*')
      
      if (targetUserId) {
        query = query.eq('user_id', targetUserId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching buckets:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching buckets:', error)
      return []
    }
  },

  // Create a new bucket and log creation activity
  async createBucket(bucket: Omit<Bucket, 'id' | 'created_at' | 'updated_at'>): Promise<Bucket | null> {
    try {
      // Ensure we have a user_id
      const bucketWithUserId = {
        ...bucket,
        user_id: bucket.user_id || await getCurrentUserId()
      }
      
      const { data, error } = await supabase
        .from('buckets')
        .insert([bucketWithUserId])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating bucket:', error)
        return null
      }
      
      // Log bucket creation activity
      if (data) {
        await activityService.createActivity({
          bucket_id: data.id,
          activity_type: 'bucket_created',
          title: 'Bucket created',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: `${data.title} bucket was created with target of $${data.target_amount.toLocaleString()}`
        })
      }
      
      return data
    } catch (error) {
      console.error('Error creating bucket:', error)
      return null
    }
  },

  // Update a bucket
  async updateBucket(id: string, updates: Partial<Bucket>): Promise<Bucket | null> {
    const { data, error } = await supabase
      .from('buckets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating bucket:', error)
      return null
    }
    
    return data
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
  // Get activities for a bucket
  async getActivities(bucketId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('bucket_id', bucketId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching activities:', error)
      return []
    }
    
    return data || []
  },

  // Create a new activity
  async createActivity(activity: Omit<Activity, 'id' | 'created_at'>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([activity])
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
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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
      let query = supabase.from('main_bucket').select('*')
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query.single()
      
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

      // Log the activity (log the transfer amount, not total)
      await activityService.logMoneyAdded(bucketId, transferAmount, 'Main Bucket')
      
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
      const { data, error } = await supabase
        .from('auto_deposits')
        .insert([autoDeposit])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating auto deposit:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        return null
      }
      
      console.log('✅ Auto deposit created successfully in database:', data)
      return data
    } catch (error) {
      console.error('Error creating auto deposit:', error)
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
    try {
      const { data, error } = await supabase
        .from('auto_deposits')
        .select('*')
        .eq('bucket_id', bucketId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) {
        // Check if table doesn't exist (common during development)
        if (error.message?.includes('relation "auto_deposits" does not exist')) {
          console.warn('Auto deposits table not found. Please run the Supabase schema to create the auto_deposits table.')
          return []
        }
        console.error('Error fetching bucket auto deposits:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching bucket auto deposits:', error)
      return []
    }
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
        nextDate.setDate(now.getDate() + 1)
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
    
    return nextDate.toISOString().split('T')[0]
  },

  // Update auto deposit status
  async updateAutoDepositStatus(id: string, status: AutoDeposit['status']): Promise<AutoDeposit | null> {
    try {
      const { data, error } = await supabase
        .from('auto_deposits')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating auto deposit status:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error updating auto deposit status:', error)
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

  // TODO: Add daily worker to execute auto deposit rules
  // This would check for auto deposits where next_execution_date <= today
  // and execute the transfers, then update next_execution_date
}