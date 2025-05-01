'use client';

import { Pipeline } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface PipelineListProps {
  pipelines: Pipeline[];
  selectedPipelineId: number | null;
  onSelect: (pipelineId: number) => void;
}

export function PipelineList({ pipelines, selectedPipelineId, onSelect }: PipelineListProps) {
  if (pipelines.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No pipelines found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pipelines.map((pipeline) => (
        <Button
          key={pipeline.id}
          variant={selectedPipelineId === pipeline.id ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onSelect(pipeline.id)}
        >
          <div className="flex items-center justify-between w-full">
            <span className="truncate">{pipeline.name}</span>
            {pipeline.is_default && (
              <Badge variant="outline" className="ml-2 bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
          </div>
        </Button>
      ))}
    </div>
  );
}
