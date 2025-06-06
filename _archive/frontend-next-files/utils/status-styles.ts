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
      ? 'bg-chart-1/30 text-foreground font-medium'
      : 'bg-chart-1/30 text-foreground font-medium';
  }

  if (statusLower === 'contacted' || statusLower === 'in progress') {
    return isKanban
      ? 'bg-chart-4/30 text-foreground font-medium'
      : 'bg-chart-4/30 text-foreground font-medium';
  }

  if (statusLower === 'quoted') {
    return isKanban
      ? 'bg-chart-5/30 text-foreground font-medium'
      : 'bg-chart-5/30 text-foreground font-medium';
  }

  if (statusLower === 'sold' || statusLower === 'completed') {
    return isKanban
      ? 'bg-chart-2/30 text-foreground font-medium'
      : 'bg-chart-2/30 text-foreground font-medium';
  }

  if (statusLower === 'lost') {
    return isKanban
      ? 'bg-destructive/30 text-foreground font-medium'
      : 'bg-destructive/30 text-foreground font-medium';
  }

  // Default case
  return isKanban
    ? 'bg-muted text-foreground font-medium'
    : 'bg-muted text-foreground font-medium';
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
    return `bg-[${color}]/30 text-foreground font-medium`;
  } else {
    return `bg-[${color}]/30 text-foreground font-medium`;
  }
}

/**
 * Common badge styling for status indicators
 * Used for consistent appearance across the application
 */
export const statusBadgeStyles = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
