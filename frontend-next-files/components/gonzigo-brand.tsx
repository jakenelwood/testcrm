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
        "font-bold text-[#0047AB]",
        sizeClasses[size]
      )}>
        Gonzigo
      </div>
      {/* Tagline removed as requested */}
    </div>
  );
}
