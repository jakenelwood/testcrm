"use client";

import React from "react";

export function OpportunityDetailsModal({ isOpen, onClose, opportunity, onOpportunityUpdated }: any) {
  if (!isOpen) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-lg p-4 w-[420px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Opportunity Details</h2>
          <button className="text-sm text-muted-foreground hover:underline" onClick={onClose}>Close</button>
        </div>
        <div className="text-sm">
          <div className="font-medium">{opportunity?.name || 'Unknown'}</div>
          <div className="text-muted-foreground">Stage: {opportunity?.stage}</div>
          <div className="text-muted-foreground">Amount: ${opportunity?.amount || 0}</div>
        </div>
      </div>
    </div>
  );
}

