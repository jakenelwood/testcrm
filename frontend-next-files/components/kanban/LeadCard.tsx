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
      // Check if Ctrl/Cmd key is pressed
      if (e.ctrlKey || e.metaKey) {
        // Open full lead details page in a new tab
        window.open(`/dashboard/leads/${lead.id}`, '_blank');
      } else {
        // Open modal view
        onClick();
      }
    }

    setIsClicking(false);
  };

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
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'white', // Force white background even during drag
      }}
      {...attributes}
      {...listeners}
      className={`bg-white !bg-white rounded-lg p-4 mb-3 cursor-pointer transition-all duration-200 select-none border ${
        isDragging
          ? 'opacity-90 shadow-xl border-2 border-blue-500 !bg-white scale-105'
          : 'opacity-100 hover:shadow-md shadow-sm border-gray-200 hover:border-blue-300'
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
      {/* Top section with name and date */}
      <div className="flex justify-between items-start mb-3">
        <div className="font-medium text-gray-900 text-base">
          {/* Display client name if available, otherwise fallback to lead first/last name */}
          {lead.client?.name || (lead.first_name ? `${lead.first_name}${lead.last_name ? ` ${lead.last_name}` : ''}` : 'Unknown')}
          {lead.client?.client_type === 'Business' &&
            <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">Business</span>
          }
        </div>

        {lead.assigned_to && (
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm" title={`Assigned to: ${lead.assigned_to}`}>
            {lead.assigned_to.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Date section */}
      <div className="text-xs text-gray-500 mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formattedDate}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-2"></div>

      {/* Bottom section with carrier and premium */}
      <div className="flex justify-between items-center mt-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${getCarrierColor(lead.current_carrier)}`}>
          {lead.current_carrier || "No Prior"}
        </span>

        <span className="font-medium text-sm bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
          ${lead.premium
            ? lead.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "0.00"}
        </span>
      </div>
          </div>
  );
}
