'use client';

import { useState } from 'react';
import { PipelineStatus } from "@/types/lead";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Filter, X, Check } from "lucide-react";
import { getStatusStyles } from "@/utils/status-styles";
import { Badge } from "@/components/ui/badge";

interface StatusFilterProps {
  statuses: PipelineStatus[];
  selectedStatuses: string[];
  onStatusFilterChange: (statuses: string[]) => void;
}

export function StatusFilter({ statuses, selectedStatuses, onStatusFilterChange }: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusToggle = (statusName: string) => {
    const newSelectedStatuses = selectedStatuses.includes(statusName)
      ? selectedStatuses.filter(s => s !== statusName)
      : [...selectedStatuses, statusName];
    
    onStatusFilterChange(newSelectedStatuses);
  };

  const handleClearAll = () => {
    onStatusFilterChange([]);
  };

  const handleSelectAll = () => {
    onStatusFilterChange(statuses.map(s => s.name));
  };

  const isStatusSelected = (statusName: string) => {
    return selectedStatuses.includes(statusName);
  };

  const hasActiveFilters = selectedStatuses.length > 0 && selectedStatuses.length < statuses.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`relative ${hasActiveFilters ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Status
          {hasActiveFilters && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500 text-white"
            >
              {selectedStatuses.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          Filter by Status
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSelectAll} className="text-sm">
          <Check className="h-4 w-4 mr-2" />
          Select All
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {statuses.map((status) => {
          const isSelected = isStatusSelected(status.name);
          return (
            <DropdownMenuItem
              key={status.id}
              onClick={() => handleStatusToggle(status.name)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${getStatusStyles(status.name, 'default')}`}
                />
                <span>{status.name}</span>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-blue-500" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
