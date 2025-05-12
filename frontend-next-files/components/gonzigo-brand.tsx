'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface GonzigoBrandProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function GonzigoBrand({
  className,
  size = 'md',
  showTagline = false
}: GonzigoBrandProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn(
        "font-bold uppercase text-black px-2 py-1",
        sizeClasses[size]
      )}>
        <Image
          src="/images/helvetica_logo.svg"
          alt="GONZIGO"
          width={size === 'sm' ? 80 : size === 'md' ? 120 : 160}
          height={size === 'sm' ? 26 : size === 'md' ? 39 : 52}
          className="max-w-full max-h-full"
          priority
        />
      </div>
      {showTagline && (
        <div className="text-sm mt-1 text-gray-600">
          The pipeline whisperer
        </div>
      )}
    </div>
  );
}
