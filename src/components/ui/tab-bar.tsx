import * as React from "react"
import { cn } from "@/lib/utils"
import { Home, Activity, Bell, Users } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export interface TabBarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const TabBar = React.forwardRef<HTMLDivElement, TabBarProps>(
  ({ className, ...props }, ref) => {
    const router = useRouter()
    const pathname = usePathname()

    const tabs = [
      {
        id: 'home',
        label: 'Home',
        icon: Home,
        path: '/home',
        isActive: pathname === '/home'
      },
      {
        id: 'activity',
        label: 'Activity',
        icon: Activity,
        path: '/activity',
        isActive: pathname === '/activity'
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        path: '/notifications',
        isActive: pathname === '/notifications'
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
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabPress(tab.path)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all duration-200",
                    "hover:bg-foreground/5 active:scale-95 w-20",
                    tab.isActive ? "text-foreground" : "text-foreground/40"
                  )}
                >
                  <IconComponent 
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      tab.isActive ? "text-foreground" : "text-foreground/40"
                    )} 
                  />
                  <span 
                    className={cn(
                      "text-[10px] font-medium transition-all duration-200",
                      tab.isActive ? "text-foreground" : "text-foreground/40"
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