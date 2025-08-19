'use client';

/**
 * OPPORTUNITY KANBAN BOARD COMPONENT
 *
 * This component implements a Kanban-style board for visualizing and managing opportunities
 * using the unified schema approach. Features smooth framer motion animations and proper
 * visual lane separation for an enhanced user experience.
 *
 * Features:
 * - Uses opportunities from the unified schema
 * - Groups opportunities by stage into kanban columns
 * - Smooth framer motion animations
 * - Visual lane separation with proper styling
 * - Responsive design with horizontal scrolling
 * - Loading states and error handling
 */

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpportunities, type Opportunity } from "@/contexts/opportunity-context";
import { OpportunityKanbanColumn } from "./OpportunityKanbanColumn";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useState } from "react";

interface OpportunityKanbanBoardProps {
  onOpportunitySelect?: (opportunity: Opportunity) => void;
}

export function OpportunityKanbanBoard({ onOpportunitySelect }: OpportunityKanbanBoardProps) {
  const { opportunities, isLoading, getKanbanColumns, updateOpportunity } = useOpportunities();

  // No custom sensors needed in @hello-pangea/dnd

  // Collision detection is handled by @hello-pangea/dnd; no custom logic needed
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="overflow-x-auto">
          <div className="flex gap-4 p-4 min-w-max">
            {/* Render skeleton columns */}
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="min-w-[280px] flex-shrink-0">
                <div className="flex flex-col">
                  {/* Column Header */}
                  <div className="mb-3 px-2">
                    <Skeleton className="h-5 w-28" />
                  </div>

                  {/* Column Content */}
                  <div className="bg-card border border-border rounded-lg p-4 min-h-[500px] shadow-sm">
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, cardIndex) => (
                        <Skeleton key={cardIndex} className="h-24 w-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get kanban columns with opportunities grouped by stage
  const columns = getKanbanColumns();

  // Handle opportunity selection
  const handleOpportunitySelect = (opportunity: Opportunity) => {
    onOpportunitySelect?.(opportunity);
  };

  const handleDragStart = (start: { draggableId: string }) => {
    // Optional: set the active item (not used for overlay anymore)
    const opp = opportunities.find(o => o.id === start.draggableId);
    if (opp) setActiveOpportunity(opp);
    if (typeof document !== 'undefined') document.body.classList.add('dragging');
  };

  // Handle drop: update opportunity stage if moved to a new column
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const oppId = draggableId;
    const newStageKey = destination.droppableId;

    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    if (newStageKey && opp.stage !== (newStageKey as any)) {
      await updateOpportunity(oppId, { stage: newStageKey as any });
    }
    setActiveOpportunity(null);
    if (typeof document !== 'undefined') document.body.classList.remove('dragging');
  };

  // Render the kanban board with clean professional styling
  return (
    <DragDropContext onBeforeDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full overflow-y-auto">
        <div className="overflow-x-auto">
          <div className="flex gap-4 p-4 min-w-max">
            {columns.map((column) => (
              <div key={column.stage} className="min-w-[280px] w-[280px] flex-shrink-0">
                <OpportunityKanbanColumn
                  title={column.displayName}
                  opportunities={column.opportunities}
                  onOpportunitySelect={handleOpportunitySelect}
                  stage={column.stage}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* @hello-pangea/dnd does not use a DragOverlay */}
      {null}
    </DragDropContext>
  );
}
