import { bucketService, type Activity } from './supabase'

export class HybridStorage {
  private static readonly USER_ID = 'demo-user-id'

  // Get localStorage keys
  private static getBucketsKey(userId?: string): string {
    return `buckets_${userId || this.USER_ID}`
  }

  private static getMainBucketKey(userId?: string): string {
    return `mainBucket_${userId || this.USER_ID}`
  }

  // Get buckets from localStorage
  static getLocalBuckets(userId?: string): Array<{id: string; title: string; currentAmount: number; targetAmount: number; backgroundColor: string; apy: number}> {
    try {
      const buckets = localStorage.getItem(this.getBucketsKey(userId))
      return buckets ? JSON.parse(buckets) : []
    } catch (error) {
      console.error('Error reading buckets from localStorage:', error)
      return []
    }
  }

  // Get main bucket from localStorage
  static getLocalMainBucket(userId?: string): {currentAmount: number; title: string} {
    try {
      const mainBucket = localStorage.getItem(this.getMainBucketKey(userId))
      return mainBucket ? JSON.parse(mainBucket) : { currentAmount: 100, title: 'Main Bucket' }
    } catch (error) {
      console.error('Error reading main bucket from localStorage:', error)
      return { currentAmount: 100, title: 'Main Bucket' }
    }
  }

  // Update bucket in localStorage
  static updateLocalBucket(bucketId: string, updates: {currentAmount?: number; targetAmount?: number; backgroundColor?: string; title?: string}, userId?: string): boolean {
    try {
      if (bucketId === 'main-bucket') {
        const mainBucket = this.getLocalMainBucket(userId)
        if (updates.currentAmount !== undefined) mainBucket.currentAmount = updates.currentAmount
        if (updates.title !== undefined) mainBucket.title = updates.title
        localStorage.setItem(this.getMainBucketKey(userId), JSON.stringify(mainBucket))
        return true
      } else {
        const buckets = this.getLocalBuckets(userId)
        const bucket = buckets.find((b: {id: string; currentAmount: number; targetAmount: number; backgroundColor: string; title: string}) => b.id === bucketId)
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
      const dbBucket = await bucketService.createBucket({
        title,
        target_amount: targetAmount,
        background_color: backgroundColor,
        user_id: userId || this.USER_ID,
        current_amount: 0,
        apy: 3.5
      })
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

      // Add "Bucket created" activity to localStorage
      const now = new Date()
      console.log('📅 Creating bucket activity with date:', {
        date: now.toISOString().split('T')[0],
        fullTimestamp: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
      const creationActivity = {
        id: `creation-${dbBucket.id}-${Date.now()}`,
        bucket_id: dbBucket.id,
        user_id: userId || this.USER_ID,
        title: 'Bucket created',
        amount: 0,
        activity_type: 'bucket_created',
        from_source: '',
        to_destination: '',
        date: now.toISOString().split('T')[0], // YYYY-MM-DD format for the date field
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
      
      // Store the creation activity in localStorage for this bucket
      // (The database activity is already created by bucketService.createBucket)
      const activitiesKey = `activities_${dbBucket.id}`
      localStorage.setItem(activitiesKey, JSON.stringify([creationActivity]))

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
      const toBucket = buckets.find((b: {id: string; currentAmount: number; targetAmount: number; backgroundColor: string; title: string}) => b.id === toBucketId)

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
      
      // Update database (fire and forget - don't block UI)
      import('./supabase').then(async ({ bucketService, mainBucketService, activityService }) => {
        try {
          // Update main bucket balance in database
          await mainBucketService.updateMainBucket(userId || this.USER_ID, mainBucket.currentAmount)
          
          // Update destination bucket balance in database
          await bucketService.updateBucket(toBucketId, {
            current_amount: toBucket.currentAmount
          })
          
          // Log transfer activity to database
          const dbActivity = await activityService.createActivity({
            bucket_id: toBucketId,
            title: `From Main Bucket`,
            amount: amount,
            activity_type: 'money_added',
            from_source: 'Main Bucket',
            to_destination: toBucket.title,
            date: new Date().toISOString().split('T')[0],
            description: `Transferred $${amount} from Main Bucket`
          })
          
          // If database activity was created successfully, replace the temporary localStorage activity
          if (dbActivity) {
            const toBucketActivities = JSON.parse(localStorage.getItem(`activities_${toBucketId}`) || '[]')
            
            // Remove any temporary activities for this transfer
            const transferDate = new Date().toISOString().split('T')[0]
            const filteredActivities = toBucketActivities.filter((activity: any) => 
              !(activity.title === 'From Main Bucket' && 
                Math.abs(activity.amount - amount) < 0.01 &&
                activity.date === transferDate &&
                (activity.temporary === true || (activity.id && activity.id.startsWith('activity-'))))
            )
            
            // Add the database activity to the top
            filteredActivities.unshift(dbActivity)
            if (filteredActivities.length > 50) filteredActivities.pop()
            localStorage.setItem(`activities_${toBucketId}`, JSON.stringify(filteredActivities))
          }
          
          console.log('✅ Transfer saved to database')
        } catch (err) {
          console.error('Failed to save transfer to database:', err)
        }
      })

      // Log transfer activity for destination bucket (for instant display)
      const toBucketActivities = JSON.parse(localStorage.getItem(`activities_${toBucketId}`) || '[]')
      const currentDate = new Date().toISOString().split('T')[0]
      
      // Check if we already have this exact transfer to avoid duplicates
      const existingTransfer = toBucketActivities.find((activity: any) => 
        activity.title === 'From Main Bucket' && 
        Math.abs(activity.amount - amount) < 0.01 && // Use small delta for float comparison
        activity.date === currentDate
      )
      
      if (!existingTransfer) {
        const tempActivity = {
          id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          title: `From Main Bucket`,
          amount: amount,
          date: currentDate,
          created_at: new Date().toISOString(),
          activity_type: 'money_added',
          from_source: 'Main Bucket',
          to_destination: toBucket.title,
          bucket_id: toBucketId,
          temporary: true // Flag to identify temporary activities
        }
        
        toBucketActivities.unshift(tempActivity)
        if (toBucketActivities.length > 50) toBucketActivities.pop()
        localStorage.setItem(`activities_${toBucketId}`, JSON.stringify(toBucketActivities))
        console.log('✅ Temporary activity created for instant display:', tempActivity)
        console.log('📅 Activity date details:', {
          currentDate,
          isoString: new Date().toISOString(),
          timestamp: Date.now(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      }
      
      // Log transfer activity for main bucket
      const transferHistory = JSON.parse(localStorage.getItem('main_bucket_transfers') || '[]')
      transferHistory.unshift({
        id: `activity-${Date.now()}`,
        title: `To ${toBucket.title}`,
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
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
      const fromBucket = buckets.find((b: {id: string; currentAmount: number; targetAmount: number; backgroundColor: string; title: string}) => b.id === fromBucketId)
      
      if (!fromBucket) {
        return { success: false, error: 'Source bucket not found' }
      }

      if (fromBucket.currentAmount < amount) {
        return { success: false, error: 'Insufficient funds' }
      }

      // Update localStorage immediately
      fromBucket.currentAmount -= amount
      localStorage.setItem(this.getBucketsKey(userId), JSON.stringify(buckets))
      
      // Update database (fire and forget - don't block UI)
      import('./supabase').then(async ({ bucketService, mainBucketService, activityService }) => {
        try {
          // Update source bucket balance in database
          await bucketService.updateBucket(fromBucketId, {
            current_amount: fromBucket.currentAmount
          })
          
          // Update main bucket balance in database (mainBucket already has the new value)
          const updatedMainBucket = this.getLocalMainBucket(userId)
          await mainBucketService.updateMainBucket(userId || this.USER_ID, updatedMainBucket.currentAmount)
          
          // Log transfer activity to database
          await activityService.createActivity({
            bucket_id: fromBucketId,
            title: `To Main Bucket`,
            amount: -amount,
            activity_type: 'money_removed',
            from_source: fromBucket.title,
            to_destination: 'Main Bucket',
            date: new Date().toISOString().split('T')[0],
            description: `Withdrew $${amount} to Main Bucket`
          })
          
          console.log('✅ Withdrawal saved to database')
        } catch (err) {
          console.error('Failed to save withdrawal to database:', err)
        }
      })
      
      // Log activity for the source bucket
      const fromBucketActivities = JSON.parse(localStorage.getItem(`activities_${fromBucketId}`) || '[]')
      const fromActivity = {
        id: `activity-${Date.now()}-from`,
        title: `To Main Bucket`,
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
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
        created_at: new Date().toISOString(),
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
      const fromBucket = buckets.find((b: {id: string; currentAmount: number; targetAmount: number; backgroundColor: string; title: string}) => b.id === fromBucketId)
      const toBucket = buckets.find((b: {id: string; currentAmount: number; targetAmount: number; backgroundColor: string; title: string}) => b.id === toBucketId)

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
      
      // Update database (fire and forget - don't block UI)
      import('./supabase').then(async ({ bucketService, activityService }) => {
        try {
          // Update both bucket balances in database
          await bucketService.updateBucket(fromBucketId, {
            current_amount: fromBucket.currentAmount
          })
          
          await bucketService.updateBucket(toBucketId, {
            current_amount: toBucket.currentAmount
          })
          
          // Log transfer activity to destination bucket
          await activityService.createActivity({
            bucket_id: toBucketId,
            title: `From ${fromBucket.title}`,
            amount: amount,
            activity_type: 'money_added',
            from_source: fromBucket.title,
            to_destination: toBucket.title,
            date: new Date().toISOString().split('T')[0],
            description: `Transferred $${amount} from ${fromBucket.title}`
          })
          
          // Log transfer activity from source bucket
          await activityService.createActivity({
            bucket_id: fromBucketId,
            title: `To ${toBucket.title}`,
            amount: -amount,
            activity_type: 'money_removed',
            from_source: fromBucket.title,
            to_destination: toBucket.title,
            date: new Date().toISOString().split('T')[0],
            description: `Transferred $${amount} to ${toBucket.title}`
          })
          
          console.log('✅ Transfer between buckets saved to database')
        } catch (err) {
          console.error('Failed to save transfer to database:', err)
        }
      })
    }

    console.log('✅ Transfer completed successfully')
    return { success: true }
  }

  // Get bucket activities from database with caching
  static async getBucketActivities(bucketId: string): Promise<Activity[]> {
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
      const filteredBuckets = buckets.filter((b: {id: string}) => b.id !== bucketId)
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