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

interface LeadStatusDropdownProps {
  leadId: string;
  currentStatus: string;
  onStatusChange: (leadId: string, newStatus: string) => void;
  statuses?: PipelineStatus[];
}

export function LeadStatusDropdown({ leadId, currentStatus, onStatusChange, statuses = [] }: LeadStatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Define default statuses if none are provided
  const defaultStatuses: LeadStatus[] = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];

  // Use provided statuses or fall back to default
  const statusOptions = statuses.length > 0
    ? statuses.map(s => s.name)
    : defaultStatuses;

  // Get status color
  const getStatusColor = (status: string) => {
    // If we have pipeline statuses with color_hex, use those
    const pipelineStatus = statuses.find(s => s.name === status);
    if (pipelineStatus?.color_hex) {
      const color = pipelineStatus.color_hex;
      // Create a lighter version for the background
      return `bg-opacity-20 bg-[${color}] text-[${color}] dark:bg-opacity-30 dark:text-opacity-90`;
    }

    // Otherwise, fall back to default colors
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Quoted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Sold':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Lost':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <Button
          variant="ghost"
          className={`px-2.5 py-1 h-auto text-xs font-medium rounded-full ${getStatusColor(currentStatus)}`}
        >
          {currentStatus} <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status}
            className={status === currentStatus ? 'bg-muted font-medium' : ''}
            onClick={() => handleStatusChange(status)}
            disabled={isUpdating}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(status)}`} />
            {status}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
