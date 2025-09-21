'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const requestFormSchema = z.object({
  category: z.enum(['QUERY', 'IT_SUPPORT', 'PAYROLL', 'GENERAL']),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(1, 'Description is required'),
})

type RequestFormData = z.infer<typeof requestFormSchema>

interface RequestFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RequestFormData) => void
  request?: {
    id: string
    category: 'QUERY' | 'IT_SUPPORT' | 'PAYROLL' | 'GENERAL'
    title: string
    description: string
    status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_INFO' | 'RESOLVED' | 'CLOSED'
  }
}

const categoryLabels = {
  QUERY: 'General Query',
  IT_SUPPORT: 'IT Support',
  PAYROLL: 'Payroll',
  GENERAL: 'General Service',
}

export function RequestFormDialog({
  open,
  onOpenChange,
  onSubmit,
  request,
}: RequestFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      category: request?.category || undefined,
      title: request?.title || '',
      description: request?.description || '',
    },
  })

  const handleSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open)
      if (!open) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {request ? 'Edit Request' : 'Create New Request'}
          </DialogTitle>
          <DialogDescription>
            {request
              ? 'Update your request details below.'
              : 'Submit a new support request or query.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter request title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your request in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {request ? 'Update Request' : 'Create Request'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
