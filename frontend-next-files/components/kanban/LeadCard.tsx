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

  // Track if we're currently dragging
  const dragStartedRef = React.useRef(false);

  // Track the initial position of the pointer
  const initialPositionRef = React.useRef({ x: 0, y: 0 });

  // Integration with dnd-kit for drag-and-drop functionality
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  // Apply the transform from dnd-kit to enable smooth dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /**
   * Handle mouse down on the card
   * Start a timer to detect if this is a click-and-hold action
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent default to avoid text selection
    e.preventDefault();

    // Store the initial position
    initialPositionRef.current = { x: e.clientX, y: e.clientY };

    // Start a timer to detect click-and-hold
    timerRef.current = setTimeout(() => {
      // After holding for 200ms, enable dragging
      setIsDragReady(true);

      // Provide haptic feedback on mobile devices if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // Short vibration to indicate drag is ready
      }
    }, 200);
  };

  /**
   * Handle mouse move on the card
   * If we're in drag-ready state, start the actual drag operation
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    // If we're ready to drag but haven't started dragging yet
    if (isDragReady && !dragStartedRef.current) {
      // Calculate distance moved
      const dx = Math.abs(e.clientX - initialPositionRef.current.x);
      const dy = Math.abs(e.clientY - initialPositionRef.current.y);

      // If the user has moved the mouse a bit, start dragging
      if (dx > 5 || dy > 5) {
        dragStartedRef.current = true;
      }
    }
  };

  /**
   * Handle mouse up on the card
   * If the mouse is released quickly, treat it as a click
   */
  const handleMouseUp = (e: React.MouseEvent) => {
    // Clear the timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If we haven't started dragging and it was a quick click, open the details
    if (!dragStartedRef.current && !isDragging) {
      onClick();
    }

    // Reset states
    setIsDragReady(false);
    dragStartedRef.current = false;
  };

  /**
   * Handle touch start on the card (for mobile)
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to avoid unwanted behaviors
    e.preventDefault();

    // Store the initial position
    if (e.touches[0]) {
      initialPositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }

    // Start a timer to detect touch-and-hold
    timerRef.current = setTimeout(() => {
      // After holding for 200ms, enable dragging
      setIsDragReady(true);

      // Provide haptic feedback on mobile devices if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // Short vibration to indicate drag is ready
      }
    }, 200);
  };

  /**
   * Handle touch move on the card (for mobile)
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    // If we're ready to drag but haven't started dragging yet
    if (isDragReady && !dragStartedRef.current && e.touches[0]) {
      // Calculate distance moved
      const dx = Math.abs(e.touches[0].clientX - initialPositionRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - initialPositionRef.current.y);

      // If the user has moved their finger a bit, start dragging
      if (dx > 5 || dy > 5) {
        dragStartedRef.current = true;
      }
    }
  };

  /**
   * Handle touch end on the card (for mobile)
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear the timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If we haven't started dragging and it was a quick tap, open the details
    if (!dragStartedRef.current && !isDragging) {
      onClick();
    }

    // Reset states
    setIsDragReady(false);
    dragStartedRef.current = false;
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

    // Reset states
    setIsDragReady(false);
    dragStartedRef.current = false;
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
      onMouseDown={handleMouseDown}     // Start timer to detect click-and-hold (mouse)
      onMouseMove={handleMouseMove}     // Track mouse movement to initiate drag
      onMouseUp={handleMouseUp}         // Handle quick click to open lead details (mouse)
      onMouseLeave={handlePointerCancel} // Clear timer if mouse leaves the card
      onTouchStart={handleTouchStart}   // Start timer to detect click-and-hold (touch)
      onTouchMove={handleTouchMove}     // Track touch movement to initiate drag
      onTouchEnd={handleTouchEnd}       // Handle quick tap to open lead details (touch)
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
