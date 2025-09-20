'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

const updateProgressSchema = z.object({
  updateText: z.string().min(1, 'Update text is required'),
  progress: z.number().min(0).max(100, 'Progress must be between 0 and 100'),
})

interface Goal {
  id: string
  title: string
  description: string
  target: string
  category: string
  priority: string
  status: string
  startDate: string
  endDate: string
  progress: number
}

interface GoalProgressDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    progress: number
    updateText: string
  }) => void
  goal: Goal | null
}

export function GoalProgressDialog({ isOpen, onClose, onSubmit, goal }: GoalProgressDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof updateProgressSchema>>({
    resolver: zodResolver(updateProgressSchema),
    defaultValues: {
      updateText: '',
      progress: goal?.progress || 0,
    },
  })

  const handleSubmit = async (data: z.infer<typeof updateProgressSchema>) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Goal Progress</DialogTitle>
          <DialogDescription>
            {goal && (
              <>
                Update progress for: <strong>{goal.title}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress: {field.value}%</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="updateText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you've accomplished and any challenges faced..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Progress'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
