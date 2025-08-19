"use client";

import React from "react";

export function StageBadge({ stage }: { stage: string }) {
  const label = String(stage).replaceAll('_', ' ');
  return (
    <span className="text-[10px] uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
      {label}
    </span>
  );
}

