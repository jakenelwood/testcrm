'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import TextLogo from './text-logo';

interface GonzigoBrandProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  color?: string;
}

export default function GonzigoBrand({
  className,
  size = 'md',
  showTagline = false,
  color = '#0047AB'
}: GonzigoBrandProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="px-2 py-1">
        <TextLogo size={size} color={color} />
      </div>
      {showTagline && (
        <div className="text-sm mt-1 text-gray-600">
          The pipeline whisperer
        </div>
      )}
    </div>
  );
}
