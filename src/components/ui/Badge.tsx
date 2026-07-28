import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)} {...props}>
      {children}
    </span>
  );
}
