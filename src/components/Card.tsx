import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }: CardProps) => {
  return <div className={`p-6 border-b border-gray-200 ${className}`}>{children}</div>;
};

export const CardContent = ({ children, className = '' }: CardProps) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }: CardProps) => {
  return <div className={`p-6 border-t border-gray-200 ${className}`}>{children}</div>;
};
