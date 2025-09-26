import { bucketService, type Activity } from './supabase'

// Helper function to get local date in YYYY-MM-DD format
const getLocalDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export class HybridStorage {
  private static readonly USER_ID = 'demo-user-id'

  // Get localStorage keys
  private static getBucketsKey(userId?: string): string {
    return `buckets_${userId || this.USER_ID}`
  }

  private static getMainBucketKey(userId?: string): string {
    return `mainBucket_${userId || this.USER_ID}`
  }

  // Helper to get activities localStorage key with user isolation
  private static getActivitiesKey(bucketId: string, userId?: string): string {
    return `activities_${bucketId}_${userId || this.USER_ID}`
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

  // Get all buckets from database (for checking if user is existing)
  static async getAllBuckets(userId?: string): Promise<Array<any>> {
    try {
      const buckets = await bucketService.getBuckets(userId || this.USER_ID)
      return buckets || []
    } catch (error) {
      console.error('Error reading buckets from database:', error)
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

  // Transfer money (async to prevent duplicates)
  static async transferMoney(
    fromBucketId: string,
    toBucketId: string,
    amount: number,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Get current user ID if not provided
    const { getCurrentUserId } = await import('./supabase')
    const currentUserId = userId || await getCurrentUserId()
    
    if (!currentUserId) {
      return { success: false, error: 'User not authenticated' }
    }
    if (fromBucketId === 'main-bucket' && toBucketId !== 'main-bucket') {
      // Transfer from main bucket to savings bucket
      const buckets = this.getLocalBuckets(currentUserId)
      const toBucket = buckets.find((b: {id: string; currentAmount: number; targetAmount: number; backgroundColor: string; title: string}) => b.id === toBucketId)

      if (!toBucket) {
        return { success: false, error: 'Destination bucket not found' }
      }

      const mainBucket = this.getLocalMainBucket(currentUserId)
      if (mainBucket.currentAmount < amount) {
        return { success: false, error: 'Insufficient funds' }
      }

      // Update localStorage immediately with proper structure
      const updatedMainBucket = {
        ...mainBucket,
        currentAmount: mainBucket.currentAmount - amount
      }
      toBucket.currentAmount += amount
      
      // Save with consistent format
      localStorage.setItem(this.getMainBucketKey(currentUserId), JSON.stringify(updatedMainBucket))
      localStorage.setItem(this.getBucketsKey(currentUserId), JSON.stringify(buckets))
      
      // Update database and create activity
      try {
        const { bucketService, mainBucketService, activityService } = await import('./supabase')
        
        // Update main bucket balance in database with the NEW amount
        await mainBucketService.updateMainBucket(currentUserId, updatedMainBucket.currentAmount)
        
        // Update destination bucket balance in database
        await bucketService.updateBucket(toBucketId, {
          current_amount: toBucket.currentAmount
        })
        
        // Create activity object
        const activityData = {
          bucket_id: toBucketId,
          title: `From Main Bucket`,
          amount: amount,
          activity_type: 'money_added',
          from_source: 'Main Bucket',
          to_destination: toBucket.title,
          date: getLocalDate(),
          description: `Transferred $${amount} from Main Bucket`,
          created_at: new Date().toISOString()
        }
        
        // Try to save to database
        let dbActivity = null
        try {
          dbActivity = await activityService.createActivity(activityData)
          if (dbActivity) {
            console.log('✅ Activity saved to database')
          } else {
            console.warn('⚠️ Could not save activity to database, saving to localStorage only')
          }
        } catch (error) {
          console.warn('⚠️ Database save failed, saving to localStorage only:', error)
        }
        
        // Always save to localStorage (use dbActivity if available, otherwise use local data)
        const activityToSave = dbActivity || {
          ...activityData,
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        
        const toBucketActivities = JSON.parse(localStorage.getItem(`activities_${toBucketId}`) || '[]')
        
        // Remove any duplicate activities for this transfer (more robust check)
        const currentDate = getLocalDate()
        const currentTime = Date.now()
        const filteredActivities = toBucketActivities.filter((activity: any) => {
          // Check for exact duplicates by title, amount, and recent timestamp
          if (activity.title === 'From Main Bucket' && 
              Math.abs(activity.amount - amount) < 0.01) {
            // If it's the same date, or if the activity was created very recently (within 5 seconds)
            if (activity.date === currentDate || 
                (activity.created_at && new Date(activity.created_at).getTime() > currentTime - 5000)) {
              return false // Remove this duplicate
            }
          }
          return true // Keep this activity
        })
        
        // Add the activity to the top
        filteredActivities.unshift(activityToSave)
        if (filteredActivities.length > 50) filteredActivities.pop()
        
        // Final duplicate check: Remove any exact duplicates by title, amount and date
        const finalActivities = filteredActivities.filter((activity: any, index: number) => {
          return !filteredActivities.slice(0, index).some((existingActivity: any) =>
            existingActivity.title === activity.title &&
            Math.abs(existingActivity.amount - activity.amount) < 0.01 &&
            existingActivity.date === activity.date
          )
        })
        
        localStorage.setItem(`activities_${toBucketId}`, JSON.stringify(finalActivities))
        console.log('✅ Activity saved to localStorage')
        
        console.log('✅ Transfer saved to database')
      } catch (err) {
        console.error('Failed to save transfer to database:', err)
        return { success: false, error: 'Failed to save transfer to database' }
      }
      
      // Log transfer activity for main bucket (user-specific)
      const userSpecificKey = `main_bucket_transfers_${currentUserId}`
      console.log('💾 Saving Main Bucket activity to key:', userSpecificKey)
      
      const transferHistory = JSON.parse(localStorage.getItem(userSpecificKey) || '[]')
      const newActivity = {
        id: `activity-${Date.now()}`,
        title: `To ${toBucket.title}`,
        amount: -amount,
        date: getLocalDate(),
        created_at: new Date().toISOString(),
        activity_type: 'money_removed',
        from_source: 'Main Bucket',
        to_destination: toBucket.title,
        bucket_id: 'main-bucket'
      }
      
      console.log('💾 Adding Main Bucket activity:', newActivity)
      transferHistory.unshift(newActivity)
      
      if (transferHistory.length > 50) transferHistory.pop()
      localStorage.setItem(userSpecificKey, JSON.stringify(transferHistory))
      localStorage.setItem(`activities_main-bucket_${currentUserId}`, JSON.stringify(transferHistory))
      
      console.log('✅ Main Bucket activities saved. Total activities:', transferHistory.length)

    } else if (fromBucketId !== 'main-bucket' && toBucketId === 'main-bucket') {
      // Transfer from savings bucket to main bucket
      const buckets = this.getLocalBuckets(currentUserId)
      const fromBucket = buckets.find((b: {id: string; currentAmount: number; targetAmount: number; backgroundColor: string; title: string}) => b.id === fromBucketId)
      
      if (!fromBucket) {
        return { success: false, error: 'Source bucket not found' }
      }

      if (fromBucket.currentAmount < amount) {
        return { success: false, error: 'Insufficient funds' }
      }

      // Update localStorage immediately
      fromBucket.currentAmount -= amount
      const mainBucket = this.getLocalMainBucket(currentUserId)
      mainBucket.currentAmount += amount
      localStorage.setItem(this.getBucketsKey(currentUserId), JSON.stringify(buckets))
      localStorage.setItem(this.getMainBucketKey(currentUserId), JSON.stringify(mainBucket))
      
      // Update database and create activities
      try {
        const { bucketService, mainBucketService, activityService } = await import('./supabase')
        
        // Update source bucket balance in database
        await bucketService.updateBucket(fromBucketId, {
          current_amount: fromBucket.currentAmount
        })
        
        // Update main bucket balance in database
        await mainBucketService.updateMainBucket(currentUserId, mainBucket.currentAmount)
        
        // Log transfer activity to database for source bucket
        const dbActivity = await activityService.createActivity({
          bucket_id: fromBucketId,
          title: `To Main Bucket`,
          amount: -amount,
          activity_type: 'money_removed',
          from_source: fromBucket.title,
          to_destination: 'Main Bucket',
          date: getLocalDate(),
          description: `Withdrew $${amount} to Main Bucket`
        })
        
        // Cache the database activity in localStorage
        if (dbActivity) {
          const fromBucketActivities = JSON.parse(localStorage.getItem(`activities_${fromBucketId}`) || '[]')
          
          // Remove any duplicate activities for this transfer (more robust check)
          const currentDate = getLocalDate()
          const currentTime = Date.now()
          const filteredActivities = fromBucketActivities.filter((activity: any) => {
            // Check for exact duplicates by title, amount, and recent timestamp
            if (activity.title === 'To Main Bucket' && 
                Math.abs(activity.amount + amount) < 0.01) {
              // If it's the same date, or if the activity was created very recently (within 5 seconds)
              if (activity.date === currentDate || 
                  (activity.created_at && new Date(activity.created_at).getTime() > currentTime - 5000)) {
                return false // Remove this duplicate
              }
            }
            return true // Keep this activity
          })
          
          // Add the database activity to the top
          filteredActivities.unshift(dbActivity)
          if (filteredActivities.length > 50) filteredActivities.pop()
          localStorage.setItem(`activities_${fromBucketId}`, JSON.stringify(filteredActivities))
        }
        
        console.log('✅ Withdrawal saved to database')
      } catch (err) {
        console.error('Failed to save withdrawal to database:', err)
        return { success: false, error: 'Failed to save withdrawal to database' }
      }

      // Log transfer activity for main bucket (user-specific)
      const userSpecificKey = `main_bucket_transfers_${currentUserId}`
      const transferHistory = JSON.parse(localStorage.getItem(userSpecificKey) || '[]')
      const newActivity = {
        id: `activity-${Date.now()}`,
        title: `From ${fromBucket.title}`,
        amount: amount,
        date: getLocalDate(),
        created_at: new Date().toISOString(),
        activity_type: 'money_added',
        from_source: fromBucket.title,
        to_destination: 'Main Bucket',
        bucket_id: 'main-bucket'
      }
      transferHistory.unshift(newActivity)
      if (transferHistory.length > 50) transferHistory.pop()
      localStorage.setItem(userSpecificKey, JSON.stringify(transferHistory))
      localStorage.setItem(`activities_main-bucket_${currentUserId}`, JSON.stringify(transferHistory))

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
      
      // Update database and create activities
      try {
        const { bucketService, activityService } = await import('./supabase')
        
        // Update both bucket balances in database
        await bucketService.updateBucket(fromBucketId, {
          current_amount: fromBucket.currentAmount
        })
        
        await bucketService.updateBucket(toBucketId, {
          current_amount: toBucket.currentAmount
        })
        
        // Log transfer activity to destination bucket
        const toDbActivity = await activityService.createActivity({
          bucket_id: toBucketId,
          title: `From ${fromBucket.title}`,
          amount: amount,
          activity_type: 'money_added',
          from_source: fromBucket.title,
          to_destination: toBucket.title,
          date: getLocalDate(),
          description: `Transferred $${amount} from ${fromBucket.title}`
        })
        
        // Log transfer activity from source bucket
        const fromDbActivity = await activityService.createActivity({
          bucket_id: fromBucketId,
          title: `To ${toBucket.title}`,
          amount: -amount,
          activity_type: 'money_removed',
          from_source: fromBucket.title,
          to_destination: toBucket.title,
          date: getLocalDate(),
          description: `Transferred $${amount} to ${toBucket.title}`
        })
        
        // Cache the database activities in localStorage
        if (toDbActivity) {
          const toBucketActivities = JSON.parse(localStorage.getItem(`activities_${toBucketId}`) || '[]')
          
          // Remove any duplicate activities for this transfer (more robust check)
          const currentDate = getLocalDate()
          const currentTime = Date.now()
          const filteredToActivities = toBucketActivities.filter((activity: any) => {
            // Check for exact duplicates by title, amount, and recent timestamp
            if (activity.title === `From ${fromBucket.title}` && 
                Math.abs(activity.amount - amount) < 0.01) {
              // If it's the same date, or if the activity was created very recently (within 5 seconds)
              if (activity.date === currentDate || 
                  (activity.created_at && new Date(activity.created_at).getTime() > currentTime - 5000)) {
                return false // Remove this duplicate
              }
            }
            return true // Keep this activity
          })
          
          // Add the database activity to the top
          filteredToActivities.unshift(toDbActivity)
          if (filteredToActivities.length > 50) filteredToActivities.pop()
          localStorage.setItem(`activities_${toBucketId}`, JSON.stringify(filteredToActivities))
        }
        
        if (fromDbActivity) {
          const fromBucketActivities = JSON.parse(localStorage.getItem(`activities_${fromBucketId}`) || '[]')
          
          // Remove any duplicate activities for this transfer (more robust check)
          const currentDate = getLocalDate()
          const currentTime = Date.now()
          const filteredFromActivities = fromBucketActivities.filter((activity: any) => {
            // Check for exact duplicates by title, amount, and recent timestamp
            if (activity.title === `To ${toBucket.title}` && 
                Math.abs(activity.amount + amount) < 0.01) {
              // If it's the same date, or if the activity was created very recently (within 5 seconds)
              if (activity.date === currentDate || 
                  (activity.created_at && new Date(activity.created_at).getTime() > currentTime - 5000)) {
                return false // Remove this duplicate
              }
            }
            return true // Keep this activity
          })
          
          // Add the database activity to the top
          filteredFromActivities.unshift(fromDbActivity)
          if (filteredFromActivities.length > 50) filteredFromActivities.pop()
          localStorage.setItem(`activities_${fromBucketId}`, JSON.stringify(filteredFromActivities))
        }
        
        console.log('✅ Transfer between buckets saved to database')
      } catch (err) {
        console.error('Failed to save transfer to database:', err)
        return { success: false, error: 'Failed to save transfer to database' }
      }
    }

    console.log('✅ Transfer completed successfully')
    return { success: true }
  }

  // Clean duplicate activities from localStorage
  static cleanDuplicateActivities(bucketId: string, userId?: string): void {
    try {
      const cacheKey = userId ? `activities_${bucketId}_${userId}` : `activities_${bucketId}`
      const cachedActivities = localStorage.getItem(cacheKey)
      
      if (cachedActivities) {
        const activities = JSON.parse(cachedActivities)
        
        // Remove activities with temporary flag or duplicate activity patterns
        const cleanedActivities = activities.filter((activity: any, index: number) => {
          // Remove if explicitly marked as temporary
          if (activity.temporary === true) return false
          
          // Remove if it's a duplicate (same title, amount, and date)
          const isDuplicate = activities.findIndex((other: any, otherIndex: number) => 
            otherIndex < index && // Only check previous activities
            other.title === activity.title &&
            Math.abs(other.amount - activity.amount) < 0.01 &&
            other.date === activity.date
          ) !== -1
          
          return !isDuplicate
        })
        
        if (cleanedActivities.length !== activities.length) {
          localStorage.setItem(cacheKey, JSON.stringify(cleanedActivities))
          console.log(`✅ Cleaned ${activities.length - cleanedActivities.length} duplicate activities for bucket ${bucketId}`)
        }
      }
    } catch (error) {
      console.error('Error cleaning duplicate activities:', error)
    }
  }

  // Get bucket activities from database with caching
  static async getBucketActivities(bucketId: string, userId?: string): Promise<Activity[]> {
    try {
      // Get current user ID if not provided
      const { getCurrentUserId } = await import('./supabase')
      const targetUserId = userId || await getCurrentUserId()
      
      if (!targetUserId) {
        console.warn('⚠️ getBucketActivities: No user ID provided, returning empty array')
        return []
      }
      
      // Special handling for Main Bucket
      if (bucketId === 'main-bucket') {
        console.log('🏠 Loading Main Bucket activities for user:', targetUserId)
        
        // Try user-specific localStorage first
        const userSpecificKey = `main_bucket_transfers_${targetUserId}`
        console.log('🔍 Looking for Main Bucket activities in key:', userSpecificKey)
        
        const transferHistory = localStorage.getItem(userSpecificKey)
        
        // Don't migrate global data for Main Bucket as it contains activities from ALL users
        // Only use user-specific data
        
        if (transferHistory) {
          try {
            const activities = JSON.parse(transferHistory)
            console.log(`🏠 Found ${activities.length} Main Bucket activities in localStorage:`, activities)
            return activities
          } catch (e) {
            console.warn('Error parsing main bucket transfers:', e)
          }
        } else {
          console.log('🏠 No Main Bucket activities found in localStorage for user:', targetUserId)
        }
        
        // Try to load from database for main bucket
        try {
          const { activityService } = await import('./supabase')
          const dbActivities = await activityService.getActivities(bucketId, targetUserId)
          
          if (dbActivities && dbActivities.length > 0) {
            console.log(`🏠 Found ${dbActivities.length} Main Bucket activities in database`)
            // Cache to user-specific localStorage
            localStorage.setItem(userSpecificKey, JSON.stringify(dbActivities))
            return dbActivities
          }
        } catch (dbError) {
          console.warn('Failed to load Main Bucket activities from database:', dbError)
        }
        
        console.log('🏠 No Main Bucket activities found')
        return []
      }
      
      // Clean any duplicate activities first (with user-specific key)
      this.cleanDuplicateActivities(bucketId, targetUserId)
      
      // Try to load from database first
      const { activityService } = await import('./supabase')
      const dbActivities = await activityService.getActivities(bucketId, targetUserId)
      
      if (dbActivities && dbActivities.length > 0) {
        // Cache the database activities for quick access with user-specific key
        const cacheKey = `activities_${bucketId}_${targetUserId}`
        localStorage.setItem(cacheKey, JSON.stringify(dbActivities))
        return dbActivities
      }
      
      // Fallback to cached activities if database fails or is empty
      const cacheKey = `activities_${bucketId}_${targetUserId}`
      const cachedActivities = localStorage.getItem(cacheKey)
      
      if (cachedActivities) {
        try {
          return JSON.parse(cachedActivities)
        } catch {
          console.warn('Error parsing cached activities')
        }
      }
      
      return []
    } catch (error) {
      console.error('Error loading activities:', error)
      
      // Final fallback to localStorage with user-specific key if we have userId
      if (userId) {
        const cacheKey = `activities_${bucketId}_${userId}`
        const cachedActivities = localStorage.getItem(cacheKey)
        
        if (cachedActivities) {
          try {
            return JSON.parse(cachedActivities)
          } catch {
            console.warn('Error parsing cached activities')
          }
        }
      }
      
      return []
    }
  }

  // Delete bucket
  static async deleteBucket(bucketId: string, userId?: string): Promise<boolean> {
    try {
      // Get current user ID if not provided
      const { getCurrentUserId } = await import('./supabase')
      const targetUserId = userId || await getCurrentUserId()
      
      const buckets = this.getLocalBuckets(targetUserId || undefined)
      const filteredBuckets = buckets.filter((b: {id: string}) => b.id !== bucketId)
      localStorage.setItem(this.getBucketsKey(targetUserId || undefined), JSON.stringify(filteredBuckets))
      
      // Remove activities with user-specific key
      if (targetUserId) {
        localStorage.removeItem(`activities_${bucketId}_${targetUserId}`)
      }
      // Also remove old format key for cleanup
      localStorage.removeItem(`activities_${bucketId}`)
      
      return true
    } catch (error) {
      console.error('Error deleting bucket:', error)
      return false
    }
  }
}