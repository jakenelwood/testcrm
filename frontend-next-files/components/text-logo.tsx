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
          "font-inter font-bold tracking-tight relative",
          sizeClasses[size]
        )}
        style={{ color }}
      >
        gonz<span className="relative inline-block">i
          <span
            className={cn(
              "absolute -top-1 left-[0.35em] w-[0.25em] h-[0.25em] rounded-full animate-pulse-colors"
            )}
          ></span>
        </span>go
      </span>
    </div>
  );
}
