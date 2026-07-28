import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, containerClassName, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn("w-full", label ? "form-group" : "", containerClassName)}>
        {label && (
          <label className="form-label" htmlFor={selectId}>
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn('form-select', error && 'error', className)}
          {...props}
        >
          <option value="" disabled hidden>
            Sélectionner...
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
