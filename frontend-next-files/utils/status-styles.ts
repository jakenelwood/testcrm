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
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
  }

  if (statusLower === 'contacted' || statusLower === 'in progress') {
    return isKanban
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
  }

  if (statusLower === 'quoted') {
    return isKanban
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      : 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
  }

  if (statusLower === 'sold' || statusLower === 'completed') {
    return isKanban
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  }

  if (statusLower === 'lost') {
    return isKanban
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
  }

  // Default case
  return isKanban
    ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
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
    return `bg-[${color}]/20 text-[${color}] dark:bg-[${color}]/30 dark:text-[${color}]/90`;
  } else {
    return `bg-[${color}]/10 text-[${color}] dark:bg-[${color}]/20 dark:text-[${color}]/90`;
  }
}

/**
 * Common badge styling for status indicators
 * Used for consistent appearance across the application
 */
export const statusBadgeStyles = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
