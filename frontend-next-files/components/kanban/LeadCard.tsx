'use client';

import { Lead } from "@/types/lead";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  // Track if we're in a click (not a drag) operation
  const [isClicking, setIsClicking] = React.useState(false);

  // Track when the mouse was pressed down
  const mouseDownTimeRef = React.useRef<number>(0);

  // Integration with dnd-kit for drag-and-drop functionality
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead
    }
  });

  // Apply the transform from dnd-kit to enable smooth dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle mouse down - mark as clicking and record time
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent text selection
    e.preventDefault();

    // Record when the mouse was pressed
    mouseDownTimeRef.current = Date.now();
    setIsClicking(true);
  };

  // Handle mouse up - if it was a quick click (not a drag), open details
  const handleMouseUp = (e: React.MouseEvent) => {
    // Calculate how long the mouse was pressed
    const clickDuration = Date.now() - mouseDownTimeRef.current;

    // If it was a quick click (less than 200ms) and not dragging, treat as a click
    if (isClicking && clickDuration < 200 && !isDragging) {
      onClick();
    }

    setIsClicking(false);
  };

  // Format date for display
  const formattedDate = new Date(lead.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Determine carrier badge color
  const getCarrierColor = (carrier: string | null) => {
    if (!carrier) return "bg-black text-white";

    switch (carrier.toLowerCase()) {
      case 'state farm': return "bg-red-500 text-white";
      case 'geico': return "bg-green-500 text-white";
      case 'progressive': return "bg-blue-500 text-white";
      case 'allstate': return "bg-yellow-500 text-black";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-zinc-800 rounded-md p-4 mb-3 cursor-pointer transition-all select-none ${
        isDragging
          ? 'opacity-50 shadow-none border-2 border-blue-500'
          : 'opacity-100 hover:shadow-md shadow-sm hover:border hover:border-blue-300'
      }`}
      onClick={(e) => {
        // Prevent the click from triggering drag
        e.stopPropagation();
        // Only handle click if not dragging
        if (!isDragging) {
          onClick();
        }
      }}
    >
      <div className="font-medium text-foreground dark:text-white">
        {typeof lead.first_name === 'string' ? lead.first_name : ''} {typeof lead.last_name === 'string' ? lead.last_name : ''}
      </div>

      <div className="text-sm text-muted-foreground mt-1">
        Entered on: {formattedDate}
      </div>

      <div className="flex justify-between items-center mt-3">
        <span className={`px-2 py-1 rounded-full text-xs ${getCarrierColor(lead.current_carrier)}`}>
          {lead.current_carrier || "No Prior"}
        </span>

        <span className="font-medium">
          ${lead.premium
            ? lead.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "0.00"}
        </span>
      </div>

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
