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
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <span className="text-gray-400 text-lg">📋</span>
          </div>
          <p className="font-medium">No pipelines found</p>
          <p className="text-sm mt-1">Create your first pipeline to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pipelines.map((pipeline) => (
        <Button
          key={pipeline.id}
          variant={selectedPipelineId === pipeline.id ? "gradient" : "outline"}
          className={`w-full justify-start transition-all duration-200 ${
            selectedPipelineId === pipeline.id
              ? "text-white shadow-md"
              : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
          }`}
          onClick={() => onSelect(pipeline.id)}
        >
          <div className="flex items-center justify-between w-full">
            <span className="truncate font-medium">{pipeline.name}</span>
            {pipeline.is_default && (
              <Badge variant="outline" className={`ml-2 ${
                selectedPipelineId === pipeline.id
                  ? "bg-blue-500/20 text-white border-white/20"
                  : "bg-green-50 text-green-600 border-green-200"
              }`}>
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
