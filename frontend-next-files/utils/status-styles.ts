/**
 * STATUS STYLES UTILITY
 *
 * This file centralizes all status-related styling to follow DRY principles.
 * It provides consistent styling for status indicators across the application:
 * - Kanban board column headers
 * - Status badges in list views
 * - Status indicators in modals and detail pages
 */

import { LeadStatus } from "@/types/lead";

/**
 * Get the appropriate color classes for a status badge
 * @param status The lead status
 * @param variant 'default' for regular badges, 'kanban' for kanban headers
 * @returns Tailwind CSS classes for the status
 */
export function getStatusStyles(status: string, variant: 'default' | 'kanban' = 'default') {
  // Both variants use the same color scheme, but kanban headers have a different style
  const isKanban = variant === 'kanban';

  // Convert status to lowercase for case-insensitive comparison
  const statusLower = status.toLowerCase();

  if (statusLower === 'new' || statusLower === 'pending') {
    return isKanban
      ? 'bg-blue-100 text-black font-medium dark:bg-blue-900/30 dark:text-black'
      : 'bg-blue-50 text-black font-medium dark:bg-blue-900/20 dark:text-black';
  }

  if (statusLower === 'contacted' || statusLower === 'in progress') {
    return isKanban
      ? 'bg-yellow-100 text-black font-medium dark:bg-yellow-900/30 dark:text-black'
      : 'bg-yellow-50 text-black font-medium dark:bg-yellow-900/20 dark:text-black';
  }

  if (statusLower === 'quoted') {
    return isKanban
      ? 'bg-purple-100 text-black font-medium dark:bg-purple-900/30 dark:text-black'
      : 'bg-purple-50 text-black font-medium dark:bg-purple-900/20 dark:text-black';
  }

  if (statusLower === 'sold' || statusLower === 'completed') {
    return isKanban
      ? 'bg-green-100 text-black font-medium dark:bg-green-900/30 dark:text-black'
      : 'bg-green-50 text-black font-medium dark:bg-green-900/20 dark:text-black';
  }

  if (statusLower === 'lost') {
    return isKanban
      ? 'bg-red-100 text-black font-medium dark:bg-red-900/30 dark:text-black'
      : 'bg-red-50 text-black font-medium dark:bg-red-900/20 dark:text-black';
  }

  // Default case
  return isKanban
    ? 'bg-gray-100 text-black font-medium dark:bg-gray-800 dark:text-black'
    : 'bg-gray-50 text-black font-medium dark:bg-gray-900/20 dark:text-black';
}

/**
 * Get the appropriate color classes for a status badge with a custom color
 * @param color The hex color code
 * @param variant 'default' for regular badges, 'kanban' for kanban headers
 * @returns Tailwind CSS classes for the status
 */
export function getCustomStatusStyles(color: string, variant: 'default' | 'kanban' = 'default') {
  // For custom colors, we create appropriate styling based on the variant
  if (variant === 'kanban') {
    return `bg-[${color}]/20 text-black font-medium dark:bg-[${color}]/30 dark:text-black`;
  } else {
    return `bg-[${color}]/10 text-black font-medium dark:bg-[${color}]/20 dark:text-black`;
  }
}

/**
 * Common badge styling for status indicators
 * Used for consistent appearance across the application
 */
export const statusBadgeStyles = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
