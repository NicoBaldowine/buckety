"use client"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft, Repeat, ChevronRight, ChevronDown } from "lucide-react"
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
  const [accounts, setAccounts] = useState<Account[]>([])
  const [fromAccount, setFromAccount] = useState<Account | null>(null)
  const [toAccount, setToAccount] = useState<Account | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'from' | 'to'>('from')
  
  // Auto-deposit states
  const [showAutoDeposit, setShowAutoDeposit] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [endDate, setEndDate] = useState<'1_month' | '3_months' | '6_months' | '1_year' | 'never'>('3_months')
  const [isSettingAutoDeposit, setIsSettingAutoDeposit] = useState(false)
  
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
    if (!user) return
    
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
    setAccounts(allAccounts)
    
    // Check if we have a 'to' parameter from URL (coming from bucket details)
    const toBucketId = searchParams.get('to')
    const showAutoDepositParam = searchParams.get('showAutoDeposit')
    
    if (toBucketId) {
      const mainBucketAccount = allAccounts.find(account => account.id === 'main-bucket')
      const targetBucket = allAccounts.find(account => account.id === toBucketId)
      
      setFromAccount(mainBucketAccount || null)
      setToAccount(targetBucket || null)
      
      // Auto-show auto deposit mode if requested
      if (showAutoDepositParam === 'true') {
        setShowAutoDeposit(true)
      }
    } else {
      // Default behavior
      const accountsWithFunds = allAccounts.filter(account => account.currentAmount > 0)
      const defaultFromAccount = accountsWithFunds.length > 0 
        ? accountsWithFunds.reduce((max, account) => account.currentAmount > max.currentAmount ? account : max)
        : allAccounts[0]
      
      setFromAccount(defaultFromAccount)
      
      const availableToAccounts = allAccounts.filter(account => account.id !== defaultFromAccount.id)
      setToAccount(availableToAccounts[0] || null)
    }
  }, [user, searchParams])

  const handleAccountSelect = (account: Account) => {
    if (modalType === 'from') {
      setFromAccount(account)
      if (toAccount && account.id === toAccount.id) {
        setToAccount(null)
      }
    } else {
      setToAccount(account)
      if (fromAccount && account.id === fromAccount.id) {
        setFromAccount(null)
      }
    }
    setIsModalOpen(false)
    
    if (amount) {
      setTimeout(() => checkInsufficientBalance(amount), 0)
    }
  }

  const openModal = (type: 'from' | 'to') => {
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleConvert = async () => {
    if (!fromAccount || !toAccount || !amount || hasInsufficientBalance) return

    const transferAmount = parseFloat(amount.replace(/[^\d.]/g, ''))
    if (isNaN(transferAmount) || transferAmount <= 0) return

    try {
      const result = await HybridStorage.transferMoney(fromAccount.id, toAccount.id, transferAmount, user?.id)
      
      if (!result.success) {
        console.error('Transfer failed:', result.error)
        return
      }

      console.log('✅ Transfer successful!')

      // Navigate to destination bucket details
      if (toAccount.id !== 'main-bucket') {
        const localBuckets = HybridStorage.getLocalBuckets(user?.id)
        const bucket = localBuckets.find((b: { id: string }) => b.id === toAccount.id)
        
        if (bucket) {
          const params = new URLSearchParams({
            id: bucket.id,
            title: bucket.title,
            currentAmount: bucket.currentAmount.toString(),
            targetAmount: bucket.targetAmount.toString(),
            backgroundColor: bucket.backgroundColor,
            apy: bucket.apy.toString(),
            fromTransfer: 'true',
            transferAmount: transferAmount.toString()
          })
          router.push(`/bucket-details?${params.toString()}`)
        }
      } else {
        router.push('/home')
      }
    } catch (error) {
      console.error('Transfer error:', error)
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
      let endDateValue: Date | null = null
      const now = new Date()
      
      switch (endDate) {
        case '1_month':
          endDateValue = new Date(now.setMonth(now.getMonth() + 1))
          break
        case '3_months':
          endDateValue = new Date(now.setMonth(now.getMonth() + 3))
          break
        case '6_months':
          endDateValue = new Date(now.setMonth(now.getMonth() + 6))
          break
        case '1_year':
          endDateValue = new Date(now.setFullYear(now.getFullYear() + 1))
          break
        case 'never':
          endDateValue = null
          break
      }

      const autoDeposit = await autoDepositService.createAutoDeposit({
        bucket_id: toAccount.id,
        amount: depositAmount,
        repeat_type: frequency,
        end_type: endDateValue ? 'specific_date' : 'bucket_completed',
        end_date: endDateValue ? endDateValue.toISOString() : undefined,
        status: 'active',
        user_id: user?.id || '',
        next_execution_date: new Date(Date.now() + (frequency === 'daily' ? 86400000 : frequency === 'weekly' ? 604800000 : 2592000000)).toISOString()
      })

      if (autoDeposit) {
        console.log('✅ Auto-deposit created successfully')
        
        // Navigate to bucket details
        const localBuckets = HybridStorage.getLocalBuckets(user?.id)
        const bucket = localBuckets.find((b: { id: string }) => b.id === toAccount.id)
        
        if (bucket) {
          const params = new URLSearchParams({
            id: bucket.id,
            title: bucket.title,
            currentAmount: bucket.currentAmount.toString(),
            targetAmount: bucket.targetAmount.toString(),
            backgroundColor: bucket.backgroundColor,
            apy: bucket.apy.toString(),
            fromAutoDeposit: 'true'
          })
          router.push(`/bucket-details?${params.toString()}`)
        }
      }
    } catch (error) {
      console.error('Error creating auto-deposit:', error)
      alert('Failed to create auto-deposit')
    } finally {
      setIsSettingAutoDeposit(false)
    }
  }

  const frequencyOptions = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  }

  const endDateOptions = {
    '1_month': '1 month',
    '3_months': '3 months',
    '6_months': '6 months',
    '1_year': '1 year',
    'never': 'Never'
  }

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

        {/* From/To Section */}
        <div 
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          {/* Move from */}
          <button 
            className="flex items-center justify-between py-4 px-4 border-b border-foreground/10 w-full text-left hover:bg-foreground/5 transition-colors"
            onClick={() => openModal('from')}
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
            onClick={() => openModal('to')}
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
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                  onClick={() => {
                    // Simple cycle through options for now
                    const options: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly']
                    const currentIndex = options.indexOf(frequency)
                    const nextIndex = (currentIndex + 1) % options.length
                    setFrequency(options[nextIndex])
                  }}
                >
                  <span className="text-[14px] font-medium">{frequencyOptions[frequency]}</span>
                  <ChevronDown className="h-4 w-4 text-foreground/50" />
                </button>
              </div>

              {/* End Date Dropdown */}
              <div className="flex-1">
                <label className="text-[12px] text-foreground/60 font-medium mb-2 block">
                  End when
                </label>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                  onClick={() => {
                    // Simple cycle through options for now
                    const options: Array<'1_month' | '3_months' | '6_months' | '1_year' | 'never'> = ['1_month', '3_months', '6_months', '1_year', 'never']
                    const currentIndex = options.indexOf(endDate)
                    const nextIndex = (currentIndex + 1) % options.length
                    setEndDate(options[nextIndex])
                  }}
                >
                  <span className="text-[14px] font-medium">{endDateOptions[endDate]}</span>
                  <ChevronDown className="h-4 w-4 text-foreground/50" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div 
          className="mt-16 flex justify-between items-center gap-4"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
        >
          {showAutoDeposit ? (
            <>
              <Button 
                variant="secondary"
                onClick={handleConvert}
                disabled={!amount || parseFloat(amount) <= 0 || hasInsufficientBalance}
                className="flex-1"
              >
                Convert
              </Button>
              <Button 
                variant="primary"
                onClick={handleSetAutoDeposit}
                disabled={!amount || parseFloat(amount) <= 0 || hasInsufficientBalance || isSettingAutoDeposit}
                className="flex-1"
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
                className="text-[14px] font-medium bg-transparent border border-foreground/20 text-foreground/60 hover:text-foreground hover:border-foreground/40 hover:bg-transparent"
              >
                Auto deposit
              </Button>
              <Button 
                variant="primary"
                disabled={!amount || parseFloat(amount) <= 0 || hasInsufficientBalance}
                onClick={handleConvert}
              >
                Convert
              </Button>
            </>
          )}
        </div>

        {/* Cancel auto-deposit link */}
        {showAutoDeposit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowAutoDeposit(false)}
              className="text-[14px] text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel auto deposit
            </button>
          </div>
        )}
      </div>

      {/* Account Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'from' ? 'Move from' : 'Move to'}
      >
        <div>
          {accounts
            .filter((account) => {
              if (modalType === 'from') {
                return !toAccount || account.id !== toAccount.id
              } else {
                return !fromAccount || account.id !== fromAccount.id
              }
            })
            .map((account) => {
              const isFromDisabled = modalType === 'from' && account.currentAmount <= 0
              const isToDisabled = modalType === 'to' && !!account.targetAmount && account.currentAmount >= account.targetAmount
              const isDisabled = isFromDisabled || isToDisabled
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
                    {account.targetAmount 
                      ? `$${account.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of $${account.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `$${account.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                  </div>
                </button>
              )
            })}
        </div>
      </Modal>
    </div>
  )
}