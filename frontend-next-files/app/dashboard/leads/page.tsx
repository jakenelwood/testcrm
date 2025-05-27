'use client';

/**
 * LEADS PAGE
 *
 * This page implements the lead management interface with a Kanban board.
 * It's one of the core features of the CRM system, allowing users to visualize
 * and manage leads across different stages of the sales pipeline.
 *
 * Written in React (TSX) with Next.js App Router, this page:
 * - Fetches leads from Supabase for the selected pipeline
 * - Implements real-time updates with Supabase subscriptions
 * - Provides search functionality for leads
 * - Implements drag-and-drop for moving leads between statuses
 * - Displays lead details in a modal
 * - Supports multiple pipelines with different statuses
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
 * - Custom components: KanbanBoard, LeadDetailsModal, PipelineSelector
 *
 * DATA FLOW:
 * 1. Fetches pipelines and the selected pipeline's statuses
 * 2. Fetches leads for the selected pipeline
 * 3. Sets up real-time subscription for lead updates
 * 4. Handles search filtering of leads
 * 5. Manages drag-and-drop operations to update lead statuses
 * 6. Opens lead details modal when a lead is clicked
 */

import { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { Lead, LeadStatus, Pipeline, PipelineStatus } from "@/types/lead";
import supabase from '@/utils/supabase/client';
import { fetchLeadsWithRelations, fetchLeadsByPipeline, updateLeadStatus } from '@/utils/lead-api';
import { fetchPipelines, fetchPipelineById, fetchDefaultPipeline, updateLeadPipelineAndStatus } from '@/utils/pipeline-api';
import { LeadListView } from "@/components/leads/LeadListView";
import { PipelineSelector } from "@/components/pipelines/PipelineSelector";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DevelopmentModeBanner } from "@/components/ui/development-mode-banner";

// Component that uses searchParams
function LeadsPageContent() {
  const searchParams = useSearchParams();

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

  // State for pipelines
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);

  // State for the selected pipeline
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);

  // State for loading pipelines
  const [isPipelinesLoading, setIsPipelinesLoading] = useState(true);

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
      // If we have pipeline statuses, use those
      if (selectedPipeline?.statuses) {
        const statusNames = selectedPipeline.statuses.map(s => s.name);
        return statusNames.includes(String(container.id));
      }

      // Otherwise, fall back to default status values
      const defaultStatusValues = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];
      return defaultStatusValues.includes(String(container.id));
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

  // Fetch pipelines and leads
  useEffect(() => {
    const loadPipelines = async () => {
      setIsPipelinesLoading(true);
      try {
        // Fetch all pipelines
        const pipelinesData = await fetchPipelines();
        setPipelines(pipelinesData);

        // Get pipeline ID from URL or use default
        const pipelineIdParam = searchParams.get('pipeline');
        let pipelineToUse: Pipeline | null = null;

        if (pipelineIdParam) {
          // If pipeline ID is in URL, fetch that specific pipeline
          const pipelineId = parseInt(pipelineIdParam);
          pipelineToUse = await fetchPipelineById(pipelineId);
        } else {
          // Otherwise, use the default pipeline
          pipelineToUse = await fetchDefaultPipeline();
        }

        setSelectedPipeline(pipelineToUse);
      } catch (error) {
        console.error('Error loading pipelines:', error);
      } finally {
        setIsPipelinesLoading(false);
      }
    };

    loadPipelines();
  }, [searchParams]);

  // Fetch leads for the selected pipeline
  useEffect(() => {
    if (!selectedPipeline) return;

    const fetchLeads = async () => {
      setIsLoading(true);
      try {
        console.log('Selected pipeline:', selectedPipeline);

        // Use server-side filtering to get leads for this pipeline
        const isDefaultPipeline = selectedPipeline.name === 'Alpha' || selectedPipeline.is_default;
        const leadsData = await fetchLeadsByPipeline(
          selectedPipeline.id,
          isDefaultPipeline // Include null pipeline_id leads for default pipeline
        );

        console.log('Fetched leads with server-side filtering:', leadsData);

        // Set the leads in state immediately
        setLeads(leadsData);
        setFilteredLeads(leadsData);

        // If this is the default pipeline, check for leads without pipeline_id and update them
        if (isDefaultPipeline) {
          // If any leads don't have a pipeline_id, assign them to Alpha
          const leadsToUpdate = leadsData.filter(lead => !lead.pipeline_id);
          if (leadsToUpdate.length > 0) {
            console.log(`Assigning ${leadsToUpdate.length} leads to Alpha pipeline`);

            // Create an array of promises for all updates
            const updatePromises = leadsToUpdate.map(lead => {
              return updateLeadPipelineAndStatus(
                lead.id,
                selectedPipeline.id,
                lead.status_id || 1 // Use existing status_id or default to 1 (New)
              )
              .then(() => {
                // Update the lead in our local state
                lead.pipeline_id = selectedPipeline.id;
                return lead;
              })
              .catch(error => {
                console.error(`Error assigning lead ${lead.id} to Alpha pipeline:`, error);
                // Return a resolved promise to prevent Promise.all from failing
                return Promise.resolve(lead);
              });
            });

            // Process all updates concurrently without waiting
            Promise.all(updatePromises)
              .then(() => {
                console.log('All leads assigned to Alpha pipeline');
              })
              .catch(error => {
                console.error('Error assigning leads to Alpha pipeline:', error);
              });
          }
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        // Always set loading to false after data is loaded
        setIsLoading(false);
      }
    };

    fetchLeads();

    // Set up real-time subscription
    const subscription = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads_ins_info' }, (payload) => {
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
  }, [selectedPipeline]);

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

    if (over && active.id !== over.id && selectedPipeline?.statuses) {
      const leadId = active.id as string;
      const statusName = over.id as string;

      // Find the status in the selected pipeline
      const status = selectedPipeline.statuses.find(s => s.name === statusName);

      if (!status) {
        console.error('Unknown status:', statusName);
        return; // Exit if status is unknown
      }

      const statusId = status.id;

      console.log('Moving lead', leadId, 'to status ID:', statusId);

      // Find the lead being updated
      const leadToUpdate = leads.find(lead => lead.id === leadId);
      if (!leadToUpdate) {
        console.error('Lead not found:', leadId);
        return;
      }

      // Update lead status in state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId ? { ...lead, status: statusName } : lead
        )
      );

      try {
        // Use the updateLeadPipelineAndStatus function from pipeline-api.ts
        await updateLeadPipelineAndStatus(leadId, selectedPipeline.id, statusId);
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

  // Handle pipeline change
  const handlePipelineChange = (pipelineId: number) => {
    // Find the pipeline
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      setSelectedPipeline(pipeline);

      // Update URL with the pipeline ID
      const url = new URL(window.location.href);
      url.searchParams.set('pipeline', pipelineId.toString());
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <div className="mx-auto py-6 px-2 sm:px-4 max-w-none">
      {/* Development Mode Banner */}
      <DevelopmentModeBanner
        message="Connected to Supabase database. Some tables may be missing or have permission issues."
        onRefresh={() => window.location.reload()}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">
            {selectedPipeline ? selectedPipeline.name : 'Pipeline'}
          </h1>

          {/* Pipeline Selector */}
          {!isPipelinesLoading && pipelines.length > 0 && selectedPipeline && (
            <PipelineSelector
              pipelines={pipelines}
              selectedPipelineId={selectedPipeline.id}
              onPipelineChange={handlePipelineChange}
              isLoading={isPipelinesLoading}
            />
          )}
        </div>

        <Button
          asChild
          className="bg-[#0047AB] hover:bg-[#003d91] text-white"
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
          {selectedPipeline?.statuses ? (
            <KanbanBoard
              leads={filteredLeads}
              isLoading={isLoading || isPipelinesLoading}
              onLeadSelect={handleLeadSelect}
              statuses={selectedPipeline.statuses}
            />
          ) : (
            <div className="text-center py-10">
              {isPipelinesLoading ? 'Loading pipeline...' : 'No pipeline statuses found'}
            </div>
          )}

          <DragOverlay dropAnimation={{
            duration: 300,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            scale: 0.98,
          }}>
            {activeLead ? (
              <div className="bg-card rounded-md shadow-xl p-4 w-[calc(100%-2rem)] max-w-[300px] border-2 border-blue-500 rotate-1 scale-105 select-none">
                <div className="font-medium text-card-foreground">
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
          isLoading={isLoading || isPipelinesLoading}
          onLeadSelect={handleLeadSelect}
          onStatusChange={(leadId, newStatus) => {
            if (!selectedPipeline?.statuses) return;

            // Find the status in the selected pipeline
            const status = selectedPipeline.statuses.find(s => s.name === newStatus);
            if (!status) {
              console.error('Unknown status:', newStatus);
              return;
            }

            // Update lead status in state
            setLeads((prevLeads) =>
              prevLeads.map((lead) =>
                lead.id === leadId ? { ...lead, status: newStatus } : lead
              )
            );

            // Update lead status in database
            updateLeadPipelineAndStatus(leadId, selectedPipeline.id, status.id).catch(error => {
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
          statuses={selectedPipeline?.statuses || []}
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

// Wrap the component that uses searchParams in a Suspense boundary
export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
        <p className="text-muted-foreground">Please wait while we prepare your leads.</p>
      </div>
    </div>}>
      <LeadsPageContent />
    </Suspense>
  );
}
