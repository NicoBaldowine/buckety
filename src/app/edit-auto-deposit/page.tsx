"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { ConfirmationModal } from "@/components/ui/modal"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"
import { useAuth } from "@/contexts/auth-context"

interface Account {
  id: string
  title: string
  currentAmount: number
  targetAmount?: number
  backgroundColor?: string
}

export default function EditAutoDepositPage() {
  return (
    <ProtectedRoute>
      <EditAutoDepositContent />
    </ProtectedRoute>
  )
}

function EditAutoDepositContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [fromAccount, setFromAccount] = useState<Account | null>(null)
  const [toAccount, setToAccount] = useState<Account | null>(null)
  
  // Auto-deposit states
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [endType, setEndType] = useState<'bucket_completed' | 'custom_date'>('bucket_completed')
  const [customDate, setCustomDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  
  const [isTyping, setIsTyping] = useState(false)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState(false)

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '')
    if (!numericValue) return "0.00"
    const num = parseFloat(numericValue)
    if (isNaN(num)) return "0.00"
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
    setIsTyping(true)
  }

  const checkInsufficientBalance = (amountToCheck: string) => {
    if (!fromAccount || !amountToCheck) {
      setHasInsufficientBalance(false)
      return
    }
    
    const cleanValue = amountToCheck.replace(/[^\d.]/g, '')
    const numericAmount = parseFloat(cleanValue)
    
    if (!isNaN(numericAmount) && numericAmount > fromAccount.currentAmount) {
      setHasInsufficientBalance(true)
    } else {
      setHasInsufficientBalance(false)
    }
  }

  const handleBlur = () => {
    setIsTyping(false)
    if (amount) {
      const cleanValue = amount.replace(/[^\d.]/g, '')
      if (cleanValue && !isNaN(parseFloat(cleanValue))) {
        setAmount(cleanValue)
        checkInsufficientBalance(cleanValue)
      } else {
        setAmount("")
        setHasInsufficientBalance(false)
      }
    } else {
      setHasInsufficientBalance(false)
    }
  }

  // Load initial data and existing auto deposit settings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get bucket ID from URL params
        const bucketId = searchParams.get('bucket')
        if (!bucketId) {
          router.push('/home')
          return
        }

        // Load accounts
        const buckets = HybridStorage.getLocalBuckets(user?.id)
        const mainBucket = HybridStorage.getLocalMainBucket(user?.id)
        
        const allAccounts: Account[] = [
          {
            id: 'main-bucket',
            title: 'Main Bucket',
            currentAmount: mainBucket.currentAmount
          },
          ...buckets
        ]
        
        // Find the accounts
        const toBucket = buckets.find(b => b.id === bucketId)
        const fromBucket = allAccounts.find(a => a.id === 'main-bucket')
        
        if (toBucket && fromBucket) {
          setToAccount(toBucket)
          setFromAccount(fromBucket)
        }

        // Load existing auto deposit settings from localStorage
        const autoDepositsKey = `auto_deposits_${bucketId}`
        const localAutoDeposits = localStorage.getItem(autoDepositsKey)
        if (localAutoDeposits) {
          try {
            const deposits = JSON.parse(localAutoDeposits)
            if (deposits && deposits.length > 0) {
              const deposit = deposits[0]
              setAmount(deposit.amount.toString())
              setFrequency(deposit.repeat_type)
              setEndType(deposit.end_type === 'specific_date' ? 'custom_date' : 'bucket_completed')
              if (deposit.end_date) {
                setCustomDate(deposit.end_date.split('T')[0])
              }
            }
          } catch {
            console.warn('Error parsing auto deposit settings')
            // Fallback to defaults
            setAmount("10.00")
            setFrequency('weekly')
            setEndType('bucket_completed')
          }
        } else {
          // Fallback to defaults
          setAmount("10.00")
          setFrequency('weekly')
          setEndType('bucket_completed')
        }
        
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [searchParams, user?.id, router])

  const handleSaveChanges = async () => {
    if (!amount || !fromAccount || !toAccount) return
    
    setIsSaving(true)
    try {
      const cleanAmount = amount.replace(/[^\d.]/g, '')
      const numericAmount = parseFloat(cleanAmount)
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        alert('Please enter a valid amount')
        return
      }

      // Update auto deposit in localStorage
      const bucketId = searchParams.get('bucket')
      if (!bucketId) {
        alert('Missing bucket ID')
        return
      }
      
      if (bucketId) {
        const autoDepositsKey = `auto_deposits_${bucketId}`
        const updatedAutoDeposit = {
          id: `local-${Date.now()}`,
          bucket_id: bucketId,
          amount: numericAmount,
          repeat_type: frequency,
          end_type: endType === 'custom_date' ? 'specific_date' : 'bucket_completed',
          end_date: endType === 'custom_date' ? new Date(customDate).toISOString() : undefined,
          status: 'active',
          user_id: user?.id || '',
          next_execution_date: new Date(Date.now() + (
            frequency === 'daily' ? 120000 : // 2 minutes for testing
            frequency === 'weekly' ? 604800000 : 
            frequency === 'biweekly' ? 1209600000 :
            2592000000
          )).toISOString(),
          created_at: new Date().toISOString()
        }
        localStorage.setItem(autoDepositsKey, JSON.stringify([updatedAutoDeposit]))
      }
      
      // Save auto deposit in database
      const { autoDepositService } = await import('@/lib/supabase')
      
      // First, check if there's an existing auto deposit for this bucket and cancel it
      const existingAutoDeposits = await autoDepositService.getBucketAutoDeposits(bucketId)
      for (const existing of existingAutoDeposits) {
        await autoDepositService.updateAutoDepositStatus(existing.id, 'cancelled')
      }
      
      // Create new auto deposit in database
      const autoDepositData = {
        user_id: user?.id || '',
        bucket_id: bucketId,
        amount: numericAmount,
        repeat_type: frequency as any,
        end_type: endType === 'custom_date' ? 'specific_date' as const : 'bucket_completed' as const,
        end_date: endType === 'custom_date' ? new Date(customDate).toISOString() : undefined,
        status: 'active' as const,
        next_execution_date: autoDepositService.calculateNextExecutionDate(frequency as any)
      }
      
      console.log('💾 Creating auto deposit in database:', autoDepositData)
      const createdAutoDeposit = await autoDepositService.createAutoDeposit(autoDepositData)
      
      if (createdAutoDeposit) {
        console.log('✅ Auto deposit created successfully in database:', createdAutoDeposit.id)
      } else {
        console.error('❌ Failed to create auto deposit in database')
      }
      
      console.log('Saving auto deposit changes:', {
        amount: numericAmount,
        frequency,
        endType,
        customDate: endType === 'custom_date' ? customDate : null,
        fromBucketId: fromAccount.id,
        toBucketId: toAccount.id
      })

      // Navigate back to bucket details - but set context so back button goes to home
      const localBuckets = HybridStorage.getLocalBuckets(user?.id)
      const bucket = localBuckets.find((b: { id: string }) => b.id === toAccount.id)
      
      if (bucket) {
        // Set navigation context in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('navigation_context', 'fromAutoDeposit')
        }
        
        const params = new URLSearchParams({
          id: bucket.id || '',
          title: bucket.title || '',
          currentAmount: (bucket.currentAmount || 0).toString(),
          targetAmount: (bucket.targetAmount || 0).toString(),
          backgroundColor: bucket.backgroundColor || '#ffffff',
          apy: (bucket.apy || 0).toString(),
          fromAutoDeposit: 'true'  // Add this flag to indicate we came from auto deposit
        })
        router.push(`/bucket-details?${params.toString()}`)
      } else {
        // Fallback navigation
        router.push('/home')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelAutoDeposit = async () => {
    const bucketId = searchParams.get('bucket')
    if (!bucketId) return
    
    setIsCanceling(true)
    setShowCancelModal(false)
    
    try {
      // First, try to cancel auto deposits in the database
      const { autoDepositService } = await import('@/lib/supabase')
      
      console.log('🗑️ Canceling auto deposits in database for bucket:', bucketId)
      
      // Get all active auto deposits for this bucket
      const activeAutoDeposits = await autoDepositService.getBucketAutoDeposits(bucketId)
      console.log('📋 Found active auto deposits:', activeAutoDeposits.length)
      
      // Cancel each active auto deposit in the database
      for (const autoDeposit of activeAutoDeposits) {
        console.log('🔄 Canceling auto deposit:', autoDeposit.id)
        const result = await autoDepositService.updateAutoDepositStatus(autoDeposit.id, 'cancelled')
        if (result) {
          console.log('✅ Successfully cancelled auto deposit in database:', autoDeposit.id)
        } else {
          console.warn('⚠️ Failed to cancel auto deposit in database:', autoDeposit.id)
        }
      }
      
      // Remove auto deposit from localStorage
      const autoDepositsKey = `auto_deposits_${bucketId}`
      console.log('🗑️ Removing auto deposit from localStorage with key:', autoDepositsKey)
      localStorage.removeItem(autoDepositsKey)
      
      // Verify it was removed
      const checkRemoved = localStorage.getItem(autoDepositsKey)
      console.log('✅ Verification - auto deposit removed from localStorage?', checkRemoved === null ? 'YES' : 'NO, still exists')
      
      console.log('✅ Canceled auto deposit for bucket:', bucketId)
      
      // Navigate back to bucket details - but set context so back button goes to home
      const localBuckets = HybridStorage.getLocalBuckets(user?.id)
      const bucket = localBuckets.find((b: { id: string }) => b.id === bucketId)
      
      if (bucket) {
        // Set navigation context in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('navigation_context', 'fromAutoDeposit')
        }
        
        const params = new URLSearchParams({
          id: bucket.id || '',
          title: bucket.title || '',
          currentAmount: (bucket.currentAmount || 0).toString(),
          targetAmount: (bucket.targetAmount || 0).toString(),
          backgroundColor: bucket.backgroundColor || '#ffffff',
          apy: (bucket.apy || 0).toString(),
          fromAutoDeposit: 'true'  // Add this flag to indicate we came from auto deposit
        })
        router.push(`/bucket-details?${params.toString()}`)
      } else {
        // Fallback navigation
        router.push('/home')
      }
    } catch (error) {
      console.error('Error canceling auto deposit:', error)
      alert('Failed to cancel auto deposit')
    } finally {
      setIsCanceling(false)
    }
  }

  const isButtonDisabled = !amount || amount === "0.00" || hasInsufficientBalance || 
    (endType === 'custom_date' && !customDate)

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-15"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => router.back()}
          />
        </div>

        {/* From/To Section - Disabled */}
        <div 
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          {/* Move from - Disabled */}
          <div className="flex items-center justify-between py-4 px-4 border-b border-foreground/10 w-full opacity-50">
            <div>
              <h4 className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                Move from
              </h4>
              <p className="text-[14px] font-medium text-foreground/50 mt-1" style={{ letterSpacing: '-0.03em' }}>
                {fromAccount?.title || 'Main Bucket'}
              </p>
            </div>
            <div className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
              ${fromAccount?.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>

          {/* Move to - Disabled */}
          <div className="flex items-center justify-between py-4 px-4 border-b border-foreground/10 w-full opacity-50">
            <div>
              <h4 className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                Move to
              </h4>
              <p className="text-[14px] font-medium text-foreground/50 mt-1" style={{ letterSpacing: '-0.03em' }}>
                {toAccount?.title || 'Select account'}
              </p>
            </div>
            <div className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
              {toAccount?.targetAmount 
                ? `$${toAccount.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of $${toAccount.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${toAccount?.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
              }
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div 
          className="mt-10 flex flex-col items-center"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <div 
            className="relative cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              type="text"
              value={isTyping ? amount : formatAmount(amount)}
              onChange={handleAmountChange}
              onBlur={handleBlur}
              placeholder="$0.00"
              className={`text-[80px] font-semibold focus:outline-none transition-colors cursor-text bg-transparent border-none text-center w-full ${
                hasInsufficientBalance 
                  ? 'text-red-500' 
                  : 'text-foreground/50 focus:text-foreground'
              }`}
              style={{ letterSpacing: '-0.03em' }}
              autoFocus
            />
          </div>

          {/* Insufficient Balance Error */}
          {hasInsufficientBalance && (
            <div className="mt-4 text-center">
              <p className="text-red-500 text-[16px] font-semibold" style={{ letterSpacing: '-0.03em' }}>
                Insufficient balance
              </p>
            </div>
          )}
        </div>

        {/* Auto Deposit Settings */}
        <div 
          className="mt-8 space-y-4"
          style={{ animation: 'fadeInUp 0.3s ease-out both' }}
        >
          <div className="flex gap-4">
            {/* Frequency Dropdown */}
            <div className="flex-1">
              <label className="text-[12px] text-foreground/60 font-medium mb-2 block">
                Frequency
              </label>
              <Select
                value={frequency}
                onValueChange={(value) => setFrequency(value as 'daily' | 'weekly' | 'biweekly' | 'monthly')}
              >
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </Select>
            </div>

            {/* End Date Dropdown */}
            <div className="flex-1">
              <label className="text-[12px] text-foreground/60 font-medium mb-2 block">
                End when
              </label>
              {endType === 'custom_date' ? (
                <div className="relative">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0]}
                    className="flex h-12 w-full items-center rounded-xl border border-foreground/20 bg-background px-4 py-3 pr-12 text-[16px] font-medium text-foreground focus:outline-none focus:border-foreground/40"
                    style={{ letterSpacing: '-0.03em' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEndType('bucket_completed')
                      setCustomDate('')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Select
                  value={endType}
                  onValueChange={(value) => setEndType(value as 'bucket_completed' | 'custom_date')}
                >
                  <SelectItem value="bucket_completed">Bucket completed</SelectItem>
                  <SelectItem value="custom_date">Custom date</SelectItem>
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          className="mt-16 flex justify-between items-center gap-3"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
        >
          <Button 
            variant="secondary"
            onClick={() => setShowCancelModal(true)}
            disabled={isCanceling}
            className="text-[14px] font-medium"
          >
            {isCanceling ? 'Canceling...' : 'Cancel auto deposit'}
          </Button>
          <Button 
            variant="primary"
            onClick={handleSaveChanges}
            disabled={isButtonDisabled || isSaving}
            className=""
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelAutoDeposit}
        title="Cancel auto deposit?"
        description={`Are you sure you want to cancel the auto deposit for ${toAccount?.title || 'this bucket'}? This action cannot be undone.`}
        confirmLabel="Cancel auto deposit"
        cancelLabel="Keep auto deposit"
        variant="danger"
        loading={isCanceling}
      />
    </div>
  )
}