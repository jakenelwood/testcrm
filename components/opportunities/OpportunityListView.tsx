"use client";

import React from "react";

export function OpportunityListView({ opportunities, isLoading, onOpportunitySelect }: any) {
  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  if (!opportunities?.length) return <div className="p-4 text-sm text-muted-foreground">No opportunities.</div>;
  return (
    <div className="p-2">
      <ul className="divide-y divide-border">
        {opportunities.map((o: any) => (
          <li key={o.id} className="p-3 hover:bg-muted/50 cursor-pointer" onClick={() => onOpportunitySelect?.(o)}>
            <div className="font-medium">{o.name || o.account?.name || `${o.contact?.firstName || ''} ${o.contact?.lastName || ''}`.trim() || 'Unknown'}</div>
            <div className="text-xs text-muted-foreground">Stage: {o.stage} • Amount: ${o.amount || 0}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

