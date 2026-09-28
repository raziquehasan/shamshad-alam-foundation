import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow';
  className?: string;
}

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
};

export const StatCard = ({ title, value, icon, trend, color = 'blue', className = '' }: StatCardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </p>
          )}
        </div>
        {icon && <div className={colorClasses[color]}>{icon}</div>}
      </div>
    </div>
  );
};
