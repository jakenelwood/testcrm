'use client';

import { useEffect } from 'react';

export function ApplyStoneTheme() {
  useEffect(() => {
    // Apply the Stone theme directly
    console.log('Directly applying Stone theme');
    document.documentElement.setAttribute('data-theme', 'stone');
    
    // Store in localStorage
    localStorage.setItem('theme', 'stone');
  }, []);
  
  return null; // This component doesn't render anything
}
