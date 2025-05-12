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
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto'
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Image 
        src="/images/new_logo.svg" 
        alt="Gonzigo Logo" 
        width={120} 
        height={40} 
        className={cn(sizeClasses[size])}
        style={{ color: '#3366ff' }} // Apply the requested color
      />
    </div>
  );
}
