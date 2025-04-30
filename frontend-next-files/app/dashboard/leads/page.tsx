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
import { Search } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { LeadDetailsModal } from "@/components/kanban/LeadDetailsModal";
import { Lead, LeadStatus } from "@/types/lead";
import supabase from '@/utils/supabase/client';

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Increase the activation distance to make it easier to start dragging
      activationConstraint: {
        distance: 5, // Small distance to differentiate between click and drag
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection that combines multiple strategies for a more forgiving UI
  const customCollisionDetection: CollisionDetection = ({
    droppableContainers,
    droppableRects,
    collisionRect,
    ...args
  }) => {
    // First try pointerWithin which is more forgiving
    const pointerCollisions = pointerWithin({
      droppableContainers,
      droppableRects,
      collisionRect,
      ...args
    });

    // If we have pointerCollisions, return those
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

    // If we have rectCollisions, return those
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

  // Fetch leads from Supabase
  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
      } else {
        setLeads(data || []);
        setFilteredLeads(data || []);
      }
      setIsLoading(false);
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
      subscription.unsubscribe();
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
    }
  };

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset active lead regardless of outcome
    setActiveLead(null);

    if (over && active.id !== over.id) {
      const leadId = active.id as string;

      // Get the status from the column ID, ensuring it matches the database constraint
      // The database constraint is case-sensitive and expects 'New', 'Contacted', etc.
      let newStatus: LeadStatus;

      // Map the column ID to the exact status string expected by the database
      switch (over.id) {
        case 'New':
          newStatus = 'New';
          break;
        case 'Contacted':
          newStatus = 'Contacted';
          break;
        case 'Quoted':
          newStatus = 'Quoted';
          break;
        case 'Sold':
          newStatus = 'Sold';
          break;
        case 'Lost':
          newStatus = 'Lost';
          break;
        default:
          console.error('Unknown status:', over.id);
          return; // Exit if status is unknown
      }

      // Log for debugging
      console.log('Dragging lead', leadId, 'to status:', newStatus);

      // Update lead status in state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );

      // Update lead status in Supabase
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead status:', error.message, error.details, error.hint);
        // Revert the state change if the update fails
        try {
          const { data, error: selectError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

          if (selectError) {
            console.error('Error fetching original lead status:', selectError.message);
          } else if (data) {
            setLeads((prevLeads) =>
              prevLeads.map((lead) =>
                lead.id === leadId ? { ...lead, status: data.status } : lead
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
          className="bg-[#2182E0] hover:bg-[#045AC3] text-white"
        >
          <Link href="/dashboard/new">
            New Lead
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
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

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        // Add a small delay before starting to drag to differentiate between click and drag
        measuring={{
          droppable: {
            strategy: 'always' // Always measure to ensure accurate collision detection
          }
        }}
      >
        <KanbanBoard
          leads={filteredLeads}
          isLoading={isLoading}
          onLeadSelect={handleLeadSelect}
        />

        <DragOverlay>
          {activeLead ? (
            <div className="bg-white dark:bg-zinc-800 rounded-md shadow-lg p-4 w-[calc(100%-2rem)] max-w-[300px] border-2 border-blue-500">
              <div className="font-medium text-foreground dark:text-white">
                {activeLead.first_name} {activeLead.last_name}
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

      {/* Add Lead modal removed in favor of direct navigation */}

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
