'use client';

import { Pipeline } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Star } from "lucide-react";
import { updatePipeline } from "@/utils/pipeline-api";
import { useToast } from "@/components/ui/use-toast";

interface PipelineListProps {
  pipelines: Pipeline[];
  selectedPipelineId: number | null;
  onSelect: (pipelineId: number) => void;
  onPipelineUpdated?: (pipeline: Pipeline) => void;
}

export function PipelineList({
  pipelines,
  selectedPipelineId,
  onSelect,
  onPipelineUpdated
}: PipelineListProps) {
  const { toast } = useToast();

  // Handle setting a pipeline as default
  const handleSetAsDefault = async (e: React.MouseEvent, pipeline: Pipeline) => {
    e.stopPropagation(); // Prevent selecting the pipeline

    try {
      // Update the pipeline to be the default
      const updatedPipeline = await updatePipeline(pipeline.id, {
        is_default: true
      });

      // Notify parent component
      onPipelineUpdated?.(updatedPipeline);

      toast({
        title: "Success",
        description: `"${pipeline.name}" is now the default pipeline.`
      });
    } catch (error) {
      console.error('Error setting pipeline as default:', error);
      toast({
        title: "Error",
        description: "Failed to set pipeline as default. Please try again.",
        variant: "destructive"
      });
    }
  };
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
            <div className="flex items-center">
              {!pipeline.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 mr-1 ${
                    selectedPipelineId === pipeline.id
                      ? "text-white hover:text-white hover:bg-blue-600/30"
                      : "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  }`}
                  onClick={(e) => handleSetAsDefault(e, pipeline)}
                  title="Set as default pipeline"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs">Set Default</span>
                </Button>
              )}
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
          </div>
        </Button>
      ))}
    </div>
  );
}
