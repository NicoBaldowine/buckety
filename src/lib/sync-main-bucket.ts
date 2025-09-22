import { mainBucketService, activityService } from './supabase'
import { HybridStorage } from './hybrid-storage'

/**
 * Synchronize Main Bucket balance with activities
 * This function recalculates the correct balance based on all activities
 */
export async function syncMainBucketBalance(userId: string) {
  try {
    console.log('🔄 Starting Main Bucket balance sync for user:', userId)
    
    // Get all Main Bucket activities from database
    const activities = await activityService.getActivities('main-bucket', userId)
    
    // Calculate the correct balance based on activities
    const INITIAL_BALANCE = 1200
    let calculatedBalance = INITIAL_BALANCE
    
    if (activities && activities.length > 0) {
      for (const activity of activities) {
        if (activity.activity_type === 'money_added') {
          calculatedBalance += Math.abs(activity.amount)
        } else if (activity.activity_type === 'money_removed') {
          calculatedBalance -= Math.abs(activity.amount)
        }
      }
    }
    
    console.log('💰 Calculated Main Bucket balance:', calculatedBalance)
    
    // Get current Main Bucket balance
    const currentMainBucket = await mainBucketService.getMainBucket(userId)
    
    if (!currentMainBucket) {
      // Create Main Bucket if it doesn't exist
      console.log('📦 Creating Main Bucket with balance:', calculatedBalance)
      await mainBucketService.updateMainBucket(userId, calculatedBalance)
    } else if (Math.abs(currentMainBucket.current_amount - calculatedBalance) > 0.01) {
      // Update if there's a discrepancy
      console.log('⚠️ Balance discrepancy detected!')
      console.log('  Current:', currentMainBucket.current_amount)
      console.log('  Should be:', calculatedBalance)
      console.log('  Difference:', calculatedBalance - currentMainBucket.current_amount)
      
      // Update the balance
      await mainBucketService.updateMainBucket(userId, calculatedBalance)
      console.log('✅ Main Bucket balance corrected')
    } else {
      console.log('✅ Main Bucket balance is correct')
    }
    
    // Update localStorage
    const mainBucketKey = `main_bucket_${userId}`
    localStorage.setItem(mainBucketKey, JSON.stringify({
      id: 'main-bucket',
      user_id: userId,
      current_amount: calculatedBalance,
      updated_at: new Date().toISOString()
    }))
    
    // Clean up any incorrect localStorage keys
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      
      // Remove global main bucket keys
      if (key === 'main_bucket' || key === 'main_bucket_transfers') {
        keysToRemove.push(key)
      }
      
      // Remove other users' main bucket keys
      if ((key.startsWith('main_bucket_') && !key.endsWith(userId)) ||
          (key.startsWith('main_bucket_transfers_') && !key.endsWith(userId))) {
        keysToRemove.push(key)
      }
    }
    
    for (const key of keysToRemove) {
      console.log('🧹 Removing incorrect key:', key)
      localStorage.removeItem(key)
    }
    
    return calculatedBalance
  } catch (error) {
    console.error('❌ Error syncing Main Bucket balance:', error)
    throw error
  }
}

/**
 * Create missing Main Bucket activities for auto deposits
 * This fixes the issue where auto deposits weren't creating Main Bucket activities
 */
export async function createMissingMainBucketActivities(userId: string) {
  try {
    console.log('🔍 Checking for missing Main Bucket activities...')
    
    // Get all bucket activities
    const buckets = HybridStorage.getLocalBuckets(userId)
    
    for (const bucket of buckets) {
      const bucketActivities = await activityService.getActivities(bucket.id, userId)
      
      if (bucketActivities) {
        for (const activity of bucketActivities) {
          // Check for auto deposits and transfers from Main Bucket
          if ((activity.activity_type === 'auto_deposit' || 
               activity.activity_type === 'money_added') &&
              activity.from_source === 'Main Bucket') {
            
            // Check if corresponding Main Bucket activity exists
            const mainBucketActivities = await activityService.getActivities('main-bucket', userId)
            const hasCorrespondingActivity = mainBucketActivities?.some(ma => 
              ma.to_destination === bucket.title &&
              Math.abs(ma.amount) === activity.amount &&
              ma.date === activity.date
            )
            
            if (!hasCorrespondingActivity) {
              console.log('⚠️ Missing Main Bucket activity for transfer to', bucket.title)
              
              // Create the missing activity
              await activityService.createActivity({
                bucket_id: 'main-bucket',
                user_id: userId,
                title: `To ${bucket.title}`,
                amount: -Math.abs(activity.amount),
                activity_type: 'money_removed',
                from_source: 'Main Bucket',
                to_destination: bucket.title,
                date: activity.date,
                description: `Transfer to ${bucket.title} (reconstructed)`
              })
              
              console.log('✅ Created missing Main Bucket activity')
            }
          }
        }
      }
    }
    
    console.log('✅ Finished checking for missing activities')
  } catch (error) {
    console.error('❌ Error creating missing activities:', error)
  }
}