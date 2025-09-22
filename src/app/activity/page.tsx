"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ActivityPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to discounts page immediately
    router.replace('/discounts')
  }, [router])

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out flex items-center justify-center">
      <div className="text-foreground/60">Redirecting to Discounts...</div>
    </div>
  )
}