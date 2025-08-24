import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('rounded-lg border border-gray-200 bg-white shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx('p-4', className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

export { Card, CardContent };
