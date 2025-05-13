'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TextLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  animate?: boolean;
}

export default function TextLogo({
  className,
  size = 'md',
  color = '#0047AB', // Default to the medium blue color
  animate = true
}: TextLogoProps) {
  // Size classes for the text (increased by 30% total)
  const sizeClasses = {
    sm: 'text-2xl scale-110', // additional 10% scale
    md: 'text-3xl scale-110', // additional 10% scale
    lg: 'text-4xl scale-110'  // additional 10% scale
  };

  return (
    <div className={cn("flex items-center", className)}>
      <span
        className={cn(
          "font-inter font-bold tracking-tight",
          sizeClasses[size],
          animate && "animate-text-pulse"
        )}
        style={!animate ? { color } : undefined}
      >
        gonzigo
      </span>
    </div>
  );
}
