'use client';

import { useState } from 'react';
import { LeadStatus } from "@/types/lead";
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
  currentStatus: LeadStatus;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

export function LeadStatusDropdown({ leadId, currentStatus, onStatusChange }: LeadStatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  // Define all possible statuses
  const statuses: LeadStatus[] = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];
  
  // Get status color
  const getStatusColor = (status: LeadStatus) => {
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
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdating(true);
    try {
      // Get the status ID based on the status name
      let statusId = 1; // Default to "New" (ID: 1)
      switch (newStatus) {
        case 'New': statusId = 1; break;
        case 'Contacted': statusId = 2; break;
        case 'Quoted': statusId = 3; break;
        case 'Sold': statusId = 4; break;
        case 'Lost': statusId = 5; break;
      }
      
      // Update lead status in Supabase
      const { error } = await supabase
        .from('leads')
        .update({ 
          status_id: statusId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead status:', error);
        toast({
          title: "Error",
          description: `Failed to update status: ${error.message}`,
          variant: "destructive"
        });
      } else {
        // Call the onStatusChange callback to update the UI
        onStatusChange(leadId, newStatus);
        toast({
          title: "Success",
          description: `Lead status updated to ${newStatus}`,
        });
      }
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
        {statuses.map((status) => (
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
