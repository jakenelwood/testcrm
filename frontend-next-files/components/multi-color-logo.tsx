'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import TextLogo from './text-logo';

interface MultiColorLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function MultiColorLogo({
  className,
  size = 'md',
  color = '#0047AB'
}: MultiColorLogoProps) {
  // Use fixed width and height classes (increased by 20% for larger text)
  const sizeClasses = {
    sm: 'w-[78px] h-[25px]',  // was w-[65px] h-[21px]
    md: 'w-[118px] h-[38px]', // was w-[98px] h-[32px]
    lg: 'w-[156px] h-[52px]'  // was w-[130px] h-[43px]
  };

  const containerClasses = cn(
    "flex items-center justify-center relative",
    className
  );

  return (
    <div className={cn(containerClasses, sizeClasses[size])}>
      <TextLogo size={size} color={color} />
    </div>
  );
}
