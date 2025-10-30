// ============================================================================
// LoadingSpinner - Reusable loading indicator
// ============================================================================

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  color = 'child-primary',
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const colorMap: { [key: string]: string } = {
    'child-primary': '#FF6B9D',
    'parent-primary': '#4F46E5',
    'blue': '#3B82F6',
    'green': '#10B981',
    'purple': '#8B5CF6',
  };

  const borderColor = colorMap[color] || colorMap['child-primary'];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeClasses[size]} border-4 border-t-transparent rounded-full animate-spin`}
        style={{ borderColor: `${borderColor} transparent transparent transparent` }}
      />
      {message && (
        <p className="text-sm text-gray-600 font-child animate-pulse">{message}</p>
      )}
    </div>
  );
};
