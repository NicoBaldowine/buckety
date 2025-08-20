"use client"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { HybridStorage } from "@/lib/hybrid-storage"

interface Account {
  id: string
  title: string
  currentAmount: number
  targetAmount?: number
  backgroundColor?: string
}

export default function AddMoneyPage() {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [fromAccount, setFromAccount] = useState<Account | null>(null)
  const [toAccount, setToAccount] = useState<Account | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'from' | 'to'>('from')

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '')
    
    if (!numericValue) return "0.00"
    
    // Parse as number and format with commas and always 2 decimals
    const num = parseFloat(numericValue)
    if (isNaN(num)) return "0.00"
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const [isTyping, setIsTyping] = useState(false)
  const [hasInsufficientBalance, setHasInsufficientBalance] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Allow completely free typing - store exactly what user types
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
    // Only format when user is done typing
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

  const handleFocus = () => {
    setIsTyping(true)
    // When focusing, show raw value for easy editing
    if (amount) {
      const cleanValue = amount.replace(/[^\d.]/g, '')
      setAmount(cleanValue)
    }
  }

  const getDisplayValue = () => {
    if (isTyping) {
      // While typing, show exactly what user typed
      return amount
    } else {
      // When not typing, show formatted value
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
    const savedBuckets = localStorage.getItem('buckets')
    if (savedBuckets) {
      const buckets = JSON.parse(savedBuckets)
      
      // Get main bucket from hybrid storage instead of hardcoding
      const mainBucket = HybridStorage.getLocalMainBucket()
      
      const allAccounts: Account[] = [
        {
          id: 'main-bucket',
          title: 'Main Bucket',
          currentAmount: mainBucket.currentAmount
        },
        ...buckets.map((bucket: any) => ({
          id: bucket.id,
          title: bucket.title,
          currentAmount: bucket.currentAmount,
          targetAmount: bucket.targetAmount,
          backgroundColor: bucket.backgroundColor
        }))
      ]
      setAccounts(allAccounts)
      
      // Set default accounts
      setFromAccount(allAccounts[0]) // Main Bucket
      setToAccount(allAccounts[1] || null) // First bucket or null
    }
  }, [])


  const handleAccountSelect = (account: Account) => {
    if (modalType === 'from') {
      setFromAccount(account)
    } else {
      setToAccount(account)
    }
    setIsModalOpen(false)
  }

  const openModal = (type: 'from' | 'to') => {
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleMaxAmount = () => {
    if (fromAccount) {
      // Get the maximum available amount from the selected "Move from" account
      const maxAmount = fromAccount.currentAmount.toString()
      setAmount(maxAmount)
      setIsTyping(false) // Show formatted version
      
      // Force update the input display
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.blur()
          inputRef.current.focus()
        }
      }, 0)
    }
  }

  const handleConvert = async () => {
    if (!fromAccount || !toAccount || !amount || hasInsufficientBalance) return

    const transferAmount = parseFloat(amount.replace(/[^\d.]/g, ''))
    if (isNaN(transferAmount) || transferAmount <= 0) return

    try {
      // Use hybrid storage for proper database + localStorage sync
      const result = await HybridStorage.transferMoney(fromAccount.id, toAccount.id, transferAmount)
      
      if (!result.success) {
        console.error('Transfer failed:', result.error)
        return
      }

      console.log('✅ Transfer successful!')

      // Navigate to destination bucket details with transfer indicator
      if (toAccount.id !== 'main-bucket') {
        // Get updated bucket data from localStorage (now synced with database)
        const localBuckets = HybridStorage.getLocalBuckets()
        const bucket = localBuckets.find((b: any) => b.id === toAccount.id)
        
        if (bucket) {
          const params = new URLSearchParams({
            id: bucket.id,
            title: bucket.title,
            currentAmount: bucket.currentAmount.toString(),
            targetAmount: bucket.targetAmount.toString(),
            backgroundColor: bucket.backgroundColor,
            apy: bucket.apy.toString(),
            fromTransfer: 'true' // Changed from showTransfer to fromTransfer for better detection
          })
          router.push(`/bucket-details?${params.toString()}`)
        }
      } else {
        // If transferring to main bucket, go to home
        router.push('/home')
      }
    } catch (error) {
      console.error('Transfer error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6">
        {/* Header with back button only */}
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

        {/* Move from/to section */}
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
            <div className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
              {fromAccount?.targetAmount 
                ? `$${fromAccount.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of $${fromAccount.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${fromAccount?.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
              }
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
            <div className="text-[16px] font-semibold text-foreground" style={{ letterSpacing: '-0.03em' }}>
              {toAccount?.targetAmount 
                ? `$${toAccount.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of $${toAccount.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${toAccount?.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
              }
            </div>
          </button>
        </div>

        {/* Large amount input centered */}
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
          
          {/* MAX Button below amount */}
          <div className="mt-1">
            <Button 
              variant="secondary"
              onClick={handleMaxAmount}
              className="text-xs px-3 py-1 h-auto"
            >
              MAX
            </Button>
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

        {/* Convert Button */}
        <div 
          className="mt-16 flex justify-end"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
        >
          <Button 
            variant="primary"
            disabled={!amount || parseFloat(amount) <= 0 || hasInsufficientBalance}
            onClick={handleConvert}
          >
            Convert
          </Button>
        </div>
      </div>

      {/* Account Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'from' ? 'Move from' : 'Move to'}
      >
        <div>
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleAccountSelect(account)}
              className="flex items-center justify-between py-4 px-4 border-b border-foreground/10 w-full text-left hover:bg-foreground/5 transition-colors"
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
          ))}
        </div>
      </Modal>
    </div>
  )
}