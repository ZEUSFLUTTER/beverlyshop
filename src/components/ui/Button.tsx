import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      className={cn('btn', `btn-${variant}`, sizeClass, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />}
      {!isLoading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
    </button>
  );
}
