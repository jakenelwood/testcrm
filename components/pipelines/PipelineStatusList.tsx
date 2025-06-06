'use client';

import { useState } from 'react';
import { PipelineStatus } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PipelineStatusListProps {
  statuses: PipelineStatus[];
  selectedStatusId: number | null;
  onSelect: (statusId: number) => void;
  onReorder: (statusIds: number[]) => void;
}

export function PipelineStatusList({
  statuses,
  selectedStatusId,
  onSelect,
  onReorder
}: PipelineStatusListProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStatus, setDraggedStatus] = useState<PipelineStatus | null>(null);
  const { toast } = useToast();

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, status: PipelineStatus) => {
    setIsDragging(true);
    setDraggedStatus(status);

    // Set the drag image and data
    e.dataTransfer.setData('text/plain', status.id.toString());
    e.dataTransfer.effectAllowed = 'move';

    // Create a ghost image
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('bg-primary', 'text-primary-foreground', 'p-2', 'rounded');
    ghostElement.textContent = status.name;
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);

    // Remove the ghost element after drag starts
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: PipelineStatus) => {
    e.preventDefault();

    if (!draggedStatus || draggedStatus.id === targetStatus.id) {
      setIsDragging(false);
      setDraggedStatus(null);
      return;
    }

    // Reorder the statuses
    const reorderedStatuses = [...statuses];
    const draggedIndex = reorderedStatuses.findIndex(s => s.id === draggedStatus.id);
    const targetIndex = reorderedStatuses.findIndex(s => s.id === targetStatus.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove the dragged status
      const [removed] = reorderedStatuses.splice(draggedIndex, 1);
      // Insert it at the target position
      reorderedStatuses.splice(targetIndex, 0, removed);

      // Get the IDs in the new order
      const statusIds = reorderedStatuses.map(s => s.id);

      // Call the onReorder callback
      onReorder(statusIds);
    }

    setIsDragging(false);
    setDraggedStatus(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedStatus(null);
  };

  if (statuses.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No stages found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {statuses.map((status) => (
        <div
          key={status.id}
          draggable
          onDragStart={(e) => handleDragStart(e, status)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
          onDragEnd={handleDragEnd}
          className={`
            flex items-center border rounded-md overflow-hidden
            ${isDragging && draggedStatus?.id === status.id ? 'opacity-50' : ''}
            ${selectedStatusId === status.id ? 'border-primary' : 'border-border'}
          `}
        >
          <div className="p-2 cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          <Button
            variant="ghost"
            className="flex-1 justify-start h-auto py-2 px-3"
            onClick={() => onSelect(status.id)}
          >
            <div className="flex items-center space-x-2">
              {status.color_hex && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color_hex }}
                />
              )}
              <span className="truncate">{status.name}</span>
              {status.is_final && (
                <Badge variant="outline" className="ml-1 bg-green-50">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Final
                </Badge>
              )}
            </div>
          </Button>
        </div>
      ))}
    </div>
  );
}
