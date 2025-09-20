'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ModernCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'glass' | 'interactive'
  animation?: 'fade-in' | 'slide-up' | 'scale-in' | 'bounce-in'
  hover?: 'lift' | 'glow' | 'slide'
  onClick?: () => void
}

export function ModernCard({
  title,
  description,
  children,
  className,
  variant = 'default',
  animation,
  hover,
  onClick
}: ModernCardProps) {
  const baseClasses = 'card-modern'
  
  const variantClasses = {
    default: '',
    gradient: 'card-gradient',
    glass: 'glass',
    interactive: 'card-interactive'
  }
  
  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'scale-in': 'animate-scale-in',
    'bounce-in': 'animate-bounce-in'
  }
  
  const hoverClasses = {
    lift: 'hover-lift',
    glow: 'hover-glow',
    slide: 'hover-slide'
  }

  return (
    <Card
      className={cn(
        baseClasses,
        variantClasses[variant],
        animation && animationClasses[animation],
        hover && hoverClasses[hover],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          )}
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  loading?: boolean
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  loading = false
}: StatCardProps) {
  if (loading) {
    return (
      <ModernCard className={cn('p-6', className)} animation="fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-8 w-16" />
            <LoadingSkeleton className="h-3 w-20" />
          </div>
          <LoadingSkeleton className="h-8 w-8 rounded-full" />
        </div>
      </ModernCard>
    )
  }

  return (
    <ModernCard 
      className={cn('p-6', className)} 
      animation="slide-up"
      hover="lift"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              <span className="mr-1">
                {trend.isPositive ? '↗' : '↘'}
              </span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="h-8 w-8 text-primary">
            {icon}
          </div>
        )}
      </div>
    </ModernCard>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function FeatureCard({
  title,
  description,
  icon,
  onClick,
  className,
  disabled = false
}: FeatureCardProps) {
  return (
    <ModernCard
      variant="interactive"
      animation="scale-in"
      hover="lift"
      onClick={disabled ? undefined : onClick}
      className={cn(
        'p-6 text-center',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </ModernCard>
  )
}

