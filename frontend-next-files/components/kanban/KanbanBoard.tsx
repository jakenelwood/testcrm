'use client';

import { Lead, LeadStatus } from "@/types/lead";
import { KanbanColumn } from "./KanbanColumn";
import { Skeleton } from "@/components/ui/skeleton";

interface KanbanBoardProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadSelect: (lead: Lead) => void;
}

export function KanbanBoard({ leads, isLoading, onLeadSelect }: KanbanBoardProps) {
  // Define all possible statuses (uppercase to match database)
  const statuses: LeadStatus[] = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];

  // Group leads by status
  const leadsByStatus = statuses.reduce((acc, status) => {
    acc[status] = leads.filter(lead => lead.status === status);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map((status) => (
          <div key={status} className="flex flex-col">
            <h3 className="font-medium text-sm mb-2">{status}</h3>
            <div className="bg-muted/30 rounded-lg p-4 min-h-[500px]">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 mb-2 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statuses.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          leads={leadsByStatus[status] || []}
          onLeadSelect={onLeadSelect}
        />
      ))}
    </div>
  );
}
