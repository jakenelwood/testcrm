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

  // Create a mapping between lead statuses and pipeline statuses
  const statusMapping: Record<string, string> = {
    // Lead Status -> Pipeline Status
    'New': 'New Lead',
    'Contacted': 'Initial Contact',
    'Qualified': 'Needs Assessment',
    'Quoted': 'Quote Presented', // Changed from Quote Preparation to Quote Presented
    'Sold': 'Policy Sold',
    'Lost': 'Lost',
    'Hibernated': 'Lost' // Map hibernated to lost for now
  };

  // Reverse mapping for finding leads by pipeline status
  const reverseMapping: Record<string, string[]> = {};
  Object.entries(statusMapping).forEach(([leadStatus, pipelineStatus]) => {
    if (!reverseMapping[pipelineStatus]) {
      reverseMapping[pipelineStatus] = [];
    }
    reverseMapping[pipelineStatus].push(leadStatus);
  });

  // Group leads by status for efficient rendering in columns
  // This creates a dictionary where keys are pipeline statuses and values are arrays of leads
  const leadsByStatus = statuses.reduce((acc, pipelineStatus) => {
    // Find all lead statuses that map to this pipeline status
    const mappedLeadStatuses = reverseMapping[pipelineStatus] || [pipelineStatus];

    // Filter leads that have any of the mapped statuses
    acc[pipelineStatus] = leads.filter(lead => {
      const leadStatus = lead.status || lead.status_legacy || '';
      return mappedLeadStatuses.includes(leadStatus);
    });
    return acc;
  }, {} as Record<string, Lead[]>);

  // Display a loading skeleton when data is being fetched
  // This provides a better user experience than an empty state or loading spinner
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="overflow-x-auto">
          <div className="flex gap-4 p-4 min-w-max">
            {statuses.map((status) => (
              <div key={status} className="flex flex-col min-w-[280px] w-[280px] flex-shrink-0">
                <div className="mb-3 px-2">
                  <div className="h-5 w-28 bg-muted rounded" />
                </div>
                <div className="bg-card border border-border rounded-lg p-4 min-h-[500px] shadow-sm">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-muted h-24 mb-3 rounded-lg border border-border">
                        <div className="p-4">
                          <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-1/2 mb-3"></div>
                          <div className="flex justify-between mt-4">
                            <div className="h-5 bg-muted-foreground/20 rounded w-1/3"></div>
                            <div className="h-5 bg-muted-foreground/20 rounded w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If there are no statuses, display a message
  if (statuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] border border-border rounded-lg bg-card shadow-sm">
        <div className="text-center p-8 max-w-md">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Pipeline Stages</h3>
          <p className="text-muted-foreground mb-6">
            This pipeline doesn't have any stages defined yet. You'll need to add stages to organize your leads.
          </p>
          <a href="/pipelines" className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-md shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
            Go to Pipeline Management
          </a>
        </div>
      </div>
    );
  }

  // Render the actual kanban board with data
  // Uses proper contained scroll architecture for reliable horizontal scrolling
  return (
    <div className="h-full overflow-y-auto">
      <div className="overflow-x-auto">
        <div className="flex gap-4 p-4 min-w-max">
          {/* Map through each status and create a column */}
          {statuses.map((status) => (
            <div key={status} className="min-w-[280px] w-[280px] flex-shrink-0">
              <KanbanColumn
                status={status}
                leads={leadsByStatus[status] || []}
                onLeadSelect={onLeadSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
