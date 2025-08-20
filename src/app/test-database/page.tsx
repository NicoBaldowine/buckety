"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  supabase, 
  bucketService, 
  activityService, 
  mainBucketService,
  transferService,
  type Bucket,
  type Activity,
  type MainBucket
} from '@/lib/supabase'

export default function TestDatabasePage() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [mainBucket, setMainBucket] = useState<MainBucket | null>(null)
  const [testBucketName, setTestBucketName] = useState('Test Bucket 🧪')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    console.log(message)
  }

  // Test database connection
  const testConnection = async () => {
    setLoading(true)
    addLog('Testing Supabase connection...')
    
    try {
      const { data, error } = await supabase.from('buckets').select('id').limit(1)
      
      if (error) {
        addLog(`❌ Connection failed: ${error.message}`)
        if (error.message.includes('relation "buckets" does not exist')) {
          addLog('💡 Please run the SQL schema in your Supabase dashboard first!')
        }
      } else {
        addLog('✅ Database connection successful!')
      }
    } catch (err) {
      addLog(`❌ Connection error: ${err}`)
    }
    
    setLoading(false)
  }

  // Test creating a bucket
  const testCreateBucket = async () => {
    setLoading(true)
    addLog('Creating test bucket...')
    
    try {
      const newBucket = await bucketService.createBucket({
        title: testBucketName,
        current_amount: 0,
        target_amount: 1000,
        background_color: '#B6F3AD',
        apy: 3.5
      })
      
      if (newBucket) {
        addLog(`✅ Bucket created: ${newBucket.title} (ID: ${newBucket.id})`)
        await loadBuckets()
      } else {
        addLog('❌ Failed to create bucket')
      }
    } catch (err) {
      addLog(`❌ Error creating bucket: ${err}`)
    }
    
    setLoading(false)
  }

  // Test transfer money
  const testTransfer = async () => {
    if (buckets.length === 0) {
      addLog('❌ Please create a bucket first')
      return
    }

    setLoading(true)
    addLog('Testing money transfer...')
    
    try {
      const bucket = buckets[0]
      const transferAmount = 100
      
      // First ensure main bucket exists
      await mainBucketService.updateMainBucket('test-user', 1200)
      
      const result = await transferService.transferToSavingsBucket(
        bucket.id,
        bucket.current_amount + transferAmount,
        'test-user'
      )
      
      if (result.success) {
        addLog(`✅ Transferred $${transferAmount} to ${bucket.title}`)
        await loadBuckets()
        await loadActivities(bucket.id)
        await loadMainBucket()
      } else {
        addLog(`❌ Transfer failed: ${result.error}`)
      }
    } catch (err) {
      addLog(`❌ Transfer error: ${err}`)
    }
    
    setLoading(false)
  }

  // Load all buckets
  const loadBuckets = async () => {
    try {
      const data = await bucketService.getBuckets()
      setBuckets(data)
      addLog(`📦 Loaded ${data.length} buckets`)
    } catch (err) {
      addLog(`❌ Error loading buckets: ${err}`)
    }
  }

  // Load activities for first bucket
  const loadActivities = async (bucketId?: string) => {
    if (!bucketId && buckets.length === 0) return
    
    try {
      const id = bucketId || buckets[0].id
      const data = await activityService.getActivities(id)
      setActivities(data)
      addLog(`📋 Loaded ${data.length} activities for bucket`)
    } catch (err) {
      addLog(`❌ Error loading activities: ${err}`)
    }
  }

  // Load main bucket
  const loadMainBucket = async () => {
    try {
      const data = await mainBucketService.getMainBucket('test-user')
      setMainBucket(data)
      if (data) {
        addLog(`💰 Main bucket: $${data.current_amount}`)
      }
    } catch (err) {
      addLog(`❌ Error loading main bucket: ${err}`)
    }
  }

  // Delete test bucket
  const deleteTestBucket = async () => {
    if (buckets.length === 0) return
    
    setLoading(true)
    const bucket = buckets[0]
    
    try {
      const success = await bucketService.deleteBucket(bucket.id)
      if (success) {
        addLog(`🗑️ Deleted bucket: ${bucket.title}`)
        await loadBuckets()
        setActivities([])
      } else {
        addLog('❌ Failed to delete bucket')
      }
    } catch (err) {
      addLog(`❌ Error deleting bucket: ${err}`)
    }
    
    setLoading(false)
  }

  // Clear logs
  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    addLog('🚀 Database test page loaded')
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Database Test Page</h1>
        
        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Button onClick={testConnection} disabled={loading}>
            Test Connection
          </Button>
          
          <div className="flex gap-2">
            <Input 
              value={testBucketName}
              onChange={(e) => setTestBucketName(e.target.value)}
              placeholder="Bucket name"
              className="flex-1"
            />
            <Button onClick={testCreateBucket} disabled={loading}>
              Create Bucket
            </Button>
          </div>
          
          <Button onClick={testTransfer} disabled={loading || buckets.length === 0}>
            Test Transfer ($100)
          </Button>
          
          <Button onClick={loadBuckets} disabled={loading}>
            Load Buckets
          </Button>
          
          <Button onClick={() => loadActivities()} disabled={loading || buckets.length === 0}>
            Load Activities
          </Button>
          
          <Button onClick={deleteTestBucket} disabled={loading || buckets.length === 0} variant="secondary">
            Delete Test Bucket
          </Button>
        </div>

        {/* Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Buckets */}
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">📦 Buckets ({buckets.length})</h2>
            {buckets.length === 0 ? (
              <p className="text-muted-foreground">No buckets found</p>
            ) : (
              <div className="space-y-2">
                {buckets.map(bucket => (
                  <div key={bucket.id} className="p-3 bg-secondary rounded">
                    <div className="font-medium">{bucket.title}</div>
                    <div className="text-sm text-muted-foreground">
                      ${bucket.current_amount} / ${bucket.target_amount} • {bucket.apy}% APY
                    </div>
                    <div className="text-xs text-muted-foreground">ID: {bucket.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activities */}
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">📋 Activities ({activities.length})</h2>
            {activities.length === 0 ? (
              <p className="text-muted-foreground">No activities found</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activities.map(activity => (
                  <div key={activity.id} className="p-3 bg-secondary rounded">
                    <div className="font-medium">{activity.title}</div>
                    <div className="text-sm">
                      <span className={activity.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {activity.amount >= 0 ? '+' : ''}${Math.abs(activity.amount)}
                      </span>
                      <span className="ml-2 text-muted-foreground">• {activity.activity_type}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.date} • {activity.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Bucket Info */}
        {mainBucket && (
          <div className="border rounded-lg p-4 mb-8">
            <h2 className="text-xl font-semibold mb-2">💰 Main Bucket</h2>
            <p className="text-2xl font-bold">${mainBucket.current_amount}</p>
            <p className="text-sm text-muted-foreground">Updated: {mainBucket.updated_at}</p>
          </div>
        )}

        {/* Logs */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📝 Logs</h2>
            <Button onClick={clearLogs} variant="secondary" size="sm">
              Clear Logs
            </Button>
          </div>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions:</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>First, run the SQL schema in your Supabase dashboard</li>
            <li>Click "Test Connection" to verify database setup</li>
            <li>Create a test bucket to verify write operations</li>
            <li>Test money transfers to verify complex operations</li>
            <li>Check activities to verify logging is working</li>
          </ol>
        </div>
      </div>
    </div>
  )
}