'use client';

import { Lead } from "@/types/lead";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { formatDateMMDDYYYY } from "@/utils/date-format";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  // Debug information
  console.log('Lead data:', {
    id: lead.id,
    first_name: lead.first_name,
    last_name: lead.last_name,
    client: lead.client,
    client_id: lead.client_id
  });

  // State to track if we're in a potential drag operation
  const [isDragReady, setIsDragReady] = React.useState(false);

  // Reference to the timer that detects click-and-hold
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Track if we're currently dragging
  const dragStartedRef = React.useRef(false);

  // Track the initial position of the pointer
  const initialPositionRef = React.useRef({ x: 0, y: 0 });

  // 3D tilt while in drag-ready state
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 });
  // Integration with dnd-kit for drag-and-drop functionality
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    // Ensure the card is always draggable
    data: {
      type: 'lead',
      lead
    }
  });

  // Apply dnd-kit transform and add 3D tilt when drag-ready (not yet dragging)
  const baseTransform = CSS.Transform.toString(transform);
  const tiltTransform =
    isDragReady && !isDragging
      ? ` perspective(700px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`
      : '';
  const style = {
    transform: `${baseTransform}${tiltTransform}`,
    transition,
  };

  /**
   * Handle mouse down on the card
   * Start a timer to detect if this is a click-and-hold action
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only respond to left-click
    if (e.button !== 0) return;
    e.preventDefault();

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Store the initial position
    initialPositionRef.current = { x: e.clientX, y: e.clientY };

    // Start a timer to detect click-and-hold
    timerRef.current = setTimeout(() => {
      // After holding for 150ms, enable dragging

      setIsDragReady(true);

      // Provide haptic feedback on mobile devices if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      // Simulate pointerdown so dnd-kit captures it after listeners attach
      setTimeout(() => {
        const el = document.getElementById(`lead-card-${lead.id}`);
        if (el) {
          const evt = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            pointerType: 'mouse',
            buttons: 1,
            clientX: initialPositionRef.current.x,
            clientY: initialPositionRef.current.y,
          });
          el.dispatchEvent(evt);
        }
      }, 0);
    }, 150);
  };

  /**
   * Handle mouse move on the card
   * If we're in drag-ready state, start the actual drag operation
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    // If we're ready to drag but haven't started dragging yet
    if (isDragReady && !dragStartedRef.current) {
      const card = e.currentTarget as HTMLDivElement;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rx = (y - centerY) / 8; // tilt strength
      const ry = (centerX - x) / 8;
      setTilt({ rx, ry });

      // Calculate distance moved to optionally mark drag start
      const dx = Math.abs(e.clientX - initialPositionRef.current.x);
      const dy = Math.abs(e.clientY - initialPositionRef.current.y);
      if (dx > 3 || dy > 3) {
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
      // Check if Ctrl/Cmd key is pressed
      if (e.ctrlKey || e.metaKey) {
        // Open full lead details page in a new tab
        window.open(`/dashboard/leads/${lead.id}`, '_blank');
      } else {
        // Open modal view
        onClick();
      }
    }

    // Reset states
    setIsDragReady(false);
    setTilt({ rx: 0, ry: 0 });
    dragStartedRef.current = false;
  };

  /**
   * Handle touch start on the card (for mobile)
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to avoid unwanted behaviors
    e.preventDefault();

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Store the initial position
    if (e.touches[0]) {
      initialPositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }

    // Start a timer to detect touch-and-hold
    timerRef.current = setTimeout(() => {
      setIsDragReady(true);

      // Provide haptic feedback on mobile devices if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 150);
  };

  /**
   * Handle touch move on the card (for mobile)
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragReady && !dragStartedRef.current && e.touches[0]) {
      const card = e.currentTarget as HTMLDivElement;
      const rect = card.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rx = (y - centerY) / 8;
      const ry = (centerX - x) / 8;
      setTilt({ rx, ry });

      const dx = Math.abs(e.touches[0].clientX - initialPositionRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - initialPositionRef.current.y);
      if (dx > 3 || dy > 3) {
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
      // Check if Ctrl/Cmd key is pressed (for touch devices with keyboard)
      if (e.ctrlKey || e.metaKey) {
        // Open full lead details page in a new tab
        window.open(`/dashboard/leads/${lead.id}`, '_blank');
      } else {
        // Open modal view
        onClick();
      }
    }

    // Reset states
    setIsDragReady(false);
    setTilt({ rx: 0, ry: 0 });
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
    setTilt({ rx: 0, ry: 0 });
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

  // Format date for display using our utility function
  const formattedDate = formatDateMMDDYYYY(lead.created_at);

  // Determine carrier badge color
  const getCarrierColor = (carrier: string | null | undefined) => {
    if (!carrier) return "bg-gradient-to-r from-gray-700 to-gray-800 text-white";

    switch (carrier.toLowerCase()) {
      case 'state farm': return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case 'geico': return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case 'progressive': return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case 'allstate': return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  return (
    <div
      id={`lead-card-${lead.id}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isDragReady ? listeners : {})}
      className={`relative bg-card text-card-foreground rounded-lg p-4 mb-3 cursor-pointer transition-all duration-200 select-none border min-h-[128px] flex flex-col justify-between ${
        isDragging
          ? 'opacity-50 shadow-none'
          : isDragReady
            ? 'opacity-95 shadow-2xl scale-[1.03] -translate-y-0.5 border border-blue-500 rotate-1 z-20'
            : 'opacity-100 hover:shadow-md shadow-sm border-border hover:border-blue-300'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handlePointerCancel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handlePointerCancel}
    >
      {/* Gloss overlay appears when armed to drag */}
      {isDragReady && !isDragging && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 35%, rgba(255,255,255,0.0) 60%)",
            backdropFilter: "blur(0.5px)",
          }}
        />
      )}

      {/* Top section with name and date */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-3 gap-2">
          {/* This wrapper is the key to constraining the text in a flex context */}
          <div className="flex-1 min-w-0">
            <div
              className="font-medium text-foreground text-base truncate"
              title={lead.client?.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()}
            >
              {/* Display client name if available, otherwise fallback to lead first/last name */}
              {lead.client?.name || (lead.first_name ? `${lead.first_name}${lead.last_name ? ` ${lead.last_name}` : ''}` : 'Unknown')}
            </div>
            {lead.client?.client_type === 'Business' &&
              <span className="mt-1 text-xs font-normal text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full inline-block">Business</span>
            }
          </div>

          {/* Make sure the avatar does not shrink */}
          <div className="flex-shrink-0">
            {lead.assigned_to && (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm" title={`Assigned to: ${lead.assigned_to}`}>
                {lead.assigned_to.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Date section */}
        <div className="text-xs text-muted-foreground flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formattedDate}
        </div>
      </div>

      {/* Bottom section with carrier and premium */}
      <div className="mt-auto pt-3 border-t border-border">
        <div className="flex justify-between items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${getCarrierColor(lead.current_carrier)}`}>
            {lead.current_carrier || "No Prior"}
          </span>

          <span className="font-medium text-sm bg-muted text-muted-foreground px-2 py-1 rounded-md border border-border">
            ${lead.premium
              ? lead.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "0.00"}
          </span>
        </div>
      </div>
    </div>
  );
}
