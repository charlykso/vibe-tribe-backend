import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  description
}) => {
  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {(title || description) && (
          <div className="mb-6">
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
            )}
            {description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{description}</p>
            )}
          </div>
        )}
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
