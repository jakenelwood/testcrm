'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { brand } from '@/lib/brand';

interface RTextLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  animate?: boolean;
}

export default function RTextLogo({
  className,
  size = 'md',
  color = '#0047AB', // Default to the medium blue color
  animate = true
}: RTextLogoProps) {
  // Detect if we're on an authenticated page (dashboard, etc.)
  const isAuthenticatedPage = typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/dashboard') ||
     window.location.pathname.startsWith('/leads') ||
     window.location.pathname.startsWith('/settings'));

  // Disable animation on authenticated pages
  const shouldAnimate = animate && !isAuthenticatedPage;
  // Size classes for the text (increased by 30% total)
  const sizeClasses = {
    sm: 'text-3xl scale-110', // additional 10% scale
    md: 'text-4xl scale-110', // additional 10% scale
    lg: 'text-5xl scale-110'  // additional 10% scale
  };

  const textClasses = cn(
    "font-bold tracking-tight transition-all duration-300",
    sizeClasses[size],
    shouldAnimate && "hover:scale-105",
    className
  );

  return (
    <span 
      className={textClasses}
      style={{ color }}
    >
      {brand.name}
    </span>
  );
}
