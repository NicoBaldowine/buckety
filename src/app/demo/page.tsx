"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DemoPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Set a demo user in localStorage
    const demoUser = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      name: 'Demo User'
    }
    
    // Store demo user data
    localStorage.setItem('demo_user', JSON.stringify(demoUser))
    
    // Initialize demo buckets
    const demoBuckets = [
      {
        id: "vacation-demo",
        title: "Vacation Fund 🏖️",
        currentAmount: 1250,
        targetAmount: 3000,
        apy: 3.8,
        backgroundColor: "#B6F3AD"
      },
      {
        id: "emergency-demo",
        title: "Emergency Fund 🚨", 
        currentAmount: 890,
        targetAmount: 2000,
        apy: 4.2,
        backgroundColor: "#BFB0FF"
      }
    ]
    
    localStorage.setItem(`buckets_${demoUser.id}`, JSON.stringify(demoBuckets))
    localStorage.setItem(`mainBucket_${demoUser.id}`, JSON.stringify({ currentAmount: 1200 }))
    
    // Redirect to home with demo mode
    router.push('/home?demo=true')
  }, [router])
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-foreground/50">Setting up demo mode...</div>
    </div>
  )
}