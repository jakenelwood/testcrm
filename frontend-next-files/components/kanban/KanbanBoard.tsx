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
        {statuses.map((status, index) => {
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

          const statusColor = getStatusColor(status);

          return (
            <div key={status} className="flex flex-col">
              <div className="mb-3">
                <div className={`px-4 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 bg-gradient-to-r ${statusColor} text-white shadow-sm`}>
                  <span>{status}</span>
                  <div className="h-5 w-5 bg-white/20 rounded-full"></div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[500px] shadow-sm">
                {/* Render 3 skeleton cards per column to indicate loading */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-100 h-24 mb-3 rounded-lg border border-gray-200">
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="flex justify-between mt-4">
                          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // If there are no statuses, display a message
  if (statuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="text-center p-8 max-w-md">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Pipeline Statuses</h3>
          <p className="text-gray-600 mb-6">
            This pipeline doesn't have any statuses defined yet. You'll need to add statuses to organize your leads.
          </p>
          <a href="/pipelines" className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-md shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
            Go to Pipeline Management
          </a>
        </div>
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
