'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface GLogoButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function GLogoButton({
  className,
  size = 'md'
}: GLogoButtonProps) {
  // Fixed dimensions for the logo
  const dimensions = {
    sm: { width: 90, height: 30 },
    md: { width: 135, height: 45 },
    lg: { width: 180, height: 60 }
  };

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

  const currentDimensions = dimensions[size];

  return (
    <div className={cn(containerClasses, sizeClasses[size])}>
      <Image
        src="/images/gonzigo-blue.svg"
        alt="Gonzigo Logo"
        width={currentDimensions.width}
        height={currentDimensions.height}
        className="max-w-full max-h-full"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        priority
      />
    </div>
  );
}
