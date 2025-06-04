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

  // Get status color based on status name
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'new': return 'from-blue-500 to-blue-600';
      case 'contacted': return 'from-indigo-500 to-indigo-600';
      case 'quoted': return 'from-purple-500 to-purple-600';
      case 'sold': return 'from-green-500 to-green-600';
      case 'lost': return 'from-gray-500 to-gray-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  // Status is already capitalized in the database
  const statusColor = getStatusColor(status);

  return (
    <div className="flex flex-col">
      <div className="mb-3">
        <div className={`px-4 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 bg-gradient-to-r ${statusColor} text-white shadow-sm`}>
          <span>{status}</span>
          <span className="flex items-center justify-center bg-white/20 text-white text-xs font-bold rounded-full h-5 w-5 ml-1">
            {leads.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-4 min-h-[500px] transition-all duration-300 ${
          isOver
            ? 'bg-blue-50 border-2 border-dashed border-blue-500 shadow-lg scale-[1.02]'
            : 'bg-card border border-border shadow-sm hover:border-blue-300 hover:shadow-md'
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
          <div className="flex flex-col items-center justify-center h-32 border border-dashed rounded-lg border-border bg-muted/50 p-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">No leads in {status}</p>
            <p className="text-xs text-muted-foreground mt-1">Drag leads here or add new ones</p>
          </div>
        )}
      </div>
    </div>
  );
}
