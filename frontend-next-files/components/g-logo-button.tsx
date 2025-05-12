'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import MultiColorLogo from './multi-color-logo';

interface GLogoButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function GLogoButton({
  className,
  size = 'md'
}: GLogoButtonProps) {
  // Use fixed width and height classes
  const sizeClasses = {
    sm: 'w-[90px] h-[30px]',
    md: 'w-[135px] h-[45px]',
    lg: 'w-[180px] h-[60px]'
  };

  const containerClasses = cn(
    "flex items-center justify-center",
    className
  );

  return (
    <div className={cn(containerClasses, sizeClasses[size])}>
      <MultiColorLogo size={size} />
    </div>
  );
}
