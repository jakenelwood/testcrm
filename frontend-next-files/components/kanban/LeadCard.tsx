'use client';

/**
 * LEAD CARD COMPONENT
 *
 * This component renders an individual lead card within the Kanban board.
 * It displays key lead information and handles both click and drag interactions.
 *
 * Written in React (TSX) with TypeScript and uses:
 * - dnd-kit for drag-and-drop functionality
 * - Tailwind CSS for styling
 * - React hooks for state management
 *
 * The component implements a sophisticated interaction model:
 * - Quick click: Opens the lead details modal
 * - Click and hold: Enables dragging to change the lead's status
 *
 * This dual-mode interaction allows for both viewing lead details and
 * moving leads between columns in the Kanban board.
 *
 * ARCHITECTURE ROLE:
 * This is a UI component in the presentation layer of the application.
 * It's responsible for displaying individual lead information in a card format
 * and handling user interactions with that lead.
 *
 * DEPENDENCIES:
 * - Lead type from @/types/lead
 * - dnd-kit/sortable for drag-and-drop functionality
 * - React hooks (useState, useRef) for interaction state management
 *
 * USED BY:
 * - KanbanColumn component to render each lead in a column
 *
 * INTERACTION MODEL:
 * - Uses a time-based approach to distinguish between clicks and drags
 * - Tracks mouse down time and compares with mouse up time
 * - If the duration is short, treats it as a click
 * - If the duration is longer, enables dragging
 */

import { Lead } from "@/types/lead";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState } from "react";

/**
 * Props interface for the LeadCard component
 */
interface LeadCardProps {
  lead: Lead;                // The lead data to display
  onClick: () => void;       // Callback for when the card is clicked
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  // State to track when the mouse button was pressed down (for distinguishing click vs. drag)
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);

  // Reference to the timeout that handles click detection
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Time threshold to distinguish between a click and a drag attempt (in milliseconds)
  const longPressThreshold = 200;

  // Integration with dnd-kit for drag-and-drop functionality
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    disabled: !mouseDownTime, // Only enable dragging after mouse down is detected
  });

  // Apply the transform from dnd-kit to enable smooth dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /**
   * Handles the mouse down event
   * Records the timestamp when the mouse button was pressed down
   * This is used to determine if the user is clicking or attempting to drag
   */
  const handleMouseDown = () => {
    const time = Date.now();
    setMouseDownTime(time);
  };

  /**
   * Handles the mouse up event
   * If the mouse was pressed for less than the threshold time, treats it as a click
   * Otherwise, it's considered a drag attempt
   */
  const handleMouseUp = () => {
    if (mouseDownTime && (Date.now() - mouseDownTime < longPressThreshold)) {
      // This was a quick click, not a drag attempt
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      // Small delay to ensure we're not in the middle of a drag operation
      // This prevents accidental clicks during drag operations
      clickTimeoutRef.current = setTimeout(() => {
        if (!isDragging) {
          onClick(); // Call the click handler to open the lead details
        }
      }, 50);
    }

    // Reset the mouse down time regardless of whether it was a click or drag
    setMouseDownTime(null);
  };

  /**
   * Format the lead creation date into a human-readable format
   * Displays as "Apr 28, 2025" for better readability
   */
  const formattedDate = new Date(lead.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  /**
   * Determines the background color for the carrier badge based on the carrier name
   * This provides visual differentiation between different insurance carriers
   *
   * @param carrier - The name of the insurance carrier or null if none
   * @returns A string of Tailwind CSS classes for styling the carrier badge
   */
  const getCarrierColor = (carrier: string | null) => {
    if (!carrier) return "bg-black text-white"; // "No Prior"

    // Map common carriers to specific colors for brand recognition
    switch (carrier.toLowerCase()) {
      case 'state farm':
        return "bg-red-500 text-white";      // State Farm's red
      case 'geico':
        return "bg-green-500 text-white";    // Geico's green
      case 'progressive':
        return "bg-blue-500 text-white";     // Progressive's blue
      case 'allstate':
        return "bg-yellow-500 text-black";   // Allstate's yellow
      default:
        return "bg-gray-500 text-white";     // Default for other carriers
    }
  };

  // Render the lead card with all its information and interactive behavior
  return (
    <div
      ref={setNodeRef}                 // Connect to dnd-kit for drag functionality
      style={style}                    // Apply transform styles from dnd-kit
      {...attributes}                  // Spread dnd-kit attributes
      {...listeners}                   // Spread dnd-kit event listeners
      className={`bg-white dark:bg-zinc-800 rounded-md p-4 mb-3 cursor-pointer transition-all ${
        isDragging
          ? 'opacity-50 shadow-none'   // Visual feedback when card is being dragged
          : 'opacity-100 hover:shadow-md shadow-sm'  // Normal state with hover effect
      }`}
      onMouseDown={handleMouseDown}    // Track when mouse is pressed down
      onMouseUp={handleMouseUp}        // Handle click vs. drag detection on mouse up
      onTouchStart={handleMouseDown}   // Support for touch devices
      onTouchEnd={handleMouseUp}       // Support for touch devices
    >
      {/* Lead name - prominently displayed at the top */}
      <div className="font-medium text-foreground dark:text-white">
        {lead.first_name} {lead.last_name}
      </div>

      {/* Creation date - secondary information */}
      <div className="text-sm text-muted-foreground mt-1">
        Entered on: {formattedDate}
      </div>

      {/* Carrier and premium information - displayed side by side */}
      <div className="flex justify-between items-center mt-3">
        {/* Carrier badge with color coding */}
        <span className={`px-2 py-1 rounded-full text-xs ${getCarrierColor(lead.current_carrier)}`}>
          {lead.current_carrier || "No Prior"}
        </span>

        {/* Premium amount - formatted as currency */}
        <span className="font-medium">
          ${lead.premium
            ? lead.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "0.00"}
        </span>
      </div>

      {/* Assigned agent - only shown if the lead is assigned */}
      {lead.assigned_to && (
        <div className="mt-2 flex justify-end">
          <span className="text-xs px-2 py-1 rounded-md border border-blue-500 text-blue-500">
            {lead.assigned_to}
          </span>
        </div>
      )}
    </div>
  );
}
