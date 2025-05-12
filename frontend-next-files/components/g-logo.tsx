'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import GTextLogo from './g-text-logo';

interface GLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function GLogo({
  className,
  size = 'md',
  color = '#0047AB'
}: GLogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',   // was w-6 h-6
    md: 'w-10 h-10', // was w-8 h-8
    lg: 'w-12 h-12'  // was w-10 h-10
  };

  return (
    <div className={cn(
      "flex items-center justify-center",
      sizeClasses[size],
      className
    )}>
      <GTextLogo size={size} color={color} />
    </div>
  );
}
