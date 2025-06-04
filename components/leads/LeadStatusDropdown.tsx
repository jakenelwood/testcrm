'use client';

import { useState } from 'react';
import { LeadStatus, PipelineStatus } from "@/types/lead";
import { useToast } from "@/components/ui/use-toast";
import supabase from '@/utils/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { getStatusStyles, getCustomStatusStyles, statusBadgeStyles } from "@/utils/status-styles";

interface LeadStatusDropdownProps {
  leadId: string;
  currentStatus: string;
  onStatusChange: (leadId: string, newStatus: string) => void;
  statuses?: PipelineStatus[];
  useColoredBadge?: boolean;
}

export function LeadStatusDropdown({ leadId, currentStatus, onStatusChange, statuses = [], useColoredBadge = false }: LeadStatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Define default statuses if none are provided
  const defaultStatuses: LeadStatus[] = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];

  // Use provided statuses or fall back to default
  const statusOptions = statuses.length > 0
    ? statuses.map(s => s.name)
    : defaultStatuses;

  // Get status color using centralized styling
  const getStatusColor = (status: string) => {
    // If we have pipeline statuses with color_hex, use those
    const pipelineStatus = statuses.find(s => s.name === status);
    if (pipelineStatus?.color_hex) {
      return getCustomStatusStyles(pipelineStatus.color_hex, useColoredBadge ? 'default' : 'kanban');
    }

    // Otherwise, fall back to default colors
    return getStatusStyles(status, useColoredBadge ? 'default' : 'kanban');
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      // Find the status in the pipeline statuses
      let statusId: number;

      if (statuses.length > 0) {
        // If we have pipeline statuses, find the matching one
        const pipelineStatus = statuses.find(s => s.name === newStatus);
        if (!pipelineStatus) {
          console.error('Status not found in pipeline:', newStatus);
          toast({
            title: "Error",
            description: `Status "${newStatus}" not found in pipeline.`,
            variant: "destructive"
          });
          return;
        }
        statusId = pipelineStatus.id;
      } else {
        // Fall back to default status IDs
        switch (newStatus) {
          case 'New': statusId = 1; break;
          case 'Contacted': statusId = 2; break;
          case 'Quoted': statusId = 3; break;
          case 'Sold': statusId = 4; break;
          case 'Lost': statusId = 5; break;
          default:
            console.error('Unknown status:', newStatus);
            return;
        }
      }

      // Call the onStatusChange callback to update the UI
      // We do this first for a more responsive UI experience
      onStatusChange(leadId, newStatus);

      // The actual database update will be handled by the parent component
      // which has access to the pipeline_id as well
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get the appropriate style for the current status
  const getStatusStyle = (status: string) => {
    // Handle special case for "Quoted" status
    if (status === 'Quoted') {
      return 'bg-purple-50 text-black font-medium dark:bg-purple-900/20 dark:text-black';
    }

    // Use the general status styles function for other statuses
    return getStatusStyles(status);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={isUpdating}>
        <div className={`inline-flex items-center cursor-pointer ${statusBadgeStyles} ${getStatusStyle(currentStatus)}`}>
          {currentStatus} <ChevronDown className="ml-1 h-3 w-3" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status}
            className={status === currentStatus ? 'bg-muted font-medium' : ''}
            onClick={() => handleStatusChange(status)}
            disabled={isUpdating}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusStyles(status, 'default')}`} />
            {status}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
