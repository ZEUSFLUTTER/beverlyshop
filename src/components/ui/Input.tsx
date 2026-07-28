import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, id, containerClassName, style, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn("w-full", label ? "form-group" : "", containerClassName)}>
        {label && (
          <label className="form-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {leftIcon && (
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn('form-input', error && 'error', className)}
            style={{
              paddingLeft: leftIcon ? '40px' : undefined,
              paddingRight: rightIcon ? '40px' : undefined,
              ...style,
            }}
            {...props}
          />
          {rightIcon && (
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              zIndex: 10,
            }}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
