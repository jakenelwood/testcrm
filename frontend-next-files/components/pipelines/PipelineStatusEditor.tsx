'use client';

import { useState, useEffect } from 'react';
import { PipelineStatus } from "@/types/lead";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { createPipelineStatus, updatePipelineStatus, deletePipelineStatus } from "@/utils/pipeline-api";
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
import { Trash2, Save } from "lucide-react";

interface PipelineStatusEditorProps {
  mode: 'create' | 'edit';
  pipelineId?: number;
  status?: PipelineStatus;
  onStatusCreated?: (status: PipelineStatus) => void;
  onStatusUpdated?: (status: PipelineStatus) => void;
  onStatusDeleted?: (statusId: number) => void;
  onCancel?: () => void;
}

export function PipelineStatusEditor({
  mode,
  pipelineId,
  status,
  onStatusCreated,
  onStatusUpdated,
  onStatusDeleted,
  onCancel
}: PipelineStatusEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_final: false,
    color_hex: '#3498db',
    icon_name: '',
    ai_action_template: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Initialize form data when status changes
  useEffect(() => {
    if (mode === 'edit' && status) {
      setFormData({
        name: status.name,
        description: status.description || '',
        is_final: status.is_final || false,
        color_hex: status.color_hex || '#3498db',
        icon_name: status.icon_name || '',
        ai_action_template: status.ai_action_template || ''
      });
    }
  }, [mode, status]);

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

      if (mode === 'create' && pipelineId) {
        // Create new status
        const newStatus = await createPipelineStatus({
          pipeline_id: pipelineId,
          name: formData.name,
          description: formData.description,
          is_final: formData.is_final,
          display_order: 999, // Will be ordered last by default
          color_hex: formData.color_hex,
          icon_name: formData.icon_name,
          ai_action_template: formData.ai_action_template
        });

        onStatusCreated?.(newStatus);
      } else if (mode === 'edit' && status) {
        // Update existing status
        const updatedStatus = await updatePipelineStatus(status.id, {
          name: formData.name,
          description: formData.description,
          is_final: formData.is_final,
          color_hex: formData.color_hex,
          icon_name: formData.icon_name,
          ai_action_template: formData.ai_action_template
        });

        onStatusUpdated?.(updatedStatus);
      }
    } catch (error) {
      console.error('Error saving status:', error);
      toast({
        title: "Error",
        description: "Failed to save status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!status) return;

    try {
      setIsDeleting(true);
      await deletePipelineStatus(status.id);
      onStatusDeleted?.(status.id);
    } catch (error: any) {
      console.error('Error deleting status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create New Status' : 'Edit Status'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Status Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., New, In Progress, Completed"
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
            placeholder="Describe what this status means"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color_hex">Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="color_hex"
              name="color_hex"
              type="color"
              value={formData.color_hex}
              onChange={handleInputChange}
              className="w-12 h-8 p-1"
            />
            <Input
              name="color_hex"
              value={formData.color_hex}
              onChange={handleInputChange}
              placeholder="#RRGGBB"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon_name">Icon Name</Label>
          <Input
            id="icon_name"
            name="icon_name"
            value={formData.icon_name}
            onChange={handleInputChange}
            placeholder="e.g., phone, document, check"
          />
          <p className="text-xs text-muted-foreground">
            Enter a Lucide icon name (optional)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_final"
            checked={formData.is_final}
            onCheckedChange={(checked) => handleSwitchChange('is_final', checked)}
          />
          <Label htmlFor="is_final">This is a final status (e.g., Sold, Lost)</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai_action_template">AI Action Template</Label>
          <Textarea
            id="ai_action_template"
            name="ai_action_template"
            value={formData.ai_action_template}
            onChange={handleInputChange}
            placeholder="Template for AI-suggested actions at this status"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Use {'{placeholders}'} for dynamic content (optional)
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {mode === 'create' ? (
          <>
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? "Saving..." : "Create Status"}
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
                    This will permanently delete this status.
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
