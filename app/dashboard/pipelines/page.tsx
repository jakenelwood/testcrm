'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pipeline } from "@/types/lead";
import { PipelineEditor } from "@/components/pipelines/PipelineEditor";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelines } from "@/contexts/pipeline-context";
import { Plus } from "lucide-react";

export default function PipelinesPage() {
  const { pipelines, isLoading, updatePipeline, addPipeline, removePipeline } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { toast } = useToast();

  // Select the first pipeline by default if none is selected and pipelines are loaded
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId && !isLoading && pipelines[0]?.id) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId, isLoading]);

  // Handle pipeline selection
  const handlePipelineSelect = (pipelineId: number) => {
    setSelectedPipelineId(pipelineId);
    setIsCreatingNew(false);
  };

  // Handle creating a new pipeline
  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedPipelineId(null);
  };

  // Handle pipeline update
  const handlePipelineUpdated = (updatedPipeline: Pipeline) => {
    updatePipeline(updatedPipeline);
    toast({
      title: "Success",
      description: `Pipeline "${updatedPipeline.name}" updated successfully.`
    });
  };

  // Handle pipeline creation
  const handlePipelineCreated = (newPipeline: Pipeline) => {
    addPipeline(newPipeline);
    setSelectedPipelineId(newPipeline.id);
    setIsCreatingNew(false);
    toast({
      title: "Success",
      description: `Pipeline "${newPipeline.name}" created successfully.`
    });
  };

  // Handle pipeline deletion
  const handlePipelineDeleted = (pipelineId: number) => {
    removePipeline(pipelineId);
    setSelectedPipelineId(null);
    toast({
      title: "Success",
      description: "Pipeline deleted successfully."
    });
  };

  // Get the selected pipeline
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Management</h1>
          <p className="text-muted-foreground">Create and manage your sales pipelines</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Pipeline
        </Button>
      </div>

      <div className="space-y-6">
        {/* Pipeline Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Pipeline</CardTitle>
            <CardDescription>Choose a pipeline to edit or manage its statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : pipelines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pipelines found. Create your first pipeline to get started.</p>
              </div>
            ) : (
              <Select
                value={selectedPipelineId?.toString() || ""}
                onValueChange={(value) => handlePipelineSelect(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a pipeline to manage" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                      {pipeline.name}{pipeline.is_default ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Editor */}
        <div>
          {isCreatingNew ? (
            <PipelineEditor
              mode="create"
              onPipelineCreated={handlePipelineCreated}
              onCancel={() => setIsCreatingNew(false)}
            />
          ) : selectedPipeline ? (
            <PipelineEditor
              mode="edit"
              pipeline={selectedPipeline}
              onPipelineUpdated={handlePipelineUpdated}
              onPipelineDeleted={handlePipelineDeleted}
            />
          ) : !isLoading && pipelines.length > 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Pipeline Selected</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Select a pipeline from the dropdown above to edit or manage its statuses
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
