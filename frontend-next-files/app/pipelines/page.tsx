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
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Pipeline Management</h1>
          <p className="text-gray-500">Create and manage your sales pipelines</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/leads')}
          variant="outline"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Back to Leads
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pipeline List */}
        <div className="md:col-span-1">
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
            <CardHeader className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">Pipelines</CardTitle>
              <CardDescription className="text-gray-500">Manage your sales pipelines</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-3 py-2">
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
            <CardFooter className="border-t border-gray-100 bg-gray-50 p-4">
              <Button
                onClick={handleCreateNew}
                variant="gradient"
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" /> New Pipeline
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Pipeline Editor */}
        <div className="md:col-span-3">
          {isLoading ? (
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
              <CardHeader className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="p-6">
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
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
              <CardContent className="p-12">
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Pipeline Selected</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Select a pipeline from the list to edit or create a new one to get started
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    variant="gradient"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create New Pipeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
