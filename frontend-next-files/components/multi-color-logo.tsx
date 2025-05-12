'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MultiColorLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MultiColorLogo({
  className,
  size = 'md'
}: MultiColorLogoProps) {
  // Fixed dimensions for the logo (reduced by additional 15%)
  const dimensions = {
    sm: { width: 65, height: 21 },
    md: { width: 98, height: 32 },
    lg: { width: 130, height: 43 }
  };

  // Use fixed width and height classes (reduced by additional 15%)
  const sizeClasses = {
    sm: 'w-[65px] h-[21px]',
    md: 'w-[98px] h-[32px]',
    lg: 'w-[130px] h-[43px]'
  };

  const containerClasses = cn(
    "flex items-center justify-center relative",
    className
  );

  const currentDimensions = dimensions[size];

  return (
    <div className={cn(containerClasses, sizeClasses[size])}>
      <Image
        src="/images/helvetica_logo.svg"
        alt="GONZIGO"
        width={currentDimensions.width}
        height={currentDimensions.height}
        className="max-w-full max-h-full"
        priority
      />
    </div>
  );
}
