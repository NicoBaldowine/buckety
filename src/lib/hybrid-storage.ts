import { bucketService, activityService, mainBucketService, transferService, type Activity } from './supabase'

// Hybrid storage service that combines localStorage for speed + database for persistence
export class HybridStorage {
  private static readonly BUCKETS_KEY = 'buckets'
  private static readonly MAIN_BUCKET_KEY = 'mainBucket'
  private static readonly USER_ID = '00000000-0000-0000-0000-000000000001' // For now, using a fixed test UUID

  // Get user-specific localStorage keys
  private static getBucketsKey(userId?: string): string {
    return userId ? `buckets_${userId}` : this.BUCKETS_KEY
  }

  private static getMainBucketKey(userId?: string): string {
    return userId ? `mainBucket_${userId}` : this.MAIN_BUCKET_KEY
  }

  // Load initial data from database to localStorage
  static async initializeFromDatabase(userId?: string): Promise<void> {
    try {
      // Load buckets from database
      const buckets = await bucketService.getBuckets(userId)
      const localBuckets = buckets.map(bucket => ({
        id: bucket.id,
        title: bucket.title,
        currentAmount: bucket.current_amount,
        targetAmount: bucket.target_amount,
        backgroundColor: bucket.background_color,
        apy: bucket.apy,
        created_at: bucket.created_at,
        updated_at: bucket.updated_at
      }))
      
      if (localBuckets.length > 0) {
        localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(localBuckets))
      }

      // Load main bucket from database (with fallback for RLS issues)
      try {
        const mainBucket = await mainBucketService.getMainBucket(userId || this.USER_ID)
        if (mainBucket) {
          localStorage.setItem(this.getMainBucketKey(userId), JSON.stringify({
            currentAmount: mainBucket.current_amount
          }))
        } else {
          // Database returned null (no auth or RLS issue) - use localStorage fallback
          const existingMainBucket = this.getLocalMainBucket(userId)
          console.log('Using localStorage fallback for main bucket:', existingMainBucket.currentAmount)
        }
      } catch (error) {
        console.warn('Could not load main bucket from database, using localStorage fallback:', error)
        // Keep existing localStorage data
        const existingMainBucket = this.getLocalMainBucket(userId)
        console.log('Keeping existing main bucket amount:', existingMainBucket.currentAmount)
      }

      console.log('✅ Initialized from database:', { buckets: localBuckets.length })
    } catch (error) {
      console.warn('⚠️ Could not load from database, using localStorage only:', error)
    }
  }

  // Create a new bucket (hybrid: localStorage + database)
  static async createBucket(bucketData: {
    title: string
    targetAmount: number
    backgroundColor: string
    apy: number
  }, userId?: string): Promise<string | null> {
    try {
      // 1. Create in database first (to get proper ID and auto-logging)
      const dbBucket = await bucketService.createBucket({
        title: bucketData.title,
        current_amount: 0,
        target_amount: bucketData.targetAmount,
        background_color: bucketData.backgroundColor,
        apy: bucketData.apy,
        user_id: userId || this.USER_ID
      })

      if (!dbBucket) {
        throw new Error('Failed to create bucket in database')
      }

      // 2. Add to localStorage for immediate UI update
      const buckets = this.getLocalBuckets(userId)
      const newLocalBucket = {
        id: dbBucket.id,
        title: dbBucket.title,
        currentAmount: dbBucket.current_amount,
        targetAmount: dbBucket.target_amount,
        backgroundColor: dbBucket.background_color,
        apy: dbBucket.apy,
        created_at: dbBucket.created_at,
        updated_at: dbBucket.updated_at
      }
      
      buckets.push(newLocalBucket)
      localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))

      console.log('✅ Created bucket:', dbBucket.title)
      return dbBucket.id
    } catch (error) {
      console.error('❌ Error creating bucket:', error)
      return null
    }
  }

  // Transfer money (hybrid: localStorage + database + activity logging)
  static async transferMoney(
    fromBucketId: string,
    toBucketId: string,
    amount: number,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Handle main bucket transfers
      if (fromBucketId === 'main-bucket' && toBucketId !== 'main-bucket') {
        // Transfer from main bucket to savings bucket
        const buckets = this.getLocalBuckets(userId)
        const toBucket = buckets.find(b => b.id === toBucketId)
        
        if (!toBucket) {
          return { success: false, error: 'Destination bucket not found' }
        }

        // Update localStorage immediately
        toBucket.currentAmount += amount
        localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))

        // Update main bucket in localStorage too
        const mainBucket = this.getLocalMainBucket(userId)
        mainBucket.currentAmount -= amount
        localStorage.setItem(this.getMainBucketKey(userId), JSON.stringify(mainBucket))

        // Log transfer activity for main bucket
        const transferHistory = JSON.parse(localStorage.getItem('main_bucket_transfers') || '[]')
        transferHistory.unshift({
          id: `activity-${Date.now()}`,
          title: `To ${toBucket.title}`,
          amount: -amount,
          date: new Date().toISOString().split('T')[0],
          activity_type: 'money_removed',
          from_source: 'Main Bucket',
          to_destination: toBucket.title,
          bucket_id: 'main-bucket'
        })
        // Keep only last 50 activities
        if (transferHistory.length > 50) transferHistory.pop()
        localStorage.setItem('main_bucket_transfers', JSON.stringify(transferHistory))
        localStorage.setItem(`activities_main-bucket`, JSON.stringify(transferHistory))

        // Sync to database
        await transferService.transferToSavingsBucket(toBucketId, toBucket.currentAmount, amount, userId || this.USER_ID)
        
      } else if (fromBucketId !== 'main-bucket' && toBucketId === 'main-bucket') {
        // Transfer from savings bucket to main bucket
        const buckets = this.getLocalBuckets(userId)
        const fromBucket = buckets.find(b => b.id === fromBucketId)
        
        if (!fromBucket) {
          return { success: false, error: 'Source bucket not found' }
        }

        if (fromBucket.currentAmount < amount) {
          return { success: false, error: 'Insufficient funds' }
        }

        // Update localStorage immediately
        fromBucket.currentAmount -= amount
        localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))

        // Update main bucket in localStorage too
        const mainBucket = this.getLocalMainBucket(userId)
        mainBucket.currentAmount += amount
        localStorage.setItem(this.getMainBucketKey(userId), JSON.stringify(mainBucket))

        // Log transfer activity for main bucket (money returned)
        const transferHistory = JSON.parse(localStorage.getItem('main_bucket_transfers') || '[]')
        transferHistory.unshift({
          id: `activity-${Date.now()}`,
          title: `From ${fromBucket.title}`,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          activity_type: 'money_added',
          from_source: fromBucket.title,
          to_destination: 'Main Bucket',
          bucket_id: 'main-bucket'
        })
        // Keep only last 50 activities
        if (transferHistory.length > 50) transferHistory.pop()
        localStorage.setItem('main_bucket_transfers', JSON.stringify(transferHistory))
        localStorage.setItem(`activities_main-bucket`, JSON.stringify(transferHistory))

        // Sync to database
        await transferService.transferFromSavingsBucket(fromBucketId, amount, userId || this.USER_ID)
        
      } else {
        // Transfer between savings buckets
        const buckets = this.getLocalBuckets(userId)
        const fromBucket = buckets.find(b => b.id === fromBucketId)
        const toBucket = buckets.find(b => b.id === toBucketId)

        if (!fromBucket || !toBucket) {
          return { success: false, error: 'Bucket not found' }
        }

        if (fromBucket.currentAmount < amount) {
          return { success: false, error: 'Insufficient funds' }
        }

        // Update localStorage immediately
        fromBucket.currentAmount -= amount
        toBucket.currentAmount += amount
        localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))

        // Sync to database
        await bucketService.updateBucket(fromBucketId, { current_amount: fromBucket.currentAmount })
        await bucketService.updateBucket(toBucketId, { current_amount: toBucket.currentAmount })
        
        // Log activities for both buckets
        await activityService.logMoneyRemoved(fromBucketId, amount, toBucket.title)
        await activityService.logMoneyAdded(toBucketId, amount, fromBucket.title)
      }

      console.log('✅ Transfer completed successfully')
      return { success: true }
    } catch (error) {
      console.error('❌ Transfer error:', error)
      return { success: false, error: 'Transfer failed' }
    }
  }

  // Get bucket activities from database with caching
  static async getBucketActivities(bucketId: string, userId?: string): Promise<Activity[]> {
    try {
      // Try to load from cache first
      const cacheKey = `activities_${bucketId}`
      const cachedActivities = localStorage.getItem(cacheKey)
      
      // Return cached activities immediately if available
      let activities: Activity[] = []
      if (cachedActivities) {
        try {
          activities = JSON.parse(cachedActivities)
        } catch {
          console.warn('Error parsing cached activities')
        }
      }
      
      // Load fresh data from database in background
      const loadFreshData = async () => {
        try {
          let freshActivities: Activity[]
          if (bucketId === 'main-bucket') {
            // For main bucket, get transfer history from localStorage
            const transferHistory = localStorage.getItem('main_bucket_transfers') || '[]'
            try {
              freshActivities = JSON.parse(transferHistory)
            } catch {
              freshActivities = []
            }
            
            // Also try to get from database if available
            try {
              const dbActivities = await activityService.getMainBucketTransferActivities(userId || this.USER_ID)
              if (dbActivities && dbActivities.length > 0) {
                freshActivities = dbActivities
              }
            } catch (dbError) {
              console.warn('Could not load main bucket activities from database:', dbError)
            }
          } else {
            freshActivities = await activityService.getActivities(bucketId)
          }
          
          // Cache the fresh data
          localStorage.setItem(cacheKey, JSON.stringify(freshActivities))
          return freshActivities
        } catch (error) {
          console.error('❌ Error loading fresh activities:', error)
          return activities // Return cached activities if fresh load fails
        }
      }
      
      // If we have cached data, return it immediately and update in background
      if (activities.length > 0) {
        // Update cache in background
        loadFreshData()
        return activities
      } else {
        // No cached data, wait for fresh data
        return await loadFreshData()
      }
    } catch (error) {
      console.error('❌ Error loading activities:', error)
      return []
    }
  }

  // Get buckets from localStorage (for fast UI updates)
  static getLocalBuckets(userId?: string): { id: string; title: string; currentAmount: number; targetAmount: number; backgroundColor: string; apy: number }[] {
    const saved = localStorage.getItem(this.getBucketsKey(userId))
    return saved ? JSON.parse(saved) : []
  }

  // Get main bucket from localStorage
  static getLocalMainBucket(userId?: string): { currentAmount: number } {
    const saved = localStorage.getItem(this.getMainBucketKey(userId))
    return saved ? JSON.parse(saved) : { currentAmount: 1200 }
  }

  // Update bucket in both localStorage and database
  static async updateBucket(bucketId: string, updates: {
    title?: string
    targetAmount?: number
    backgroundColor?: string
    currentAmount?: number
  }, userId?: string): Promise<boolean> {
    try {
      // 1. Update localStorage immediately
      const buckets = this.getLocalBuckets(userId)
      const bucket = buckets.find(b => b.id === bucketId)
      if (bucket) {
        if (updates.title !== undefined) bucket.title = updates.title
        if (updates.targetAmount !== undefined) bucket.targetAmount = updates.targetAmount
        if (updates.backgroundColor !== undefined) bucket.backgroundColor = updates.backgroundColor
        if (updates.currentAmount !== undefined) bucket.currentAmount = updates.currentAmount
        
        localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))
      }

      // 2. Sync to database
      const dbUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount
      if (updates.backgroundColor !== undefined) dbUpdates.background_color = updates.backgroundColor
      if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount

      const result = await bucketService.updateBucket(bucketId, dbUpdates)
      return !!result
    } catch (error) {
      console.error('❌ Error updating bucket:', error)
      return false
    }
  }

  // Delete bucket from both localStorage and database
  static async deleteBucket(bucketId: string, userId?: string): Promise<boolean> {
    try {
      // 1. Remove from localStorage immediately
      const buckets = this.getLocalBuckets(userId)
      const filteredBuckets = buckets.filter(b => b.id !== bucketId)
      localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(filteredBuckets))

      // 2. Delete from database
      const success = await bucketService.deleteBucket(bucketId)
      return success
    } catch (error) {
      console.error('❌ Error deleting bucket:', error)
      return false
    }
  }
}