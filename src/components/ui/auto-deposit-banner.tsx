"use client"

import { Settings } from "lucide-react"
import { Button } from "./button"
import { type AutoDeposit } from "@/lib/supabase"

interface AutoDepositBannerProps {
  autoDeposit: AutoDeposit
  onManage: () => void
}

export function AutoDepositBanner({ autoDeposit, onManage }: AutoDepositBannerProps) {
  const getFrequencyText = () => {
    switch (autoDeposit.repeat_type) {
      case 'daily': return 'daily'
      case 'weekly': return 'weekly'
      case 'biweekly': return 'biweekly'
      case 'monthly': return 'monthly'
      case 'custom': 
        return autoDeposit.repeat_every_days 
          ? `every ${autoDeposit.repeat_every_days} days`
          : 'custom frequency'
      default: return autoDeposit.repeat_type
    }
  }

  const getEndDateText = () => {
    if (autoDeposit.end_type === 'bucket_completed') {
      return 'until bucket is completed'
    } else if (autoDeposit.end_date) {
      return `until ${(() => {
        const [year, month, day] = autoDeposit.end_date.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return dateObj.toLocaleDateString();
      })()}`
    }
    return ''
  }

  const getDaysUntilNextDeposit = () => {
    // For daily deposits, next deposit is always tomorrow (or today if not yet executed)
    if (autoDeposit.repeat_type === 'daily') {
      return 'tomorrow'
    }
    
    const nextDate = new Date(autoDeposit.next_execution_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    nextDate.setHours(0, 0, 0, 0)
    
    const diffTime = nextDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'tomorrow'
    if (diffDays < 0) {
      // If negative, calculate based on frequency
      switch (autoDeposit.repeat_type) {
        case 'weekly': return 'in 7 days'
        case 'biweekly': return 'in 14 days'
        case 'monthly': return 'in 30 days'
        default: return 'soon'
      }
    }
    return `in ${diffDays} days`
  }

  return (
    <div 
      className="bg-black/5 rounded-xl px-6 py-6 mb-6"
      style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-black">
            Auto deposit enabled
          </h3>
          <p className="text-[14px] text-black/70 mt-0.5">
            ${autoDeposit.amount.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} {getFrequencyText()} {getEndDateText()}
          </p>
          <p className="text-[12px] text-black/50 mt-0.5">
            Next deposit {getDaysUntilNextDeposit()}
          </p>
        </div>
        <Button
          variant="secondary-icon-black"
          icon={<Settings />}
          onClick={onManage}
          className="!bg-black/5 !text-black"
        />
      </div>
    </div>
  )
}