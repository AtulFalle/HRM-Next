'use client'

import { Button } from './button'
import { cn } from '@/lib/utils'
import { ReactNode, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ModernButtonProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'gradient' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  className?: string
  onClick?: () => void
  disabled?: boolean
  animation?: 'none' | 'scale' | 'bounce'
}

export const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({
    children,
    variant = 'default',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    className,
    onClick,
    disabled = false,
    animation = 'scale',
    ...props
  }, ref) => {
    const baseClasses = 'btn-modern'
    
    const variantClasses = {
      default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      primary: 'btn-primary-modern',
      gradient: 'btn-gradient',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    }
    
    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8 text-lg'
    }
    
    const animationClasses = {
      none: '',
      scale: 'hover:scale-105 active:scale-95',
      bounce: 'hover:animate-bounce'
    }

    return (
      <Button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          animationClasses[animation],
          loading && 'cursor-not-allowed',
          className
        )}
        onClick={onClick}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          icon && iconPosition === 'left' && (
            <span className="mr-2">{icon}</span>
          )
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </Button>
    )
  }
)

ModernButton.displayName = 'ModernButton'

interface ActionButtonProps {
  label: string
  icon: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function ActionButton({
  label,
  icon,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className
}: ActionButtonProps) {
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
    success: 'bg-success hover:bg-success/90 text-success-foreground',
    warning: 'bg-warning hover:bg-warning/90 text-warning-foreground',
    danger: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
  }

  return (
    <ModernButton
      variant="default"
      size={size}
      loading={loading}
      disabled={disabled}
      icon={icon}
      onClick={onClick}
      className={cn(variantClasses[variant], className)}
    >
      {label}
    </ModernButton>
  )
}

interface FloatingActionButtonProps {
  icon: ReactNode
  onClick: () => void
  label?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  position = 'bottom-right',
  className
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  }

  return (
    <button
      className={cn(
        'btn-gradient h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110',
        positionClasses[position],
        className
      )}
      onClick={onClick}
      title={label}
    >
      {icon}
    </button>
  )
}

