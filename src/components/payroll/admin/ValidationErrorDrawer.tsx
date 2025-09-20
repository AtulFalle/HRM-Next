'use client'

import { Button } from '@/components/ui/button'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { XCircle, AlertCircle } from 'lucide-react'

interface PayrollValidationError {
  id: string
  type: 'ERROR' | 'WARNING'
  message: string
  employeeId?: string
  field?: string
  details?: string
}

interface ValidationErrorDrawerProps {
  isOpen: boolean
  onClose: () => void
  errors: PayrollValidationError[]
  selectedError: PayrollValidationError | null
  onSelectError: (error: PayrollValidationError) => void
}

export function ValidationErrorDrawer({ 
  isOpen, 
  onClose, 
  errors, 
  selectedError, 
  onSelectError 
}: ValidationErrorDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-96">
        <SheetHeader>
          <SheetTitle>Validation Errors & Warnings</SheetTitle>
          <SheetDescription>
            Review and resolve validation issues.
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {errors.map((error) => (
            <div 
              key={error.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedError?.id === error.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectError(error)}
            >
              <div className="flex items-start space-x-3">
                {error.type === 'ERROR' ? (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{error.message}</p>
                  {error.employeeId && (
                    <p className="text-xs text-gray-500 mt-1">Employee: {error.employeeId}</p>
                  )}
                  {error.field && (
                    <p className="text-xs text-gray-500">Field: {error.field}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedError && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Error Details</h3>
            <p className="text-sm text-gray-600 mb-2">{selectedError.message}</p>
            {selectedError.details && (
              <p className="text-sm text-gray-500">{selectedError.details}</p>
            )}
            <div className="mt-4 flex space-x-2">
              <Button size="sm" variant="outline">
                Resolve
              </Button>
              <Button size="sm" variant="outline">
                Ignore
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

