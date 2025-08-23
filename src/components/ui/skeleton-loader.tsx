import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn("animate-pulse rounded-md bg-foreground/10", className)}
    />
  )
}

export function BucketCardSkeleton() {
  return (
    <div className="p-8 rounded-[32px] mb-4 bg-foreground/5 border border-foreground/10">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Title skeleton */}
          <div className="mb-3">
            <Skeleton className="h-6 w-48 mb-2" />
          </div>
          
          {/* Progress bar skeleton */}
          <div className="mb-2">
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          
          {/* Amount text skeleton */}
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        
        {/* Auto deposit icon skeleton */}
        <div className="ml-4">
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
    </div>
  )
}

export function MainBucketSkeleton() {
  return (
    <div className="p-8 rounded-[32px] mb-4 bg-foreground/5 border border-foreground/10">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Title skeleton */}
          <div className="mb-3">
            <Skeleton className="h-7 w-40" />
          </div>
          
          {/* Amount skeleton */}
          <div>
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        
        {/* Button skeleton */}
        <div className="ml-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-15">
      {/* Buttons skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      
      {/* Avatar skeleton */}
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  )
}

export function BalanceSkeleton() {
  return (
    <div className="flex items-center justify-between mb-10">
      <div>
        {/* Label skeleton */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        
        {/* Large amount skeleton */}
        <Skeleton className="h-12 w-56 mb-2" />
        
        {/* APY info skeleton */}
        <Skeleton className="h-5 w-40" />
      </div>
    </div>
  )
}

export function ActivitySkeleton() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-black/10 last:border-b-0">
      <div className="flex-1">
        {/* Activity title skeleton */}
        <Skeleton className="h-5 w-32 mb-1" />
        {/* Activity date skeleton */}
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Amount skeleton */}
      <Skeleton className="h-5 w-16" />
    </div>
  )
}

export function ActivityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, index) => (
        <ActivitySkeleton key={index} />
      ))}
    </div>
  )
}