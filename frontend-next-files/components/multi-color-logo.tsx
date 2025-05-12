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
    "flex items-center justify-center relative",
    className
  );

  const currentDimensions = dimensions[size];

  // Calculate G width as approximately 22% of the total width to allow for spacing
  const gWidth = Math.round(currentDimensions.width * 0.22);
  const onzigoWidth = Math.round(currentDimensions.width * 0.73); // Reduced slightly to account for spacing

  return (
    <div className={cn(containerClasses, sizeClasses[size])}>
      <div className="flex items-center justify-start w-full h-full">
        {/* G in purple */}
        <div className="relative" style={{ width: `${gWidth}px`, height: '100%' }}>
          <Image
            src="/images/G_purple.svg"
            alt="G"
            width={gWidth}
            height={currentDimensions.height}
            className="max-w-full max-h-full"
            style={{
              width: 'auto',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            priority
          />
        </div>

        {/* onzigo in dark gray */}
        <div className="relative" style={{ width: `${onzigoWidth}px`, height: '100%' }}>
          <Image
            src="/images/onzigo_dark.svg"
            alt="onzigo"
            width={onzigoWidth}
            height={currentDimensions.height}
            className="max-w-full max-h-full"
            style={{
              width: 'auto',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              marginLeft: '2px' // Reduced spacing between G and onzigo
            }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
