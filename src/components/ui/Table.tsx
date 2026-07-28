import React from 'react';
import { cn } from '@/lib/utils';

interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TableContainer({ children, className, ...props }: TableContainerProps) {
  let header: React.ReactNode = null;
  const nonTableChildren: React.ReactNode[] = [];
  const tableChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === TableHeader) {
      header = child;
    } else if (React.isValidElement(child) && ['thead', 'tbody', 'tfoot', 'tr'].includes(child.type as string)) {
      tableChildren.push(child);
    } else {
      nonTableChildren.push(child);
    }
  });

  return (
    <div className={cn('table-container', className)} {...props}>
      {header}
      <div className="table-wrapper">
        {nonTableChildren.length > 0 ? (
          nonTableChildren
        ) : (
          <table>{tableChildren}</table>
        )}
      </div>
    </div>
  );
}

interface TableHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function TableHeader({ title, actions }: TableHeaderProps) {
  return (
    <div className="table-header">
      <h3 className="table-title">{title}</h3>
      {actions && <div className="table-actions">{actions}</div>}
    </div>
  );
}
