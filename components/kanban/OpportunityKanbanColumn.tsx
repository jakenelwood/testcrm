'use client';

/**
 * OPPORTUNITY KANBAN COLUMN COMPONENT
 *
 * This component renders a single column in the opportunity kanban board.
 * Clean, professional styling matching the previous implementation.
 */

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge } from "@/components/opportunities/StageBadge";
import { type Opportunity } from "@/contexts/opportunity-context";
import { formatCurrency } from "@/lib/utils";
import { Droppable, Draggable, type DraggableProvided, type DraggableStateSnapshot } from "@hello-pangea/dnd";
import React from "react";
import { createPortal } from "react-dom";

interface OpportunityKanbanColumnProps {
  title: string;
  opportunities: Opportunity[];
  onOpportunitySelect: (opportunity: Opportunity) => void;
  stage: string; // display name used as droppable id
}

export function OpportunityKanbanColumn({
  title,
  opportunities,
  onOpportunitySelect,
  stage
}: OpportunityKanbanColumnProps) {

  // Calculate total value for this column
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);

  // @hello-pangea/dnd: use Droppable render-prop below

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Clean Column Header */}
      <div className="mb-3 px-2">
        <h3 className="text-sm font-semibold text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          {title} <span className="text-muted-foreground/80">({opportunities.length})</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {formatCurrency(totalValue || 0)}
        </p>
      </div>

      {/* Clean Column Content */}
      <Droppable droppableId={stage} type="opportunity">
        {(provided, snapshot) => (
          <motion.div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`relative bg-card border rounded-lg p-4 min-h-[500px] transition-all duration-300 shadow-sm ${
              snapshot.isDraggingOver
                ? 'border-2 border-dashed border-blue-500 bg-blue-50/40 shadow-lg scale-[1.02]'
                : 'border-border hover:border-blue-300 hover:shadow-md'
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="space-y-3">
              {opportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 border border-dashed rounded-lg border-border bg-muted/50 p-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No opportunities in {title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Drag opportunities here or add new ones</p>
                </div>
              ) : (
                opportunities.map((opportunity, index) => (
                  <Draggable key={opportunity.id} draggableId={opportunity.id} index={index}>
                    {(providedDraggable, snapshotDraggable) => (
                      <div className="mb-3">
                        <PangeaOpportunityCard
                          opportunity={opportunity}
                          onClick={() => onOpportunitySelect(opportunity)}
                          provided={providedDraggable}
                          snapshot={snapshotDraggable}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          </motion.div>
        )}
      </Droppable>
    </motion.div>
  );
}

// Draggable opportunity card component using @hello-pangea/dnd
interface PangeaOpportunityCardProps {
  opportunity: Opportunity;
  onClick: () => void;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

function PangeaOpportunityCard({ opportunity, onClick, provided, snapshot }: PangeaOpportunityCardProps) {
  // Simple click vs drag detection + 150ms hold-to-hand cursor
  const [isClicking, setIsClicking] = React.useState(false);
  const [isHoldReady, setIsHoldReady] = React.useState(false);
  const mouseDownTimeRef = React.useRef<number>(0);
  const pressTimerRef = React.useRef<number | null>(null);

  const style = {
    ...(provided.draggableProps.style || {}),
    // Keep dragged item above columns while crossing droppables
    zIndex: snapshot.isDragging ? 1000 : 'auto',
    cursor: snapshot.isDragging ? 'grabbing' : (isClicking && isHoldReady ? 'grab' : 'pointer'),
  } as React.CSSProperties;

  // Format date for display
  const formatDateMMDDYYYY = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Determine carrier badge color (matching original LeadCard)
  const getCarrierColor = (carrier: string | null | undefined) => {
    if (!carrier) return "bg-gradient-to-r from-gray-700 to-gray-800 text-white";

    switch (carrier.toLowerCase()) {
      case 'state farm': return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case 'geico': return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case 'progressive': return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case 'allstate': return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  // Get display name (contact name or account name)
  const getDisplayName = () => {
    // Prioritize account name for B2B, then contact name for B2C, then opportunity name
    if (opportunity.account?.name) {
      return opportunity.account.name;
    }
    if (opportunity.contact?.firstName || opportunity.contact?.lastName) {
      const firstName = opportunity.contact.firstName || '';
      const lastName = opportunity.contact.lastName || '';
      return `${firstName} ${lastName}`.trim();
    }
    return opportunity.name || 'Unknown';
  };

  // Get assigned user initial
  const getAssignedUserInitial = () => {
    if (opportunity.owner?.fullName) {
      return opportunity.owner.fullName.charAt(0).toUpperCase();
    }
    if (opportunity.owner?.email) {
      return opportunity.owner.email.charAt(0).toUpperCase();
    }
    return opportunity.ownerId ? 'U' : null;
  };

  // Check if this is a business account
  const isBusinessAccount = () => {
    return opportunity.account?.accountType === 'Business';
  };




  const card = (
    <motion.div
      whileHover={{
        y: -2,
        boxShadow: "0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      layout
    >
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={style}
        id={`opportunity-card-${opportunity.id}`}
        className={`relative bg-card text-card-foreground rounded-lg p-4 cursor-pointer transition-all duration-150 select-none border min-h-[128px] flex flex-col justify-between shadow-sm ${
          snapshot.isDragging
            ? 'opacity-50 shadow-none border-2 border-blue-500 z-50'
            : isHoldReady
              ? 'border-2 border-blue-400'
              : 'border border-border hover:shadow-md hover:border-blue-300'
        }`}
        onMouseDown={(e) => {
          // Prevent text selection and mark click start
          e.preventDefault();
          mouseDownTimeRef.current = Date.now();
          setIsClicking(true);
          // after 150ms of holding, show "hand" (grab) cursor
          if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
          pressTimerRef.current = window.setTimeout(() => setIsHoldReady(true), 150);
        }}
        onMouseUp={(e) => {
          const clickDuration = Date.now() - mouseDownTimeRef.current;
          if (pressTimerRef.current) { window.clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
          // If not part of a drag and it was a quick click, open modal
          if (!e.defaultPrevented && isClicking && clickDuration < 200 && !snapshot.isDragging) {
            onClick();
          }
          setIsClicking(false);
          setIsHoldReady(false);
        }}
        onMouseLeave={() => {
          if (pressTimerRef.current) { window.clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
          setIsClicking(false);
          setIsHoldReady(false);
        }}
      >
        {/* Top section with name and date */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3 gap-2">
            {/* Name section */}
            <div className="flex-1 min-w-0">
              <div
                className="font-medium text-foreground text-base truncate"
                title={getDisplayName()}
              >
                {getDisplayName()}
              </div>
              {isBusinessAccount() && (
                <span className="mt-1 text-xs font-normal text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full inline-block">
                  Business
                </span>
              )}
            </div>

            {/* Assigned user avatar */}
            <div className="flex-shrink-0">
              {getAssignedUserInitial() && (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {getAssignedUserInitial()}
                </div>
              )}
            </div>
          </div>

          {/* Date section */}
          <div className="text-xs text-muted-foreground flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDateMMDDYYYY(opportunity.createdAt)}
          </div>
        </div>

        {/* Bottom section with carrier and premium */}
        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${getCarrierColor(opportunity.currentCarrier)}`}>
              {opportunity.currentCarrier || "No Prior"}
            </span>

            <div className="flex items-center gap-2">
              <StageBadge stage={opportunity.stage} />
              <span className="font-medium text-sm bg-muted text-muted-foreground px-2 py-1 rounded-md border border-border">
                ${opportunity.amount
                  ? Number(opportunity.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Portal the dragging card to the document body to avoid being obscured by other columns
  if (snapshot.isDragging && typeof document !== 'undefined') {
    return createPortal(card, document.body);
  }

  return card;
}
