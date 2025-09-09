"use client"

import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"
import { useAuth } from "@/contexts/auth-context"

interface Account {
  id: string
  title: string
  currentAmount: number
  targetAmount?: number
  backgroundColor?: string
}

export default function SelectFromAccountPage() {
  return (
    <ProtectedRoute>
      <SelectFromAccountContent />
    </ProtectedRoute>
  )
}

function SelectFromAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const toAccountId = searchParams?.get('toId') || ''

  // Load accounts from localStorage
  useEffect(() => {
    if (!user || typeof window === 'undefined') return
    
    const savedBuckets = HybridStorage.getLocalBuckets(user.id)
    const mainBucket = HybridStorage.getLocalMainBucket(user.id)
    
    const allAccounts: Account[] = [
      {
        id: 'main-bucket',
        title: 'Main Bucket',
        currentAmount: mainBucket.currentAmount
      },
      ...savedBuckets.map((bucket: { id: string; title: string; currentAmount: number; targetAmount: number; backgroundColor: string }) => ({
        id: bucket.id,
        title: bucket.title,
        currentAmount: bucket.currentAmount,
        targetAmount: bucket.targetAmount,
        backgroundColor: bucket.backgroundColor
      }))
    ]
    
    // Filter out the toAccount if it's selected
    const filteredAccounts = toAccountId 
      ? allAccounts.filter(account => account.id !== toAccountId)
      : allAccounts
      
    setAccounts(filteredAccounts)
  }, [user, toAccountId])

  const handleAccountSelect = (account: Account) => {
    // Navigate back with the selected account
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('fromId', account.id)
    router.push(`/add-money?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-4"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <div></div> {/* Empty div for spacing */}
          <Button 
            variant="secondary-icon" 
            icon={<X />} 
            onClick={() => router.push(`/add-money?${searchParams?.toString() || ''}`)}
          />
        </div>

        {/* Title */}
        <div 
          className="mb-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-semibold text-foreground"
            style={{ letterSpacing: '-0.03em' }}
          >
            Move from
          </h1>
        </div>

        {/* Account List */}
        <div 
          className="space-y-0"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          {accounts.map((account) => {
            const isDisabled = account.currentAmount <= 0
            return (
              <button
                key={account.id}
                onClick={() => !isDisabled && handleAccountSelect(account)}
                disabled={isDisabled}
                className={`flex items-center justify-between py-4 px-4 border-b border-foreground/10 w-full text-left transition-colors ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-foreground/5 cursor-pointer'
                }`}
              >
                <div>
                  <h4 className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                    {account.title}
                  </h4>
                  <p className="text-[14px] font-medium text-foreground/50 mt-1" style={{ letterSpacing: '-0.03em' }}>
                    {account.id === 'main-bucket' ? 'Main account' : 'Savings bucket'}
                  </p>
                </div>
                <div className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                  ${account.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}