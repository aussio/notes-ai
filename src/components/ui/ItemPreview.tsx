'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ItemPreviewProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ItemPreview: React.FC<ItemPreviewProps> = ({
  icon: Icon,
  title,
  subtitle,
  className = '',
  children,
}) => {
  return (
    <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </p>
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
      {children}
    </div>
  );
};
