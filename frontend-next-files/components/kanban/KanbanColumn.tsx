'use client';

import { Lead, LeadStatus } from "@/types/lead";
import { LeadCard } from "./LeadCard";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
}

export function KanbanColumn({ status, leads, onLeadSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Get status color
  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Quoted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Sold':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Lost':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Status is already capitalized in the database

  return (
    <div className="flex flex-col">
      <div className={`px-3 py-1 rounded-md text-sm font-medium inline-block mb-2 ${getStatusColor(status)}`}>
        {status} ({leads.length})
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-lg p-4 min-h-[500px] transition-colors duration-200 ${
          isOver
            ? 'bg-blue-100/50 dark:bg-blue-900/20 border-2 border-dashed border-blue-500'
            : 'bg-muted/30'
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
