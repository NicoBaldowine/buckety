import * as React from "react"
import { cn } from "@/lib/utils"
import { Home, Tag, Bell, Users } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { notificationService } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export interface TabBarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const TabBar = React.forwardRef<HTMLDivElement, TabBarProps>(
  ({ className, ...props }, ref) => {
    const router = useRouter()
    const pathname = usePathname()
    const { user } = useAuth()
    const [unreadCount, setUnreadCount] = React.useState(0)

    // Load unread count
    React.useEffect(() => {
      if (!user?.id) return

      const loadUnreadCount = async () => {
        const count = await notificationService.getUnreadCount(user.id)
        setUnreadCount(count)
      }

      loadUnreadCount()

      // Subscribe to new notifications for real-time updates
      const subscription = notificationService.subscribeToNotifications(
        user.id,
        () => {
          // When a new notification arrives, refresh the count
          loadUnreadCount()
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }, [user])

    // Reset count when user visits notifications page
    React.useEffect(() => {
      if (pathname === '/notifications' && unreadCount > 0) {
        // Small delay to allow notifications page to mark as read
        const timer = setTimeout(() => {
          setUnreadCount(0)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }, [pathname, unreadCount])

    const tabs = [
      {
        id: 'home',
        label: 'Home',
        icon: Home,
        path: '/home',
        isActive: pathname === '/home'
      },
      {
        id: 'discounts',
        label: 'Discounts',
        icon: Tag,
        path: '/discounts',
        isActive: pathname === '/discounts'
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        path: '/notifications',
        isActive: pathname === '/notifications',
        hasNotification: unreadCount > 0
      },
      {
        id: 'refer',
        label: 'Refer',
        icon: Users,
        path: '/refer',
        isActive: pathname === '/refer'
      }
    ]

    const handleTabPress = (path: string) => {
      router.push(path)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background border-t border-foreground/10 z-50",
          className
        )}
        {...props}
      >
        <div className="max-w-[660px] mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              const hasNotification = 'hasNotification' in tab ? tab.hasNotification : false
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabPress(tab.path)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all duration-200 relative",
                    "hover:bg-foreground/5 active:scale-95 w-20",
                    tab.isActive ? "text-foreground" : "text-foreground/40"
                  )}
                >
                  <div className="relative">
                    <IconComponent 
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        tab.isActive ? "text-foreground" : "text-gray-400 dark:text-stone-500"
                      )} 
                    />
                    {hasNotification && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span 
                    className={cn(
                      "text-[10px] font-medium transition-all duration-200",
                      tab.isActive ? "text-foreground" : "text-gray-400 dark:text-stone-500"
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
)
TabBar.displayName = "TabBar"

export { TabBar }