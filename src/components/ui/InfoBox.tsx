'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

type InfoBoxVariant = 'info' | 'warning' | 'success' | 'error';

interface InfoBoxProps {
  variant: InfoBoxVariant;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<
  InfoBoxVariant,
  {
    container: string;
    icon: string;
    text: string;
  }
> = {
  info: {
    container:
      'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-800 dark:text-blue-200',
  },
  success: {
    container:
      'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-800 dark:text-green-200',
  },
  warning: {
    container:
      'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  error: {
    container:
      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-800 dark:text-red-200',
  },
};

export const InfoBox: React.FC<InfoBoxProps> = ({
  variant,
  icon: Icon,
  children,
  className = '',
}) => {
  const styles = variantStyles[variant];

  return (
    <div className={`${styles.container} rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        {Icon && (
          <Icon className={`w-4 h-4 ${styles.icon} mt-0.5 flex-shrink-0`} />
        )}
        <div className={`text-sm ${styles.text}`}>{children}</div>
      </div>
    </div>
  );
};
