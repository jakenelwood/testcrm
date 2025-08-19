import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



/**
 * Format a date to a human-readable string
 * 
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  }
): string {
  return new Date(date).toLocaleDateString(undefined, options);
}

/**
 * Format a date to YYYY-MM-DD
 * 
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDateYMD(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toISOString().split('T')[0] || '';
}

/**
 * Format a currency value
 * 
 * @param value - The value to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = { style: "currency", currency: "USD" }
): string {
  return new Intl.NumberFormat(undefined, options).format(value);
}

/**
 * Truncate a string to a maximum length
 * 
 * @param str - The string to truncate
 * @param length - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, length: number): string {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}
