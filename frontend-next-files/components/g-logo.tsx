'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface GLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function GLogo({ className, size = 'md' }: GLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className={cn(
      "flex items-center justify-center",
      sizeClasses[size],
      className
    )}>
      <Image
        src="/images/g_compressed.svg"
        alt="G"
        width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
        height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
        className="max-w-full max-h-full"
        priority
      />
    </div>
  );
}
