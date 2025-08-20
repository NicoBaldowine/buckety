"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DatabaseTestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Testing connection...')
    
    try {
      const { data, error } = await supabase.from('buckets').select('id').limit(1)
      
      if (error) {
        setResult(`❌ Error: ${error.message}`)
        console.error('Supabase error:', error)
      } else {
        setResult('✅ Database connection successful!')
        console.log('Supabase response:', data)
      }
    } catch (err) {
      setResult(`❌ Connection failed: ${err}`)
      console.error('Connection error:', err)
    }
    
    setLoading(false)
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>🧪 Simple Database Test</h1>
      
      <div style={{ margin: '2rem 0' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        minHeight: '100px'
      }}>
        <h3>Result:</h3>
        <pre>{result || 'Click the button to test the connection'}</pre>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <h3>Expected Results:</h3>
        <ul>
          <li>✅ &quot;Database connection successful!&quot; - Database is set up correctly</li>
          <li>❌ &quot;relation &apos;buckets&apos; does not exist&quot; - Need to run SQL schema</li>
          <li>❌ &quot;Invalid API key&quot; - Check .env.local file</li>
        </ul>
      </div>
    </div>
  )
}