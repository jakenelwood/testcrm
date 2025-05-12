'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import TextLogo from './text-logo';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function Logo({
  className,
  size = 'md',
  color = '#0047AB'
}: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <TextLogo size={size} color={color} />
    </div>
  );
}
