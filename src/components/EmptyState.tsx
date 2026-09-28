import { FileText } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ title, message, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title || message}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
};
