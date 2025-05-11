'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GonzigoBrandProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function GonzigoBrand({
  className,
  size = 'md',
  showTagline = false
}: GonzigoBrandProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn(
        "font-bold lowercase border-2 border-[#FFA500] px-2 py-1 rounded",
        sizeClasses[size]
      )}>
        gonzigo
      </div>
      {showTagline && (
        <div className="text-sm mt-1 text-gray-600">
          The pipeline whisperer
        </div>
      )}
    </div>
  );
}
