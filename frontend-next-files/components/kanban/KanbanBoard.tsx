'use client';

/**
 * KANBAN BOARD COMPONENT
 *
 * This component implements a Kanban-style board for visualizing and managing leads
 * across different stages of the sales pipeline. It's a core UI element of the CRM system
 * that provides a visual representation of the sales process.
 *
 * Written in React (TSX) with TypeScript for type safety and Tailwind CSS for styling.
 *
 * The component:
 * - Organizes leads into columns based on their status
 * - Renders a loading skeleton state when data is being fetched
 * - Delegates the rendering of individual columns to the KanbanColumn component
 * - Handles lead selection for viewing details
 *
 * This component is used in the leads page and integrates with the drag-and-drop
 * functionality implemented at the page level.
 *
 * ARCHITECTURE ROLE:
 * This is a UI component in the presentation layer of the application.
 * It's responsible for visualizing the lead management workflow.
 *
 * DEPENDENCIES:
 * - Lead types from @/types/lead
 * - KanbanColumn component for rendering individual columns
 * - Skeleton component from shadcn/ui for loading states
 *
 * USED BY:
 * - dashboard/leads/page.tsx as the main content
 *
 * DATA FLOW:
 * - Receives leads data from the parent page component
 * - Groups leads by status
 * - Passes appropriate leads to each KanbanColumn
 * - Handles lead selection and passes it back to the parent
 */

import { Lead, LeadStatus, PipelineStatus } from "@/types/lead";
import { KanbanColumn } from "./KanbanColumn";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Props interface for the KanbanBoard component
 */
interface KanbanBoardProps {
  leads: Lead[];                       // Array of lead objects to display
  isLoading: boolean;                  // Loading state flag
  onLeadSelect: (lead: Lead) => void;  // Callback for when a lead is selected/clicked
  statuses?: PipelineStatus[];         // Optional array of pipeline statuses
}

export function KanbanBoard({ leads, isLoading, onLeadSelect, statuses: pipelineStatuses }: KanbanBoardProps) {
  // Define default statuses if none are provided
  // These statuses represent the different stages in the sales pipeline
  const defaultStatuses: LeadStatus[] = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];

  // Use provided pipeline statuses or fall back to default
  const statuses = pipelineStatuses?.map(s => s.name as LeadStatus) || defaultStatuses;

  // Group leads by status for efficient rendering in columns
  // This creates a dictionary where keys are statuses and values are arrays of leads
  const leadsByStatus = statuses.reduce((acc, status) => {
    acc[status] = leads.filter(lead => lead.status === status);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Display a loading skeleton when data is being fetched
  // This provides a better user experience than an empty state or loading spinner
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map((status) => (
          <div key={status} className="flex flex-col">
            <h3 className="font-medium text-sm mb-2">{status}</h3>
            <div className="bg-muted/30 rounded-lg p-4 min-h-[500px]">
              {/* Render 3 skeleton cards per column to indicate loading */}
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 mb-2 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render the actual kanban board with data
  // The grid layout adjusts responsively based on screen size:
  // - Single column on mobile
  // - 3 columns on medium screens
  // - 5 columns (full board) on large screens
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Map through each status and create a column */}
      {statuses.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          leads={leadsByStatus[status] || []} // Pass the filtered leads for this status
          onLeadSelect={onLeadSelect}         // Pass the lead selection handler
        />
      ))}
    </div>
  );
}
