"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft, Repeat, ChevronRight, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"
import { useAuth } from "@/contexts/auth-context"
import { autoDepositService } from "@/lib/supabase"

interface Account {
  id: string
  title: string
  currentAmount: number
  targetAmount?: number
  backgroundColor?: string
}

export default function AddMoneyPage() {
  return (
    <ProtectedRoute>
      <AddMoneyContent />
    </ProtectedRoute>
  )
}

function AddMoneyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [fromAccount, setFromAccount] = useState<Account | null>(null)
  const [toAccount, setToAccount] = useState<Account | null>(null)
  
  // Auto-deposit states
  const [showAutoDeposit, setShowAutoDeposit] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [endType, setEndType] = useState<'bucket_completed' | 'custom_date'>('bucket_completed')
  const [customDate, setCustomDate] = useState('')
  const [isSettingAutoDeposit, setIsSettingAutoDeposit] = useState(false)
  
  const [isTyping, setIsTyping] = useState(false)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

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
    // Check balance in real-time while typing
    checkInsufficientBalance(value)
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
    
    if (amount) {
      setTimeout(() => checkInsufficientBalance(amount), 0)
    }
  }

  const handleFocus = () => {
    setIsTyping(true)
    if (amount) {
      const cleanValue = amount.replace(/[^\d.]/g, '')
      setAmount(cleanValue)
    }
  }

  const getDisplayValue = () => {
    if (isTyping) {
      return amount
    } else {
      if (amount) {
        const cleanValue = amount.replace(/[^\d.]/g, '')
        if (cleanValue && !isNaN(parseFloat(cleanValue))) {
          return `$${formatAmount(cleanValue)}`
        }
      }
      return ""
    }
  }

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
    
    // Check URL parameters
    const toBucketId = searchParams?.get('to') || searchParams?.get('toId') || null
    const fromBucketId = searchParams?.get('fromId') || null
    const showAutoDepositParam = searchParams?.get('showAutoDeposit') || null
    const urlAmount = searchParams?.get('amount') || null
    const urlFrequency = searchParams?.get('frequency') || null
    const urlEndType = searchParams?.get('endType') || null
    const urlCustomDate = searchParams?.get('customDate') || null
    
    // Handle account selection based on URL params
    let selectedFromAccount: Account | null = null
    
    if (fromBucketId) {
      const fromBucket = allAccounts.find(account => account.id === fromBucketId)
      if (fromBucket) {
        setFromAccount(fromBucket)
        selectedFromAccount = fromBucket
      }
    }
    
    if (toBucketId) {
      const targetBucket = allAccounts.find(account => account.id === toBucketId)
      if (targetBucket) {
        setToAccount(targetBucket)
      }
      
      // If we have a 'to' param but no 'from' param, default from to main bucket
      if (!fromBucketId) {
        const mainBucketAccount = allAccounts.find(account => account.id === 'main-bucket')
        setFromAccount(mainBucketAccount || null)
        selectedFromAccount = mainBucketAccount || null
      }
    }
    
    // If neither from nor to is set, use defaults
    if (!fromBucketId && !toBucketId) {
      // Always default FROM to Main Bucket
      const mainBucketAccount = allAccounts.find(account => account.id === 'main-bucket')
      setFromAccount(mainBucketAccount || null)
      selectedFromAccount = mainBucketAccount || null
      
      // Default TO to the most recently created bucket (last in savedBuckets array)
      const lastBucket = savedBuckets.length > 0 ? savedBuckets[savedBuckets.length - 1] : null
      if (lastBucket) {
        const lastBucketAccount = allAccounts.find(account => account.id === lastBucket.id)
        setToAccount(lastBucketAccount || null)
      } else {
        // If no buckets exist, just pick any non-main bucket account
        const availableToAccounts = allAccounts.filter(account => account.id !== 'main-bucket')
        setToAccount(availableToAccounts[0] || null)
      }
    }
    
    // Restore other state from URL params
    if (urlAmount) {
      setAmount(urlAmount)
      // Check insufficient balance with the restored amount and account
      if (selectedFromAccount && urlAmount) {
        const cleanValue = urlAmount.replace(/[^\d.]/g, '')
        const numericAmount = parseFloat(cleanValue)
        if (!isNaN(numericAmount) && numericAmount > selectedFromAccount.currentAmount) {
          setHasInsufficientBalance(true)
        }
      }
    }
    if (showAutoDepositParam === 'true') setShowAutoDeposit(true)
    if (urlFrequency) setFrequency(urlFrequency as any)
    if (urlEndType) setEndType(urlEndType as any)
    if (urlCustomDate) setCustomDate(urlCustomDate)
  }, [user, searchParams])


  const navigateToAccountSelect = (type: 'from' | 'to') => {
    const params = new URLSearchParams()
    if (fromAccount) params.set('fromId', fromAccount.id)
    if (toAccount) params.set('toId', toAccount.id)
    if (amount) params.set('amount', amount)
    if (showAutoDeposit) params.set('showAutoDeposit', 'true')
    if (frequency) params.set('frequency', frequency)
    if (endType) params.set('endType', endType)
    if (customDate) params.set('customDate', customDate)
    
    const path = type === 'from' ? '/select-from-account' : '/select-to-account'
    router.push(`${path}?${params.toString()}`)
  }

  const handleConvert = () => {
    console.log('🚀 Convert button clicked!')
    console.log('From:', fromAccount?.title, 'To:', toAccount?.title, 'Amount:', amount)
    
    if (!fromAccount || !toAccount || !amount) {
      console.log('❌ Missing required data:', {fromAccount: !!fromAccount, toAccount: !!toAccount, amount: !!amount})
      return
    }
    if (isConverting) {
      console.log('❌ Already converting...')
      return
    }

    const transferAmount = parseFloat(amount.replace(/[^\d.]/g, ''))
    if (isNaN(transferAmount) || transferAmount <= 0) {
      console.log('❌ Invalid amount:', transferAmount)
      return
    }
    
    // Double-check for insufficient funds before attempting transfer
    if (transferAmount > fromAccount.currentAmount) {
      console.log('❌ Insufficient funds:', transferAmount, '>', fromAccount.currentAmount)
      setHasInsufficientBalance(true)
      return
    }

    console.log('✅ Starting transfer...')
    setIsConverting(true)

    const result = HybridStorage.transferMoney(fromAccount.id, toAccount.id, transferAmount, user?.id)
    
    if (!result.success) {
      console.error('Transfer failed:', result.error)
      // Check if it's an insufficient funds error and set the state
      if (result.error?.toLowerCase().includes('insufficient')) {
        setHasInsufficientBalance(true)
      }
      setIsConverting(false)
      return
    }

    console.log('✅ Transfer successful!')

    // Since localStorage is updated instantly, navigate immediately
    // Get fresh data after transfer
    const destinationBucket = toAccount.id === 'main-bucket' 
      ? {
          id: 'main-bucket',
          title: 'Main Bucket',
          currentAmount: HybridStorage.getLocalMainBucket(user?.id).currentAmount,
          targetAmount: 1200,
          backgroundColor: '#E5E7EB',
          apy: 0
        }
      : HybridStorage.getLocalBuckets(user?.id).find((b: { id: string }) => b.id === toAccount.id)
    
    if (destinationBucket) {
      const params = new URLSearchParams({
        id: destinationBucket.id || '',
        title: destinationBucket.title || '',
        currentAmount: (destinationBucket.currentAmount || 0).toString(),
        targetAmount: (destinationBucket.targetAmount || 0).toString(),
        backgroundColor: destinationBucket.backgroundColor || '#ffffff',
        apy: (destinationBucket.apy || 0).toString(),
        fromTransfer: 'true',
        transferAmount: transferAmount.toString(),
        fromSource: fromAccount.title || 'Main Bucket'
      })
      
      // Set navigation context so back button goes to home
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('navigation_context', 'fromTransfer')
      }
      
      // Navigate immediately since data is already updated in localStorage
      router.push(`/bucket-details?${params.toString()}`)
    } else {
      router.push('/home')
    }
  }

  const handleSetAutoDeposit = async () => {
    if (!fromAccount || !toAccount || !amount || hasInsufficientBalance) return
    if (toAccount.id === 'main-bucket') {
      alert('Cannot set auto-deposit to Main Bucket')
      return
    }

    const depositAmount = parseFloat(amount.replace(/[^\d.]/g, ''))
    if (isNaN(depositAmount) || depositAmount <= 0) return

    setIsSettingAutoDeposit(true)

    try {
      // Calculate end date based on selection
      let endDateValue: string | undefined = undefined
      
      if (endType === 'custom_date' && customDate) {
        endDateValue = new Date(customDate).toISOString()
      }

      // Create auto deposit with timeout
      const autoDepositPromise = autoDepositService.createAutoDeposit({
        bucket_id: toAccount.id,
        amount: depositAmount,
        repeat_type: frequency,
        end_type: endType === 'custom_date' ? 'specific_date' : 'bucket_completed',
        end_date: endDateValue,
        status: 'active',
        user_id: user?.id || '',
        next_execution_date: new Date(Date.now() + (
          frequency === 'daily' ? 86400000 : 
          frequency === 'weekly' ? 604800000 : 
          frequency === 'biweekly' ? 1209600000 :
          2592000000
        )).toISOString()
      })

      // Create timeout promise
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('Auto deposit creation timed out after 5 seconds')
          resolve(null)
        }, 5000)
      })

      // Race between auto deposit creation and timeout
      const autoDeposit = await Promise.race([autoDepositPromise, timeoutPromise])

      // Log result for debugging
      console.log('Auto-deposit creation result:', autoDeposit)
      
      // Store auto deposit info in localStorage for immediate display
      const autoDepositInfo = {
        id: autoDeposit?.id || `local-${Date.now()}`,
        bucket_id: toAccount.id,
        amount: depositAmount,
        repeat_type: frequency,
        end_type: endType === 'custom_date' ? 'specific_date' : 'bucket_completed',
        end_date: endDateValue,
        status: 'active',
        user_id: user?.id || '',
        next_execution_date: new Date(Date.now() + (
          frequency === 'daily' ? 86400000 : 
          frequency === 'weekly' ? 604800000 : 
          frequency === 'biweekly' ? 1209600000 :
          2592000000
        )).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Store in localStorage for immediate display
      const autoDepositsKey = `auto_deposits_${toAccount.id}`
      localStorage.setItem(autoDepositsKey, JSON.stringify([autoDepositInfo]))
      console.log('✅ Stored auto deposit in localStorage:', autoDepositInfo)
      
      // Navigate to bucket details regardless of database result
      const localBuckets = HybridStorage.getLocalBuckets(user?.id)
      const bucket = localBuckets.find((b: { id: string }) => b.id === toAccount.id)
      
      if (bucket) {
        if (autoDeposit) {
          console.log('✅ Auto-deposit created successfully in database')
        } else {
          console.warn('⚠️ Auto-deposit creation failed in database, but continuing with localStorage')
        }
        
        const params = new URLSearchParams({
          id: bucket.id || '',
          title: bucket.title || '',
          currentAmount: (bucket.currentAmount || 0).toString(),
          targetAmount: (bucket.targetAmount || 0).toString(),
          backgroundColor: bucket.backgroundColor || '#ffffff',
          apy: (bucket.apy || 0).toString(),
          fromAutoDeposit: 'true'
        })
        
        // Also set navigation context in sessionStorage as backup
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('navigation_context', 'fromAutoDeposit')
        }
        
        router.push(`/bucket-details?${params.toString()}`)
      } else {
        console.error('Bucket not found in localStorage')
        alert('Error: Bucket not found')
      }
    } catch (error) {
      console.error('Error creating auto-deposit:', error)
      alert('Failed to create auto-deposit')
    } finally {
      setIsSettingAutoDeposit(false)
    }
  }


  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
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

        {/* From/To Section */}
        <div 
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          {/* Move from */}
          <button 
            className="flex items-center justify-between py-4 px-4 border-b border-foreground/10 w-full text-left hover:bg-foreground/5 transition-colors"
            onClick={() => navigateToAccountSelect('from')}
          >
            <div>
              <h4 className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                Move from
              </h4>
              <p className="text-[14px] font-medium text-foreground/50 mt-1" style={{ letterSpacing: '-0.03em' }}>
                {fromAccount?.title || 'Select account'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                ${fromAccount?.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/30" />
            </div>
          </button>

          {/* Move to */}
          <button 
            className="flex items-center justify-between py-4 px-4 border-b border-foreground/10 w-full text-left hover:bg-foreground/5 transition-colors"
            onClick={() => navigateToAccountSelect('to')}
          >
            <div>
              <h4 className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                Move to
              </h4>
              <p className="text-[14px] font-medium text-foreground/50 mt-1" style={{ letterSpacing: '-0.03em' }}>
                {toAccount?.title || 'Select account'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
                {toAccount?.targetAmount 
                  ? `$${toAccount.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of $${toAccount.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `$${toAccount?.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
                }
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/30" />
            </div>
          </button>
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
              value={getDisplayValue()}
              onChange={handleAmountChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder="$0.00"
              className={`text-[80px] font-semibold focus:outline-none transition-colors cursor-text bg-transparent border-none text-center w-full ${
                hasInsufficientBalance 
                  ? 'text-red-500' 
                  : 'text-foreground/50 focus:text-foreground'
              }`}
              style={{ letterSpacing: '-0.03em' }}
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

        {/* Auto Deposit Section */}
        {showAutoDeposit && (
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
        )}

        {/* Action Buttons - Desktop */}
        <div 
          className="mt-16 flex justify-between items-center gap-3 max-sm:hidden"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
        >
          {showAutoDeposit ? (
            <>
              <Button 
                variant="secondary"
                onClick={() => setShowAutoDeposit(false)}
                className="text-[14px] font-medium"
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleSetAutoDeposit}
                disabled={
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  hasInsufficientBalance || 
                  isSettingAutoDeposit ||
                  (endType === 'custom_date' && !customDate)
                }
                className=""
              >
                {isSettingAutoDeposit ? 'Setting...' : 'Set auto deposit'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="secondary"
                onClick={() => setShowAutoDeposit(true)}
                icon={<Repeat />}
                className="text-[14px] font-medium"
              >
                Auto deposit
              </Button>
              <Button 
                variant="primary"
                disabled={!amount || parseFloat(amount) <= 0 || hasInsufficientBalance || isConverting}
                onClick={handleConvert}
              >
                {isConverting ? 'Converting...' : 'Convert'}
              </Button>
            </>
          )}
        </div>
        
        {/* Add padding at bottom for mobile to account for sticky buttons */}
        <div className="h-24 sm:hidden"></div>
      </div>

      {/* Sticky Action Buttons - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground/10 sm:hidden">
        <div className="flex justify-between items-center gap-3">
          {showAutoDeposit ? (
            <>
              <Button 
                variant="secondary"
                onClick={() => setShowAutoDeposit(false)}
                className="text-[14px] font-medium"
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleSetAutoDeposit}
                disabled={
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  hasInsufficientBalance || 
                  isSettingAutoDeposit ||
                  (endType === 'custom_date' && !customDate)
                }
              >
                {isSettingAutoDeposit ? 'Setting...' : 'Set auto deposit'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="secondary"
                onClick={() => setShowAutoDeposit(true)}
                icon={<Repeat />}
                className="text-[14px] font-medium"
              >
                Auto deposit
              </Button>
              <Button 
                variant="primary"
                disabled={!amount || parseFloat(amount) <= 0 || hasInsufficientBalance || isConverting}
                onClick={handleConvert}
              >
                {isConverting ? 'Converting...' : 'Convert'}
              </Button>
            </>
          )}
        </div>
      </div>

    </div>
  )
}