/**
 * Utility functions for date formatting
 */

/**
 * Format a date string to MM/DD/YYYY format
 * @param dateString - The date string to format
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatDateMMDDYYYY(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  // Format as MM/DD/YYYY
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}

/**
 * Format a date string to MM/DD/YYYY HH:MM AM/PM format
 * @param dateString - The date string to format
 * @returns Formatted date string with time
 */
export function formatDateTimeMMDDYYYY(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  // Format as MM/DD/YYYY HH:MM AM/PM
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  
  // Time formatting
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert hours to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}
