'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pipeline } from "@/types/lead";
import { fetchPipelines } from "@/utils/pipeline-api";
import { PipelineEditor } from "@/components/pipelines/PipelineEditor";
import { PipelineList } from "@/components/pipelines/PipelineList";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch pipelines on component mount
  useEffect(() => {
    const loadPipelines = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPipelines();
        setPipelines(data);
        
        // Select the first pipeline by default if none is selected
        if (data.length > 0 && !selectedPipelineId) {
          setSelectedPipelineId(data[0].id);
        }
      } catch (error) {
        console.error('Error loading pipelines:', error);
        toast({
          title: "Error",
          description: "Failed to load pipelines. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPipelines();
  }, [selectedPipelineId, toast]);

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
    setPipelines(prev => 
      prev.map(p => p.id === updatedPipeline.id ? updatedPipeline : p)
    );
    toast({
      title: "Success",
      description: `Pipeline "${updatedPipeline.name}" updated successfully.`
    });
  };

  // Handle pipeline creation
  const handlePipelineCreated = (newPipeline: Pipeline) => {
    setPipelines(prev => [...prev, newPipeline]);
    setSelectedPipelineId(newPipeline.id);
    setIsCreatingNew(false);
    toast({
      title: "Success",
      description: `Pipeline "${newPipeline.name}" created successfully.`
    });
  };

  // Handle pipeline deletion
  const handlePipelineDeleted = (pipelineId: number) => {
    setPipelines(prev => prev.filter(p => p.id !== pipelineId));
    setSelectedPipelineId(null);
    toast({
      title: "Success",
      description: "Pipeline deleted successfully."
    });
  };

  // Get the selected pipeline
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pipeline Management</h1>
        <Button 
          onClick={() => router.push('/leads')}
          variant="outline"
        >
          Back to Leads
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pipeline List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pipelines</CardTitle>
              <CardDescription>Manage your sales pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <PipelineList 
                  pipelines={pipelines}
                  selectedPipelineId={selectedPipelineId}
                  onSelect={handlePipelineSelect}
                />
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateNew}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> New Pipeline
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Pipeline Editor */}
        <div className="md:col-span-3">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : isCreatingNew ? (
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
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  Select a pipeline to edit or create a new one
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
