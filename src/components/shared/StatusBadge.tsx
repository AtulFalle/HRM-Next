'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

export function StatusBadge({ 
  status, 
  variant, 
  className 
}: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { variant: StatusBadgeProps['variant']; className: string }> = {
      // Onboarding statuses
      'CREATED': { variant: 'secondary', className: 'bg-blue-100 text-blue-800' },
      'IN_PROGRESS': { variant: 'default', className: 'bg-yellow-100 text-yellow-800' },
      'COMPLETED': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'CANCELLED': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      
      // Step statuses
      'PENDING': { variant: 'outline', className: 'bg-gray-100 text-gray-800' },
      'SUBMITTED': { variant: 'default', className: 'bg-yellow-100 text-yellow-800' },
      'APPROVED': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'REJECTED': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      
      // Payroll statuses
      'DRAFT': { variant: 'outline', className: 'bg-gray-100 text-gray-800' },
      'IN_PROGRESS': { variant: 'secondary', className: 'bg-blue-100 text-blue-800' },
      'PENDING_APPROVAL': { variant: 'outline', className: 'bg-yellow-100 text-yellow-800' },
      'FINALIZED': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'LOCKED': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      'PROCESSED': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'PAID': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'GENERATED': { variant: 'secondary', className: 'bg-blue-100 text-blue-800' },
      'DOWNLOADED': { variant: 'default', className: 'bg-green-100 text-green-800' },
      
      // Request statuses
      'UNDER_REVIEW': { variant: 'outline', className: 'bg-yellow-100 text-yellow-800' },
      'RESOLVED': { variant: 'default', className: 'bg-green-100 text-green-800' },
    }

    return statusMap[status] || { variant: 'outline', className: 'bg-gray-100 text-gray-800' }
  }

  const config = getStatusConfig(status)
  const displayStatus = status.replace(/_/g, ' ')

  return (
    <Badge 
      variant={variant || config.variant}
      className={cn(config.className, className)}
    >
      {displayStatus}
    </Badge>
  )
}

