'use client';

import { useState, useEffect } from 'react';
import { Pipeline, PipelineStatus } from "@/types/lead";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  createPipeline,
  updatePipeline,
  deletePipeline,
  createPipelineStatus,
  updatePipelineStatus,
  deletePipelineStatus,
  reorderPipelineStatuses
} from "@/utils/pipeline-api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PipelineStatusList } from "./PipelineStatusList";
import { PipelineStatusEditor } from "./PipelineStatusEditor";
import { Trash2, Save, Plus } from "lucide-react";

interface PipelineEditorProps {
  mode: 'create' | 'edit';
  pipeline?: Pipeline;
  onPipelineCreated?: (pipeline: Pipeline) => void;
  onPipelineUpdated?: (pipeline: Pipeline) => void;
  onPipelineDeleted?: (pipelineId: number) => void;
  onCancel?: () => void;
}

export function PipelineEditor({
  mode,
  pipeline,
  onPipelineCreated,
  onPipelineUpdated,
  onPipelineDeleted,
  onCancel
}: PipelineEditorProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [isCreatingStatus, setIsCreatingStatus] = useState(false);
  const { toast } = useToast();

  // Initialize form data when pipeline changes
  useEffect(() => {
    if (mode === 'edit' && pipeline) {
      setFormData({
        name: pipeline.name,
        description: pipeline.description || '',
        is_default: pipeline.is_default
      });
    }
  }, [mode, pipeline]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (mode === 'create') {
        // Create new pipeline
        const newPipeline = await createPipeline({
          name: formData.name,
          description: formData.description,
          is_default: formData.is_default,
          display_order: 999 // Will be ordered last by default
        });

        onPipelineCreated?.(newPipeline);
      } else if (mode === 'edit' && pipeline) {
        // Update existing pipeline
        const updatedPipeline = await updatePipeline(pipeline.id, {
          name: formData.name,
          description: formData.description,
          is_default: formData.is_default
        });

        onPipelineUpdated?.(updatedPipeline);
      }
    } catch (error) {
      console.error('Error saving pipeline:', error);
      toast({
        title: "Error",
        description: "Failed to save pipeline. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!pipeline) return;

    try {
      setIsDeleting(true);
      await deletePipeline(pipeline.id);
      onPipelineDeleted?.(pipeline.id);
    } catch (error: any) {
      console.error('Error deleting pipeline:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete pipeline. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle status selection
  const handleStatusSelect = (statusId: number) => {
    setSelectedStatusId(statusId);
    setIsCreatingStatus(false);
  };

  // Handle creating a new status
  const handleCreateStatus = () => {
    setIsCreatingStatus(true);
    setSelectedStatusId(null);
  };

  // Handle status creation
  const handleStatusCreated = (status: PipelineStatus) => {
    if (pipeline) {
      // Add the new status to the pipeline's statuses
      const updatedPipeline = {
        ...pipeline,
        statuses: [...(pipeline.statuses || []), status]
      };

      // Sort statuses by display_order
      updatedPipeline.statuses?.sort((a, b) => a.display_order - b.display_order);

      onPipelineUpdated?.(updatedPipeline);
      setSelectedStatusId(status.id);
      setIsCreatingStatus(false);
    }
  };

  // Handle status update
  const handleStatusUpdated = (status: PipelineStatus) => {
    if (pipeline && pipeline.statuses) {
      // Update the status in the pipeline's statuses
      const updatedStatuses = pipeline.statuses.map(s =>
        s.id === status.id ? status : s
      );

      const updatedPipeline = {
        ...pipeline,
        statuses: updatedStatuses
      };

      onPipelineUpdated?.(updatedPipeline);
    }
  };

  // Handle status deletion
  const handleStatusDeleted = (statusId: number) => {
    if (pipeline && pipeline.statuses) {
      // Remove the status from the pipeline's statuses
      const updatedStatuses = pipeline.statuses.filter(s => s.id !== statusId);

      const updatedPipeline = {
        ...pipeline,
        statuses: updatedStatuses
      };

      onPipelineUpdated?.(updatedPipeline);
      setSelectedStatusId(null);
    }
  };

  // Handle status reordering
  const handleStatusReorder = async (statusIds: number[]) => {
    if (!pipeline) return;

    try {
      await reorderPipelineStatuses(pipeline.id, statusIds);

      // Reorder the statuses in the pipeline
      const reorderedStatuses = statusIds.map((id, index) => {
        const status = pipeline.statuses?.find(s => s.id === id);
        return status ? { ...status, display_order: index + 1 } : null;
      }).filter(Boolean) as PipelineStatus[];

      const updatedPipeline = {
        ...pipeline,
        statuses: reorderedStatuses
      };

      onPipelineUpdated?.(updatedPipeline);
    } catch (error) {
      console.error('Error reordering statuses:', error);
      toast({
        title: "Error",
        description: "Failed to reorder statuses. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get the selected status
  const selectedStatus = pipeline?.statuses?.find(s => s.id === selectedStatusId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create New Pipeline' : 'Edit Pipeline'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Create a new pipeline for your leads'
            : 'Edit pipeline details and manage statuses'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Pipeline Details</TabsTrigger>
            {mode === 'edit' && <TabsTrigger value="statuses">Pipeline Statuses</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pipeline Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Sales Pipeline, Support Pipeline"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the purpose of this pipeline"
                rows={3}
              />
            </div>

            <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">Default Pipeline</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Make this the default pipeline for new leads
                  </p>
                </div>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => handleSwitchChange('is_default', checked)}
                  className={formData.is_default ? "bg-green-600 data-[state=checked]:bg-green-600" : ""}
                />
              </div>
            </div>
          </TabsContent>

          {mode === 'edit' && (
            <TabsContent value="statuses" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status List */}
                <div className="md:col-span-1">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Pipeline Statuses</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCreateStatus}
                        className="h-8"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>

                    {pipeline?.statuses && pipeline.statuses.length > 0 ? (
                      <PipelineStatusList
                        statuses={pipeline.statuses}
                        selectedStatusId={selectedStatusId}
                        onSelect={handleStatusSelect}
                        onReorder={handleStatusReorder}
                      />
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No statuses defined
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Editor */}
                <div className="md:col-span-2">
                  {isCreatingStatus ? (
                    <PipelineStatusEditor
                      mode="create"
                      pipelineId={pipeline?.id || 0}
                      onStatusCreated={handleStatusCreated}
                      onCancel={() => setIsCreatingStatus(false)}
                    />
                  ) : selectedStatus ? (
                    <PipelineStatusEditor
                      mode="edit"
                      status={selectedStatus}
                      onStatusUpdated={handleStatusUpdated}
                      onStatusDeleted={handleStatusDeleted}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-md p-4">
                      Select a status to edit or create a new one
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        {mode === 'create' ? (
          <>
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? "Saving..." : "Create Pipeline"}
            </Button>
          </>
        ) : (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting || isSaving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the pipeline and all its statuses.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
