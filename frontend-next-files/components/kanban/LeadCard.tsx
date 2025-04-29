'use client';

import { Lead } from "@/types/lead";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Format date to "Apr 28, 2025" format
  const formattedDate = new Date(lead.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Get carrier color
  const getCarrierColor = (carrier: string | null) => {
    if (!carrier) return "bg-black text-white"; // "No Prior"

    switch (carrier.toLowerCase()) {
      case 'state farm':
        return "bg-red-500 text-white";
      case 'geico':
        return "bg-green-500 text-white";
      case 'progressive':
        return "bg-blue-500 text-white";
      case 'allstate':
        return "bg-yellow-500 text-black";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-zinc-800 rounded-md p-4 mb-3 cursor-pointer transition-all ${
        isDragging
          ? 'opacity-50 shadow-none'
          : 'opacity-100 hover:shadow-md shadow-sm'
      }`}
      onClick={onClick}
    >
      <div className="font-medium text-foreground dark:text-white">
        {lead.first_name} {lead.last_name}
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
