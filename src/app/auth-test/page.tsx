"use client"

import { useState } from "react"
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export default function AuthTestPage() {
  const [status, setStatus] = useState("")
  const [testEmail] = useState("test@example.com")
  const [testPassword] = useState("testpassword123")

  const testSignUp = async () => {
    setStatus("Testing sign up...")
    const result = await authService.signUp(testEmail, testPassword, "Test User")
    setStatus(`Sign up result: ${JSON.stringify(result, null, 2)}`)
  }

  const testSignIn = async () => {
    setStatus("Testing sign in...")
    const result = await authService.signIn(testEmail, testPassword)
    setStatus(`Sign in result: ${JSON.stringify(result, null, 2)}`)
  }

  const testConnection = async () => {
    setStatus("Testing Supabase connection...")
    try {
      const { data, error } = await supabase.from('buckets').select('count')
      if (error) {
        setStatus(`Connection error: ${JSON.stringify(error, null, 2)}`)
      } else {
        setStatus(`Connection successful! Response: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (e) {
      setStatus(`Exception: ${e}`)
    }
  }

  const getCurrentSession = async () => {
    setStatus("Getting current session...")
    const session = await authService.getSession()
    setStatus(`Current session: ${JSON.stringify(session, null, 2)}`)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="space-y-4 mb-8">
        <div>Test Email: {testEmail}</div>
        <div>Test Password: {testPassword}</div>
      </div>

      <div className="space-x-4 mb-8">
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test Connection
        </button>
        <button
          onClick={testSignUp}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Test Sign Up
        </button>
        <button
          onClick={testSignIn}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Test Sign In
        </button>
        <button
          onClick={getCurrentSession}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Get Session
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <pre className="whitespace-pre-wrap text-sm">{status || "Click a button to test"}</pre>
      </div>
    </div>
  )
}