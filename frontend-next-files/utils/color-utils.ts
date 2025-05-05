/**
 * COLOR UTILITY FUNCTIONS
 * 
 * This file provides utility functions for working with colors,
 * including contrast calculations to determine optimal text color
 * for a given background.
 */

/**
 * Convert a hex color to RGB components
 * @param hex Hex color code (with or without #)
 * @returns RGB components as an array [r, g, b]
 */
export function hexToRgb(hex: string): [number, number, number] {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  if (hex.length === 3) {
    // Convert shorthand (e.g. #ABC) to full form (e.g. #AABBCC)
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Parse the hex values to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
}

/**
 * Calculate the relative luminance of a color
 * Based on WCAG 2.0 formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
 * 
 * @param rgb RGB components as an array [r, g, b]
 * @returns Relative luminance value between 0 and 1
 */
export function calculateLuminance(rgb: [number, number, number]): number {
  // Convert RGB to sRGB
  const [r, g, b] = rgb.map(val => {
    const srgb = val / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  
  // Calculate luminance using the formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.0 formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
 * 
 * @param color1 First color in hex format
 * @param color2 Second color in hex format
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = calculateLuminance(hexToRgb(color1));
  const lum2 = calculateLuminance(hexToRgb(color2));
  
  // Calculate contrast ratio
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get the appropriate text color (black or white) for a given background color
 * Based on WCAG guidelines for readability
 * 
 * @param backgroundColor Background color in hex format
 * @returns 'text-black' or 'text-white' Tailwind class
 */
export function getContrastingTextColor(backgroundColor: string): string {
  // Standard colors for text
  const blackContrast = calculateContrastRatio(backgroundColor, '#000000');
  const whiteContrast = calculateContrastRatio(backgroundColor, '#FFFFFF');
  
  // Return the color with better contrast
  return whiteContrast > blackContrast ? 'text-white' : 'text-black';
}

/**
 * Map Tailwind color classes to their hex values
 * This is a simplified mapping for common colors used in the application
 */
export const tailwindColorMap: Record<string, string> = {
  // Blues
  'bg-blue-50': '#eff6ff',
  'bg-blue-100': '#dbeafe',
  'bg-blue-200': '#bfdbfe',
  
  // Yellows
  'bg-yellow-50': '#fefce8',
  'bg-yellow-100': '#fef9c3',
  'bg-yellow-200': '#fef08a',
  
  // Purples
  'bg-purple-50': '#faf5ff',
  'bg-purple-100': '#f3e8ff',
  'bg-purple-200': '#e9d5ff',
  
  // Greens
  'bg-green-50': '#f0fdf4',
  'bg-green-100': '#dcfce7',
  'bg-green-200': '#bbf7d0',
  
  // Reds
  'bg-red-50': '#fef2f2',
  'bg-red-100': '#fee2e2',
  'bg-red-200': '#fecaca',
  
  // Grays
  'bg-gray-50': '#f9fafb',
  'bg-gray-100': '#f3f4f6',
  'bg-gray-200': '#e5e7eb',
  
  // Dark mode colors
  'dark:bg-blue-900/30': '#1e3a8a4d',
  'dark:bg-yellow-900/30': '#7134064d',
  'dark:bg-purple-900/30': '#5814a04d',
  'dark:bg-green-900/30': '#14532d4d',
  'dark:bg-red-900/30': '#7f1d1d4d',
  'dark:bg-gray-800': '#1f2937',
};

/**
 * Get the appropriate text color for a Tailwind background class
 * 
 * @param bgClass Tailwind background class (e.g., 'bg-blue-100')
 * @returns 'text-black' or 'text-white' Tailwind class
 */
export function getTextColorForBgClass(bgClass: string): string {
  const hexColor = tailwindColorMap[bgClass];
  if (!hexColor) {
    // Default to black text if we don't have the color mapped
    return 'text-black';
  }
  
  return getContrastingTextColor(hexColor);
}
