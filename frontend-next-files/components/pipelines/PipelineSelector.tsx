'use client';

import { useState, useEffect } from 'react';
import { Pipeline } from "@/types/lead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

interface PipelineSelectorProps {
  pipelines: Pipeline[];
  selectedPipelineId: number;
  onPipelineChange: (pipelineId: number) => void;
  isLoading?: boolean;
}

export function PipelineSelector({ 
  pipelines, 
  selectedPipelineId, 
  onPipelineChange,
  isLoading = false
}: PipelineSelectorProps) {
  const router = useRouter();
  
  // Handle pipeline change
  const handlePipelineChange = (value: string) => {
    onPipelineChange(parseInt(value));
  };

  // Navigate to pipeline management
  const handleManagePipelines = () => {
    router.push('/pipelines');
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <Select
          value={selectedPipelineId.toString()}
          onValueChange={handlePipelineChange}
          disabled={isLoading || pipelines.length === 0}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                {pipeline.name}
                {pipeline.is_default && " (Default)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleManagePipelines}
        title="Manage Pipelines"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
