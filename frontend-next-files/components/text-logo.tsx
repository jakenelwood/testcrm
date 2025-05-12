'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TextLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function TextLogo({
  className,
  size = 'md',
  color = '#0047AB' // Default to the medium blue color
}: TextLogoProps) {
  // Size classes for the text (increased by 20%)
  const sizeClasses = {
    sm: 'text-2xl', // was text-xl
    md: 'text-3xl', // was text-2xl
    lg: 'text-4xl'  // was text-3xl
  };

  return (
    <div className={cn("flex items-center", className)}>
      <span
        className={cn(
          "font-inter font-bold tracking-tight", // Changed from font-medium to font-bold
          sizeClasses[size]
        )}
        style={{ color }}
      >
        gonzigo
      </span>
    </div>
  );
}
