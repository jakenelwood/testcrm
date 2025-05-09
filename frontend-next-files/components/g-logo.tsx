'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function GLogo({ className, size = 'md' }: GLogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn(
      "font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600",
      sizeClasses[size],
      className
    )}>
      G
    </div>
  );
}
