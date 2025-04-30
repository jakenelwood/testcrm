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
import React from "react";

/**
 * Props interface for the LeadCard component
 */
interface LeadCardProps {
  lead: Lead;                // The lead data to display
  onClick: () => void;       // Callback for when the card is clicked
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  // State to track if we're in a potential drag operation
  const [isDragReady, setIsDragReady] = React.useState(false);

  // Reference to the timer that detects click-and-hold
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Integration with dnd-kit for drag-and-drop functionality
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    // We don't disable the sortable - we'll manually control when to apply the listeners
  });

  // Apply the transform from dnd-kit to enable smooth dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /**
   * Handle mouse/touch down on the card
   * Start a timer to detect if this is a click-and-hold action
   */
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to avoid text selection
    e.preventDefault();

    // Start a timer to detect click-and-hold
    timerRef.current = setTimeout(() => {
      // After holding for 200ms, enable dragging
      setIsDragReady(true);

      // Provide haptic feedback on mobile devices if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // Short vibration to indicate drag is ready
      }

      // Simulate the pointer event to start dragging immediately
      // This is necessary because dnd-kit needs a pointer event to start dragging
      const element = document.getElementById(`lead-card-${lead.id}`);
      if (element) {
        // Create and dispatch a new pointer event to start the drag
        const event = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: e instanceof MouseEvent ? e.clientX : e.touches[0].clientX,
          clientY: e instanceof MouseEvent ? e.clientY : e.touches[0].clientY,
        });
        element.dispatchEvent(event);
      }
    }, 200);
  };

  /**
   * Handle mouse/touch up on the card
   * If the pointer is released quickly, treat it as a click
   */
  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    // If we haven't enabled dragging yet, this was a quick click
    if (!isDragReady && !isDragging) {
      // Clear the timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Trigger the click handler
      onClick();
    }

    // Reset drag ready state
    setIsDragReady(false);
  };

  /**
   * Handle pointer cancel/leave events
   * Clear the timer to prevent unexpected behavior
   */
  const handlePointerCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Reset drag ready state
    setIsDragReady(false);
  };

  /**
   * Clean up the timer when the component unmounts
   */
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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
      id={`lead-card-${lead.id}`}      // Add an ID for targeting with simulated events
      ref={setNodeRef}                 // Connect to dnd-kit for drag functionality
      style={style}                    // Apply transform styles from dnd-kit
      {...attributes}                  // Spread dnd-kit attributes
      {...(isDragReady ? listeners : {})}  // Only apply listeners when ready to drag
      className={`bg-white dark:bg-zinc-800 rounded-md p-4 mb-3 cursor-pointer transition-all select-none ${
        isDragging
          ? 'opacity-50 shadow-none'   // Visual feedback when card is being dragged
          : isDragReady
            ? 'opacity-90 shadow-lg scale-[1.02] border border-blue-500' // Ready to drag state
            : 'opacity-100 hover:shadow-md shadow-sm'  // Normal state with hover effect
      }`}
      onMouseDown={handlePointerDown}   // Start timer to detect click-and-hold (mouse)
      onMouseUp={handlePointerUp}       // Handle quick click to open lead details (mouse)
      onMouseLeave={handlePointerCancel} // Clear timer if mouse leaves the card
      onTouchStart={handlePointerDown}  // Start timer to detect click-and-hold (touch)
      onTouchEnd={handlePointerUp}      // Handle quick tap to open lead details (touch)
      onTouchCancel={handlePointerCancel} // Clear timer if touch is cancelled
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
