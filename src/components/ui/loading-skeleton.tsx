import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div 
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
    />
  )
}
