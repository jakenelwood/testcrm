'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface GLogoButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function GLogoButton({
  className,
  size = 'md'
}: GLogoButtonProps) {
  // Use fixed width and height classes (reduced by additional 15%)
  const sizeClasses = {
    sm: 'w-[65px] h-[21px]',
    md: 'w-[98px] h-[32px]',
    lg: 'w-[130px] h-[43px]'
  };

  const dimensions = {
    sm: { width: 65, height: 21 },
    md: { width: 98, height: 32 },
    lg: { width: 130, height: 43 }
  };

  const containerClasses = cn(
    "flex items-center justify-center",
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
