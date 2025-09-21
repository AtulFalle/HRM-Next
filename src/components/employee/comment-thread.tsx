'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Send, User, Shield, Crown, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface RequestComment {
  id: string
  comment: string
  createdAt: string
  author: {
    id: string
    name: string
    email: string
    role: string
    employee?: {
      firstName: string
      lastName: string
      employeeId: string
    }
  }
}

interface CommentThreadProps {
  requestId: string
  currentUserId?: string
  currentUserRole?: string
  onCommentAdded?: () => void
}

export function CommentThread({ 
  requestId, 
  currentUserId, 
  currentUserRole,
  onCommentAdded 
}: CommentThreadProps) {
  const [comments, setComments] = useState<RequestComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/employee-requests/${requestId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      } else {
        toast.error('Failed to load comments')
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }, [requestId])

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsAddingComment(true)
    try {
      const response = await fetch(`/api/employee-requests/${requestId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: newComment.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        toast.success('Comment added successfully')
        onCommentAdded?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsAddingComment(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-3 w-3 text-purple-600" />
      case 'MANAGER':
        return <Shield className="h-3 w-3 text-blue-600" />
      default:
        return <User className="h-3 w-3 text-gray-600" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'MANAGER':
        return 'default'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-16 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
          <p className="text-sm text-muted-foreground">
            Discuss the request with your team
          </p>
        </div>
        
        <ScrollArea className="h-80">
          <div className="p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No comments yet. Start the conversation!
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 group">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.author.employee?.firstName} {comment.author.employee?.lastName}
                      </span>
                      <Badge 
                        variant={getRoleBadgeVariant(comment.author.role)}
                        className="text-xs px-1.5 py-0.5"
                      >
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(comment.author.role)}
                          <span>{comment.author.role}</span>
                        </div>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3 group-hover:bg-muted/70 transition-colors">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/20">
          <div className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleAddComment()
                }
              }}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to send
              </p>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isAddingComment}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isAddingComment ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
