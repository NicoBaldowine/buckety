import { bucketService, transferService, type Activity } from './supabase'

export class HybridStorage {
  private static readonly USER_ID = 'demo-user-id'

  // Get localStorage keys
  private static getBucketsKey(userId?: string): string {
    return `buckets_${userId || this.USER_ID}`
  }

  private static getMainBucketKey(userId?: string): string {
    return `main_bucket_${userId || this.USER_ID}`
  }

  // Get buckets from localStorage
  static getLocalBuckets(userId?: string): any[] {
    try {
      const buckets = localStorage.getItem(this.getBucketsKey(userId))
      return buckets ? JSON.parse(buckets) : []
    } catch (error) {
      console.error('Error reading buckets from localStorage:', error)
      return []
    }
  }

  // Get main bucket from localStorage
  static getLocalMainBucket(userId?: string): any {
    try {
      const mainBucket = localStorage.getItem(this.getMainBucketKey(userId))
      return mainBucket ? JSON.parse(mainBucket) : { currentAmount: 100, title: 'Main Bucket' }
    } catch (error) {
      console.error('Error reading main bucket from localStorage:', error)
      return { currentAmount: 100, title: 'Main Bucket' }
    }
  }

  // Update bucket in localStorage
  static updateLocalBucket(bucketId: string, updates: any, userId?: string): boolean {
    try {
      if (bucketId === 'main-bucket') {
        const mainBucket = this.getLocalMainBucket(userId)
        if (updates.currentAmount !== undefined) mainBucket.currentAmount = updates.currentAmount
        if (updates.title !== undefined) mainBucket.title = updates.title
        localStorage.setItem(this.getMainBucketKey(userId), JSON.stringify(mainBucket))
        return true
      } else {
        const buckets = this.getLocalBuckets(userId)
        const bucket = buckets.find((b: any) => b.id === bucketId)
        if (bucket) {
          if (updates.currentAmount !== undefined) bucket.currentAmount = updates.currentAmount
          if (updates.targetAmount !== undefined) bucket.targetAmount = updates.targetAmount
          if (updates.backgroundColor !== undefined) bucket.backgroundColor = updates.backgroundColor
          if (updates.title !== undefined) bucket.title = updates.title
          localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error updating bucket in localStorage:', error)
      return false
    }
  }

  // Create bucket
  static async createBucket(title: string, targetAmount: number, backgroundColor: string, userId?: string): Promise<string | null> {
    try {
      // Create in database first
      const dbBucket = await bucketService.createBucket(title, targetAmount, backgroundColor, userId || this.USER_ID)
      if (!dbBucket) return null

      // Add to localStorage
      const buckets = this.getLocalBuckets(userId)
      const newLocalBucket = {
        id: dbBucket.id,
        title: dbBucket.title,
        currentAmount: 0,
        targetAmount: dbBucket.target_amount,
        backgroundColor: dbBucket.background_color,
        apy: 3.5
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

  // Transfer money (synchronous for instant UI)
  static transferMoney(
    fromBucketId: string,
    toBucketId: string,
    amount: number,
    userId?: string
  ): { success: boolean; error?: string } {
    if (fromBucketId === 'main-bucket' && toBucketId !== 'main-bucket') {
      // Transfer from main bucket to savings bucket
      const buckets = this.getLocalBuckets(userId)
      const toBucket = buckets.find((b: any) => b.id === toBucketId)

      if (!toBucket) {
        return { success: false, error: 'Destination bucket not found' }
      }

      const mainBucket = this.getLocalMainBucket(userId)
      if (mainBucket.currentAmount < amount) {
        return { success: false, error: 'Insufficient funds' }
      }

      // Update localStorage immediately
      mainBucket.currentAmount -= amount
      toBucket.currentAmount += amount
      localStorage.setItem(this.getMainBucketKey(userId), JSON.stringify(mainBucket))
      localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))

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
      if (transferHistory.length > 50) transferHistory.pop()
      localStorage.setItem('main_bucket_transfers', JSON.stringify(transferHistory))
      localStorage.setItem(`activities_main-bucket`, JSON.stringify(transferHistory))

    } else if (fromBucketId !== 'main-bucket' && toBucketId === 'main-bucket') {
      // Transfer from savings bucket to main bucket
      const buckets = this.getLocalBuckets(userId)
      const fromBucket = buckets.find((b: any) => b.id === fromBucketId)
      
      if (!fromBucket) {
        return { success: false, error: 'Source bucket not found' }
      }

      if (fromBucket.currentAmount < amount) {
        return { success: false, error: 'Insufficient funds' }
      }

      // Update localStorage immediately
      fromBucket.currentAmount -= amount
      localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))
      
      // Log activity for the source bucket
      const fromBucketActivities = JSON.parse(localStorage.getItem(`activities_${fromBucketId}`) || '[]')
      const fromActivity = {
        id: `activity-${Date.now()}-from`,
        title: `To Main Bucket`,
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        activity_type: 'money_removed',
        from_source: fromBucket.title,
        to_destination: 'Main Bucket',
        bucket_id: fromBucketId
      }
      fromBucketActivities.unshift(fromActivity)
      if (fromBucketActivities.length > 50) fromBucketActivities.pop()
      localStorage.setItem(`activities_${fromBucketId}`, JSON.stringify(fromBucketActivities))

      // Update main bucket
      const mainBucket = this.getLocalMainBucket(userId)
      mainBucket.currentAmount += amount
      localStorage.setItem(this.getMainBucketKey(userId), JSON.stringify(mainBucket))

      // Log transfer activity for main bucket
      const transferHistory = JSON.parse(localStorage.getItem('main_bucket_transfers') || '[]')
      const newActivity = {
        id: `activity-${Date.now()}`,
        title: `From ${fromBucket.title}`,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        activity_type: 'money_added',
        from_source: fromBucket.title,
        to_destination: 'Main Bucket',
        bucket_id: 'main-bucket'
      }
      transferHistory.unshift(newActivity)
      if (transferHistory.length > 50) transferHistory.pop()
      localStorage.setItem('main_bucket_transfers', JSON.stringify(transferHistory))
      localStorage.setItem(`activities_main-bucket`, JSON.stringify(transferHistory))

    } else {
      // Transfer between savings buckets
      const buckets = this.getLocalBuckets(userId)
      const fromBucket = buckets.find((b: any) => b.id === fromBucketId)
      const toBucket = buckets.find((b: any) => b.id === toBucketId)

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
    }

    console.log('✅ Transfer completed successfully')
    return { success: true }
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
      
      return activities
    } catch (error) {
      console.error('Error loading activities:', error)
      return []
    }
  }

  // Delete bucket
  static async deleteBucket(bucketId: string, userId?: string): Promise<boolean> {
    try {
      const buckets = this.getLocalBuckets(userId)
      const filteredBuckets = buckets.filter((b: any) => b.id !== bucketId)
      localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(filteredBuckets))
      
      // Remove activities
      localStorage.removeItem(`activities_${bucketId}`)
      
      return true
    } catch (error) {
      console.error('Error deleting bucket:', error)
      return false
    }
  }
}