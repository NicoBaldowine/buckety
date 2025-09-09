"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Repeat, PartyPopper, AlertTriangle, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

interface NotificationSettings {
  autoDeposit: boolean
  weeklyReport: boolean
  monthlyReport: boolean
  bucketCompleted: boolean
  lowBalance: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationSettings>({
    autoDeposit: true,
    weeklyReport: false,
    monthlyReport: true,
    bucketCompleted: true,
    lowBalance: true
  })
  const [initialNotifications, setInitialNotifications] = useState<NotificationSettings>({
    autoDeposit: true,
    weeklyReport: false,
    monthlyReport: true,
    bucketCompleted: true,
    lowBalance: true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Load saved settings
    if (user?.id) {
      const saved = localStorage.getItem(`settings_${user.id}`)
      if (saved) {
        try {
          const parsedSettings = JSON.parse(saved)
          setNotifications(parsedSettings)
          setInitialNotifications(parsedSettings)
        } catch {
          console.warn("Error loading saved settings")
        }
      }
    }
  }, [user])

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(notifications) !== JSON.stringify(initialNotifications)

  const handleToggle = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage("")
    
    try {
      if (user?.id) {
        localStorage.setItem(`settings_${user.id}`, JSON.stringify(notifications))
      }
      
      setMessage("Settings saved successfully!")
      setInitialNotifications(notifications) // Reset initial state after successful save
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setMessage("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-6"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          <Button 
            variant="secondary-icon" 
            icon={<ArrowLeft />} 
            onClick={() => router.back()}
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
            Settings
          </h1>
        </div>

        {/* Notifications Section */}
        <div 
          className="mb-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Notifications
          </h2>
          
          <div className="space-y-6">
            {/* Auto Deposit Notification */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[16px] font-medium text-foreground">Auto deposits</p>
                  <p className="text-[14px] text-foreground/60">Get notified when auto deposits are made</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('autoDeposit')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications.autoDeposit ? 'bg-foreground' : 'bg-foreground/20'
                }`}
              >
                <div 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
                    notifications.autoDeposit ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Bucket Completed */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                  <PartyPopper className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[16px] font-medium text-foreground">Bucket completed</p>
                  <p className="text-[14px] text-foreground/60">Celebrate when you reach your goals</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('bucketCompleted')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications.bucketCompleted ? 'bg-foreground' : 'bg-foreground/20'
                }`}
              >
                <div 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
                    notifications.bucketCompleted ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Low Balance Alert */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[16px] font-medium text-foreground">Low balance alerts</p>
                  <p className="text-[14px] text-foreground/60">Alert when main bucket is below $100</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('lowBalance')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications.lowBalance ? 'bg-foreground' : 'bg-foreground/20'
                }`}
              >
                <div 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
                    notifications.lowBalance ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Email Reports Section */}
        <div 
          className="mb-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Email Reports
          </h2>
          
          <div className="space-y-6">
            {/* Weekly Report */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[16px] font-medium text-foreground">Weekly summary</p>
                  <p className="text-[14px] text-foreground/60">Get a weekly report every Monday</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('weeklyReport')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications.weeklyReport ? 'bg-foreground' : 'bg-foreground/20'
                }`}
              >
                <div 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
                    notifications.weeklyReport ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Monthly Report */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[16px] font-medium text-foreground">Monthly summary</p>
                  <p className="text-[14px] text-foreground/60">Get a monthly report on the 1st</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('monthlyReport')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications.monthlyReport ? 'bg-foreground' : 'bg-foreground/20'
                }`}
              >
                <div 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
                    notifications.monthlyReport ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Save Button - Bottom Right */}
        <div 
          className="hidden sm:flex justify-end mt-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.6s both' }}
        >
          <Button 
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-8"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        
        {/* Add padding at bottom for mobile to account for sticky button */}
        <div className="h-24 sm:hidden"></div>

        {/* Success/Error Message */}
        {message && (
          <div 
            className={`mt-6 p-3 rounded-lg text-center text-sm font-medium ${
              message.includes("success") 
                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
            style={{ animation: 'fadeInUp 0.3s ease-out both' }}
          >
            {message}
          </div>
        )}
      </div>
      
      {/* Sticky Save Button - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-foreground/10 sm:hidden">
        <div className="max-w-[660px] mx-auto">
          <Button 
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}