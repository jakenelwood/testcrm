"use client";

import React from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OpportunityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: any;
  onOpportunityUpdated?: (updated: any) => void;
}

export function OpportunityDetailsModal({ isOpen, onClose, opportunity, onOpportunityUpdated }: OpportunityDetailsModalProps) {
  const [editMode, setEditMode] = React.useState(false);
  const [local, setLocal] = React.useState(() => ({
    name: opportunity?.name || "",
    amount: opportunity?.amount ?? 0,
    stage: opportunity?.stage || "",
  }));

  React.useEffect(() => {
    if (isOpen) {
      setEditMode(false);
      setLocal({
        name: opportunity?.name || "",
        amount: opportunity?.amount ?? 0,
        stage: opportunity?.stage || "",
      });
    }
  }, [isOpen, opportunity]);

  const handleSave = () => {
    setEditMode(false);
    onOpportunityUpdated?.({ ...opportunity, ...local });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent role="dialog" aria-modal="true" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">Opportunity: {opportunity?.name || 'Unknown'}</DialogTitle>
          <DialogDescription>
            View and edit details. Use tabs to navigate. Press Esc to close.
          </DialogDescription>
        </DialogHeader>

        {/* Header actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" aria-label="phone" data-testid="phone-button">Call</Button>
            <Button variant="outline" size="sm" aria-label="sms" data-testid="sms-button">SMS</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild data-testid="view-details-link">
              <Link href={`/dashboard/opportunities/${opportunity?.id ?? ''}`}>View details</Link>
            </Button>
            {!editMode ? (
              <Button size="sm" onClick={() => setEditMode(true)} data-testid="edit-button">Edit</Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditMode(false); setLocal({ name: opportunity?.name || "", amount: opportunity?.amount ?? 0, stage: opportunity?.stage || "" }); }} data-testid="cancel-button">Cancel</Button>
                <Button size="sm" onClick={handleSave}>Save</Button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList role="tablist" data-testid="modal-tabs" className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" role="tab" data-testid="tab">Overview</TabsTrigger>
            <TabsTrigger value="activity" role="tab" data-testid="tab">Activity</TabsTrigger>
            <TabsTrigger value="details" role="tab" data-testid="tab">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="opportunity-name">Name</Label>
                <Input id="opportunity-name" value={local.name} onChange={(e) => setLocal(v => ({ ...v, name: e.target.value }))} disabled={!editMode} />
              </div>
              <div>
                <Label htmlFor="opportunity-amount">Amount</Label>
                <Input id="opportunity-amount" value={String(local.amount ?? '')} onChange={(e) => setLocal(v => ({ ...v, amount: Number(e.target.value) || 0 }))} disabled={!editMode} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="text-sm text-muted-foreground">Recent activity will appear here.</div>
          </TabsContent>

          <TabsContent value="details" className="space-y-2">
            <div className="text-sm">Stage: <span className="font-medium">{local.stage || '-'} </span></div>
            <div className="text-sm">Probability: <span className="font-medium">{opportunity?.probability ?? '-'}%</span></div>
            <div className="text-sm">Created: <span className="font-medium">{opportunity?.createdAt ? new Date(opportunity.createdAt).toLocaleString() : '-'}</span></div>
          </TabsContent>
        </Tabs>

        {/* Fallback close button for tests */}
        <div className="sr-only">
          <button aria-label="Close" data-testid="close-modal" onClick={onClose}>Close</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
