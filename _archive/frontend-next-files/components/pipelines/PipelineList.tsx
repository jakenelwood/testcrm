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
      <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg border">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <span className="text-muted-foreground text-lg">📋</span>
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
        <div
          key={pipeline.id}
          className={`w-full border rounded-md transition-all duration-200 cursor-pointer ${
            selectedPipelineId === pipeline.id
              ? "bg-primary text-primary-foreground shadow-md border-primary"
              : "border-border hover:bg-accent hover:text-accent-foreground"
          }`}
          onClick={() => onSelect(pipeline.id)}
        >
          <div className="flex items-center justify-between w-full p-3">
            <div className="flex flex-col">
              <span className="truncate font-medium">
                {pipeline.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {pipeline.lead_type} Leads
              </span>
            </div>
            <div className="flex items-center">
              {!pipeline.is_default && (
                <Button
                  variant={selectedPipelineId === pipeline.id ? "outline" : "secondary"}
                  size="sm"
                  className="h-7 px-2 mr-1"
                  onClick={(e) => handleSetAsDefault(e, pipeline)}
                  title="Set as default pipeline"
                >
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="ml-1 text-xs">Set Default</span>
                </Button>
              )}
              {pipeline.is_default && (
                <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
