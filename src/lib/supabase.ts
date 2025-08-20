import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export type ActivityType = 
  | 'bucket_created'
  | 'money_added'
  | 'money_removed'
  | 'withdrawal'
  | 'apy_earnings'
  | 'auto_deposit'

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

// Database functions
export const bucketService = {
  // Get all buckets for a user
  async getBuckets(userId?: string): Promise<Bucket[]> {
    let query = supabase.from('buckets').select('*')
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching buckets:', error)
      return []
    }
    
    return data || []
  },

  // Create a new bucket and log creation activity
  async createBucket(bucket: Omit<Bucket, 'id' | 'created_at' | 'updated_at'>): Promise<Bucket | null> {
    const { data, error } = await supabase
      .from('buckets')
      .insert([bucket])
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
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating activity:', error)
      return null
    }
    
    return data
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
    return (data || []).map((activity: any) => ({
      ...activity,
      amount: -Math.abs(activity.amount), // Show as negative since money left main bucket
      title: `To ${activity.bucket?.title || 'savings bucket'}`
    }))
  }
}

export const mainBucketService = {
  // Get main bucket for a user
  async getMainBucket(userId?: string): Promise<MainBucket | null> {
    let query = supabase.from('main_bucket').select('*')
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query.single()
    
    if (error) {
      // For testing without authentication, create a default main bucket
      if (error.message.includes('no rows returned') || error.code === 'PGRST116') {
        console.log('No main bucket found, creating default...')
        return await this.updateMainBucket(userId || 'hybrid-user', 1200)
      }
      console.error('Error fetching main bucket:', error)
      return null
    }
    
    return data
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
      
      // If update failed (record doesn't exist), create new record
      const { data: insertData, error: insertError } = await supabase
        .from('main_bucket')
        .insert({ 
          user_id: userId, 
          current_amount: amount
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating main bucket:', insertError)
        return null
      }
      
      return insertData
    } catch (error) {
      console.error('Error updating main bucket:', error)
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