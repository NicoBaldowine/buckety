import { bucketService, activityService, mainBucketService, transferService, type Bucket, type Activity } from './supabase'

// Hybrid storage service that combines localStorage for speed + database for persistence
export class HybridStorage {
  private static readonly BUCKETS_KEY = 'buckets'
  private static readonly MAIN_BUCKET_KEY = 'mainBucket'
  private static readonly USER_ID = '00000000-0000-0000-0000-000000000001' // For now, using a fixed test UUID

  // Load initial data from database to localStorage
  static async initializeFromDatabase(): Promise<void> {
    try {
      // Load buckets from database
      const buckets = await bucketService.getBuckets()
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
        localStorage.setItem(this.BUCKETS_KEY, JSON.stringify(localBuckets))
      }

      // Load main bucket from database (with fallback for RLS issues)
      try {
        const mainBucket = await mainBucketService.getMainBucket(this.USER_ID)
        if (mainBucket) {
          localStorage.setItem(this.MAIN_BUCKET_KEY, JSON.stringify({
            currentAmount: mainBucket.current_amount
          }))
        }
      } catch (error) {
        console.warn('Could not load main bucket from database (RLS issue), using default:', error)
        // Use default main bucket amount
        localStorage.setItem(this.MAIN_BUCKET_KEY, JSON.stringify({
          currentAmount: 1200
        }))
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
  }): Promise<string | null> {
    try {
      // 1. Create in database first (to get proper ID and auto-logging)
      const dbBucket = await bucketService.createBucket({
        title: bucketData.title,
        current_amount: 0,
        target_amount: bucketData.targetAmount,
        background_color: bucketData.backgroundColor,
        apy: bucketData.apy,
        user_id: this.USER_ID
      })

      if (!dbBucket) {
        throw new Error('Failed to create bucket in database')
      }

      // 2. Add to localStorage for immediate UI update
      const buckets = this.getLocalBuckets()
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
      localStorage.setItem(this.BUCKETS_KEY, JSON.stringify(buckets))

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
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Handle main bucket transfers
      if (fromBucketId === 'main-bucket' && toBucketId !== 'main-bucket') {
        // Transfer from main bucket to savings bucket
        const buckets = this.getLocalBuckets()
        const toBucket = buckets.find(b => b.id === toBucketId)
        
        if (!toBucket) {
          return { success: false, error: 'Destination bucket not found' }
        }

        // Update localStorage immediately
        toBucket.currentAmount += amount
        localStorage.setItem(this.BUCKETS_KEY, JSON.stringify(buckets))

        // Update main bucket in localStorage too
        const mainBucket = this.getLocalMainBucket()
        mainBucket.currentAmount -= amount
        localStorage.setItem(this.MAIN_BUCKET_KEY, JSON.stringify(mainBucket))

        // Sync to database
        await transferService.transferToSavingsBucket(toBucketId, toBucket.currentAmount, amount, this.USER_ID)
        
      } else if (fromBucketId !== 'main-bucket' && toBucketId === 'main-bucket') {
        // Transfer from savings bucket to main bucket
        const buckets = this.getLocalBuckets()
        const fromBucket = buckets.find(b => b.id === fromBucketId)
        
        if (!fromBucket) {
          return { success: false, error: 'Source bucket not found' }
        }

        if (fromBucket.currentAmount < amount) {
          return { success: false, error: 'Insufficient funds' }
        }

        // Update localStorage immediately
        fromBucket.currentAmount -= amount
        localStorage.setItem(this.BUCKETS_KEY, JSON.stringify(buckets))

        // Update main bucket in localStorage too
        const mainBucket = this.getLocalMainBucket()
        mainBucket.currentAmount += amount
        localStorage.setItem(this.MAIN_BUCKET_KEY, JSON.stringify(mainBucket))

        // Sync to database
        await transferService.transferFromSavingsBucket(fromBucketId, amount, this.USER_ID)
        
      } else {
        // Transfer between savings buckets
        const buckets = this.getLocalBuckets()
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
        localStorage.setItem(this.BUCKETS_KEY, JSON.stringify(buckets))

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

  // Get bucket activities from database
  static async getBucketActivities(bucketId: string): Promise<Activity[]> {
    try {
      if (bucketId === 'main-bucket') {
        // For main bucket, get all transfer activities where money was sent to other buckets
        const activities = await activityService.getMainBucketTransferActivities(this.USER_ID)
        return activities
      }
      return await activityService.getActivities(bucketId)
    } catch (error) {
      console.error('❌ Error loading activities:', error)
      return []
    }
  }

  // Get buckets from localStorage (for fast UI updates)
  static getLocalBuckets(): any[] {
    const saved = localStorage.getItem(this.BUCKETS_KEY)
    return saved ? JSON.parse(saved) : []
  }

  // Get main bucket from localStorage
  static getLocalMainBucket(): { currentAmount: number } {
    const saved = localStorage.getItem(this.MAIN_BUCKET_KEY)
    return saved ? JSON.parse(saved) : { currentAmount: 1200 }
  }

  // Update bucket in both localStorage and database
  static async updateBucket(bucketId: string, updates: {
    title?: string
    targetAmount?: number
    backgroundColor?: string
    currentAmount?: number
  }): Promise<boolean> {
    try {
      // 1. Update localStorage immediately
      const buckets = this.getLocalBuckets()
      const bucket = buckets.find(b => b.id === bucketId)
      if (bucket) {
        if (updates.title !== undefined) bucket.title = updates.title
        if (updates.targetAmount !== undefined) bucket.targetAmount = updates.targetAmount
        if (updates.backgroundColor !== undefined) bucket.backgroundColor = updates.backgroundColor
        if (updates.currentAmount !== undefined) bucket.currentAmount = updates.currentAmount
        
        localStorage.setItem(this.BUCKETS_KEY, JSON.stringify(buckets))
      }

      // 2. Sync to database
      const dbUpdates: any = {}
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
  static async deleteBucket(bucketId: string): Promise<boolean> {
    try {
      // 1. Remove from localStorage immediately
      const buckets = this.getLocalBuckets()
      const filteredBuckets = buckets.filter(b => b.id !== bucketId)
      localStorage.setItem(this.BUCKETS_KEY, JSON.stringify(filteredBuckets))

      // 2. Delete from database
      const success = await bucketService.deleteBucket(bucketId)
      return success
    } catch (error) {
      console.error('❌ Error deleting bucket:', error)
      return false
    }
  }
}