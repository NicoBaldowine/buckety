"use client"

import { useState, useEffect } from "react"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TabBar } from "@/components/ui/tab-bar"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, DollarSign, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { notificationService } from "@/lib/supabase"
import type { Notification } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  )
}

function NotificationsContent() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState(false)
  
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 
                     "U"

  useEffect(() => {
    if (!user?.id) return
    loadNotifications()
    
    // Subscribe to real-time notifications
    const subscription = notificationService.subscribeToNotifications(
      user.id,
      (newNotification: Notification) => {
        setNotifications(prev => [newNotification, ...prev])
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const data = await notificationService.getNotifications(user.id)
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead([notificationId])
    if (success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAsRead(true)
    const success = await notificationService.markAllAsRead(user?.id)
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
    }
    setMarkingAsRead(false)
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'auto_deposit':
        return <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
      case 'goal_reached':
        return <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
      default:
        return <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
    }
  }

  const formatNotificationTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  
  return (
    <div className="min-h-screen bg-background transition-all duration-500 ease-out">
      <div className="max-w-[660px] mx-auto px-12 py-6 max-sm:px-4 max-sm:py-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-4"
          style={{ animation: 'slideInFromTop 0.4s ease-out 0.1s both' }}
        >
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              onClick={handleMarkAllAsRead}
              disabled={markingAsRead}
              className="text-sm"
            >
              {markingAsRead ? 'Marking...' : 'Mark all read'}
            </Button>
          )}
          {unreadCount === 0 && <div></div>}
          <AvatarDropdown initial={userInitial} />
        </div>

        {/* Title */}
        <div 
          className="mb-8"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <h1 
            className="text-[32px] font-extrabold text-foreground"
            style={{ letterSpacing: '-0.05em' }}
          >
            Notifications
          </h1>
        </div>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div 
            className="mb-6 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.25s both' }}
          >
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div 
            className="flex items-center justify-center py-12"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div 
            className="text-center py-20"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-foreground/30" />
            </div>
            <p className="text-foreground/60 text-lg font-medium mb-2">
              No notifications yet
            </p>
            <p className="text-foreground/40 text-sm">
              You'll see auto deposit notifications here
            </p>
          </div>
        ) : (
          <div 
            className="space-y-2"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
          >
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`
                  flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer
                  ${!notification.is_read 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                    : 'bg-foreground/5 hover:bg-foreground/10'
                  }
                `}
                style={{ animation: `fadeInUp 0.5s ease-out ${0.3 + index * 0.05}s both` }}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                {/* Icon */}
                {getNotificationIcon(notification.type)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`text-sm font-semibold ${!notification.is_read ? 'text-foreground' : 'text-foreground/80'}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm ${!notification.is_read ? 'text-foreground/80' : 'text-foreground/60'} mb-2`}>
                    {notification.message}
                  </p>
                  
                  {/* Bucket indicator if present */}
                  {notification.metadata?.bucket_name && (
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: notification.metadata.bucket_color || '#4ECDC4' }}
                      />
                      <span className="text-xs text-foreground/60 font-medium">
                        {notification.metadata.bucket_name}
                      </span>
                    </div>
                  )}
                  
                  <p className={`text-xs ${!notification.is_read ? 'text-foreground/60' : 'text-foreground/40'}`}>
                    {formatNotificationTime(notification.created_at)}
                  </p>
                </div>

                {/* Amount if present */}
                {notification.amount && (
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${!notification.is_read ? 'text-green-600 dark:text-green-400' : 'text-foreground/60'}`}>
                      +${notification.amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add bottom padding to account for tab bar */}
        <div className="h-20"></div>
      </div>

      {/* Tab Bar Navigation */}
      <TabBar />
    </div>
  )
}