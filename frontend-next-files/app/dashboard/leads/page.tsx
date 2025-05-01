'use client';

/**
 * LEADS PAGE
 *
 * This page implements the lead management interface with a Kanban board.
 * It's one of the core features of the CRM system, allowing users to visualize
 * and manage leads across different stages of the sales pipeline.
 *
 * Written in React (TSX) with Next.js App Router, this page:
 * - Fetches leads from Supabase
 * - Implements real-time updates with Supabase subscriptions
 * - Provides search functionality for leads
 * - Implements drag-and-drop for moving leads between statuses
 * - Displays lead details in a modal
 *
 * ARCHITECTURE ROLE:
 * This is a page component in the presentation layer of the application.
 * It serves as the container for the lead management interface and coordinates
 * the interactions between the Kanban board, lead cards, and the database.
 *
 * DEPENDENCIES:
 * - React hooks for state management
 * - dnd-kit for drag-and-drop functionality
 * - Supabase client for database operations
 * - UI components from shadcn/ui
 * - Custom components: KanbanBoard, LeadDetailsModal
 *
 * DATA FLOW:
 * 1. Fetches leads from Supabase on initial load
 * 2. Sets up real-time subscription for lead updates
 * 3. Handles search filtering of leads
 * 4. Manages drag-and-drop operations to update lead statuses
 * 5. Opens lead details modal when a lead is clicked
 */

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  Active,
  CollisionDetection,
  DroppableContainer,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Search, LayoutGrid, List } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { LeadDetailsModal } from "@/components/kanban/LeadDetailsModal";
import { Lead, LeadStatus } from "@/types/lead";
import supabase from '@/utils/supabase/client';
import { fetchLeadsWithRelations, updateLeadStatus } from '@/utils/lead-api';
import { LeadListView } from "@/components/leads/LeadListView";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * LeadsPage Component
 *
 * The main page component for lead management. This component orchestrates
 * the entire lead management interface, including the Kanban board, search,
 * and lead details modal.
 *
 * @returns The rendered leads page with Kanban board and related functionality
 */
export default function LeadsPage() {
  // State for all leads fetched from the database
  const [leads, setLeads] = useState<Lead[]>([]);

  // State for leads after search filtering is applied
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

  // State for the current search query
  const [searchQuery, setSearchQuery] = useState('');

  // State for the currently selected lead (for details view)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // State for controlling the visibility of the lead details modal
  const [isLeadDetailsModalOpen, setIsLeadDetailsModalOpen] = useState(false);

  // State for tracking loading status during data fetching
  const [isLoading, setIsLoading] = useState(true);

  // State for the lead currently being dragged (for drag overlay)
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // State for the current view (kanban or list)
  const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Configure the sensor with a delay to differentiate between clicks and drags
      activationConstraint: {
        // Add a small delay to allow for clicks
        delay: 250,
        // Add some tolerance for small movements during clicks
        tolerance: 5,
        // Add a small distance constraint to prevent accidental drags
        distance: 8,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Enhanced collision detection that makes it much easier to drop cards into columns
  const customCollisionDetection: CollisionDetection = ({
    droppableContainers,
    droppableRects,
    collisionRect,
    active,
    ...args
  }) => {
    // Filter containers to only include status columns (not other cards)
    // This ensures we prioritize dropping into columns over other elements
    const statusContainers = droppableContainers.filter(container => {
      // Check if the container's id is one of our status values
      const statusValues = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];
      return statusValues.includes(String(container.id));
    });

    // If we're not over any column, find the closest column
    // This creates a "magnetic" effect where cards snap to the nearest column
    if (statusContainers.length > 0) {
      // First check if we're directly over any column with a more forgiving threshold
      // This uses pointerWithin which is already forgiving
      const pointerCollisions = pointerWithin({
        droppableContainers: statusContainers,
        droppableRects,
        collisionRect,
        ...args
      });

      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }

      // If not directly over, check for any intersection with a column
      // This is even more forgiving than pointerWithin
      const rectCollisions = rectIntersection({
        droppableContainers: statusContainers,
        droppableRects,
        collisionRect,
        ...args
      });

      if (rectCollisions.length > 0) {
        return rectCollisions;
      }

      // If still no collision, find the closest column
      // This makes it so the card will always find a home in the nearest column
      // even if it's not directly over any column
      return closestCenter({
        droppableContainers: statusContainers,
        droppableRects,
        collisionRect,
        ...args
      });
    }

    // If no status containers are available, fall back to standard detection
    // First try pointerWithin which is more forgiving
    const pointerCollisions = pointerWithin({
      droppableContainers,
      droppableRects,
      collisionRect,
      ...args
    });

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // Otherwise, try rectIntersection which is also forgiving
    const rectCollisions = rectIntersection({
      droppableContainers,
      droppableRects,
      collisionRect,
      ...args
    });

    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    // Finally, fall back to closestCenter which is the most precise
    return closestCenter({
      droppableContainers,
      droppableRects,
      collisionRect,
      ...args
    });
  };

  // Fetch leads from Supabase with proper joins
  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      try {
        // Use the fetchLeadsWithRelations function from lead-api.ts
        const leadsData = await fetchLeadsWithRelations();
        setLeads(leadsData);
        setFilteredLeads(leadsData);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();

    // Set up real-time subscription
    const subscription = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        // Refresh leads when changes occur
        fetchLeads();
      })
      .subscribe();

    return () => {
      // Clean up subscription
      subscription.unsubscribe();

      // Ensure dragging class is removed if component unmounts during drag
      document.body.classList.remove('dragging');
    };
  }, []);

  // Filter leads based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLeads(leads);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = leads.filter(
        (lead) =>
          lead.first_name?.toLowerCase().includes(query) ||
          lead.last_name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone_number?.toLowerCase().includes(query)
      );
      setFilteredLeads(filtered);
    }
  }, [searchQuery, leads]);

  // Handle drag start event
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedLead = leads.find(lead => lead.id === active.id);
    if (draggedLead) {
      setActiveLead(draggedLead);
      // Add a class to the body to prevent text selection during dragging
      document.body.classList.add('dragging');
    }
  };

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset active lead regardless of outcome
    setActiveLead(null);

    // Remove the dragging class from the body
    document.body.classList.remove('dragging');

    if (over && active.id !== over.id) {
      const leadId = active.id as string;

      // Get the status ID from the column ID
      let statusId: number;

      // Map the column ID to the status ID in the database
      switch (over.id) {
        case 'New':
          statusId = 1;
          break;
        case 'Contacted':
          statusId = 2;
          break;
        case 'Quoted':
          statusId = 3;
          break;
        case 'Sold':
          statusId = 4;
          break;
        case 'Lost':
          statusId = 5;
          break;
        default:
          console.error('Unknown status:', over.id);
          return; // Exit if status is unknown
      }

      console.log('Moving lead', leadId, 'to status ID:', statusId);

      // Find the lead being updated
      const leadToUpdate = leads.find(lead => lead.id === leadId);
      if (!leadToUpdate) {
        console.error('Lead not found:', leadId);
        return;
      }

      // Get the status value for UI update
      const newStatus = over.id as LeadStatus;

      // Update lead status in state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );

      try {
        // Use the updateLeadStatus function from lead-api.ts
        await updateLeadStatus(leadId, statusId);
      } catch (error) {

        console.error('Error updating lead status:', error);
        // Revert the state change if the update fails
        try {
          // Fetch the lead again to get the current status
          const leadsData = await fetchLeadsWithRelations();
          const updatedLead = leadsData.find(l => l.id === leadId);

          if (updatedLead) {
            // Update the lead in state with the current status from the database
            setLeads((prevLeads) =>
              prevLeads.map((lead) =>
                lead.id === leadId ? updatedLead : lead
              )
            );
          }
        } catch (fetchError) {
          console.error('Error reverting lead status:', fetchError);
        }
      }
    }
  };

  // Lead creation now handled by the New Lead page

  // Handle lead selection for details view
  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDetailsModalOpen(true);
  };

  // Handle lead update
  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
    setSelectedLead(updatedLead);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Button
          asChild
          className="bg-black hover:bg-gray-800 text-white"
        >
          <Link href="/dashboard/new">
            New Lead
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex-shrink-0">
          <ToggleGroup type="single" value={currentView} onValueChange={(value) => value && setCurrentView(value as 'kanban' | 'list')}>
            <ToggleGroupItem value="kanban" aria-label="Toggle Kanban view">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Toggle List view">
              <List className="h-4 w-4 mr-2" />
              List
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {currentView === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: 'always'
            }
          }}
        >
          <KanbanBoard
            leads={filteredLeads}
            isLoading={isLoading}
            onLeadSelect={handleLeadSelect}
          />

          <DragOverlay dropAnimation={{
            duration: 300,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            scale: 0.98,
          }}>
            {activeLead ? (
              <div className="bg-white dark:bg-zinc-800 rounded-md shadow-xl p-4 w-[calc(100%-2rem)] max-w-[300px] border-2 border-blue-500 rotate-1 scale-105 select-none">
                <div className="font-medium text-foreground dark:text-white">
                  {typeof activeLead.first_name === 'string' ? activeLead.first_name : ''} {typeof activeLead.last_name === 'string' ? activeLead.last_name : ''}
                </div>

                <div className="text-sm text-muted-foreground mt-1">
                  Entered on: {new Date(activeLead.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    !activeLead.current_carrier ? "bg-black text-white" :
                    activeLead.current_carrier.toLowerCase() === 'state farm' ? "bg-red-500 text-white" :
                    "bg-gray-500 text-white"
                  }`}>
                    {activeLead.current_carrier || "No Prior"}
                  </span>

                  <span className="font-medium">
                    ${activeLead.premium
                      ? activeLead.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : "0.00"}
                  </span>
                </div>

                {activeLead.assigned_to && (
                  <div className="mt-2 flex justify-end">
                    <span className="text-xs px-2 py-1 rounded-md border border-blue-500 text-blue-500">
                      {activeLead.assigned_to}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <LeadListView
          leads={filteredLeads}
          isLoading={isLoading}
          onLeadSelect={handleLeadSelect}
          onStatusChange={(leadId, newStatus) => {
            // Update lead status in state
            setLeads((prevLeads) =>
              prevLeads.map((lead) =>
                lead.id === leadId ? { ...lead, status: newStatus } : lead
              )
            );

            // Get the status ID based on the status name
            let statusId = 1; // Default to "New" (ID: 1)
            switch (newStatus) {
              case 'New': statusId = 1; break;
              case 'Contacted': statusId = 2; break;
              case 'Quoted': statusId = 3; break;
              case 'Sold': statusId = 4; break;
              case 'Lost': statusId = 5; break;
            }

            // Update lead status in database
            updateLeadStatus(leadId, statusId).catch(error => {
              console.error('Error updating lead status:', error);
              // Revert the state change if the update fails
              fetchLeadsWithRelations().then(leadsData => {
                const updatedLead = leadsData.find(l => l.id === leadId);
                if (updatedLead) {
                  setLeads((prevLeads) =>
                    prevLeads.map((lead) =>
                      lead.id === leadId ? updatedLead : lead
                    )
                  );
                }
              }).catch(fetchError => {
                console.error('Error reverting lead status:', fetchError);
              });
            });
          }}
        />
      )}

      {selectedLead && (
        <LeadDetailsModal
          isOpen={isLeadDetailsModalOpen}
          onClose={() => setIsLeadDetailsModalOpen(false)}
          lead={selectedLead}
          onLeadUpdated={handleLeadUpdated}
        />
      )}
    </div>
  );
}
