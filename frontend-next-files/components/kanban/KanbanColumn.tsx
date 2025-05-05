'use client';

import { Lead, LeadStatus } from "@/types/lead";
import { LeadCard } from "./LeadCard";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { getStatusStyles } from "@/utils/status-styles";

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
}

export function KanbanColumn({ status, leads, onLeadSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    // Make the entire column a drop target with a larger hit area
    data: {
      accepts: ['lead'],
      status
    }
  });

  // Using centralized status styles

  // Status is already capitalized in the database

  return (
    <div className="flex flex-col">
      <div className={`px-3 py-1 rounded-md text-sm font-medium inline-block mb-2 text-black font-semibold ${getStatusStyles(status, 'kanban')}`}>
        {status} ({leads.length})
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-4 min-h-[500px] transition-all duration-200 ${
          isOver
            ? 'bg-blue-100/50 border-2 border-dashed border-blue-500 shadow-lg scale-[1.02]'
            : 'bg-gray-100/80 border border-transparent hover:border-blue-300 hover:border-dashed hover:border'
        }`}
      >
        <SortableContext
          items={leads.map(lead => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadSelect(lead)}
              />
            ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-24 border border-dashed rounded-md border-muted-foreground/50">
            <p className="text-sm text-muted-foreground">No leads</p>
          </div>
        )}
      </div>
    </div>
  );
}
