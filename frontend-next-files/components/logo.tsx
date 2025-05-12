'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-4 w-auto', /* reduced by additional 15% */
    md: 'h-6 w-auto', /* reduced by additional 15% */
    lg: 'h-7 w-auto' /* reduced by additional 15% */
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/images/helvetica_logo.svg"
        alt="GONZIGO"
        width={102}
        height={34}
        className={cn(sizeClasses[size])}
        priority
      />
    </div>
  );
}
