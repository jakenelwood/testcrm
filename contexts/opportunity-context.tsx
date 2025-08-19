"use client";

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";

export type OpportunityStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export type Opportunity = {
  id: string;
  name?: string | null;
  amount?: number | null;
  probability?: number; // 0..100
  stage: OpportunityStage;
  createdAt?: string | null;
  currentCarrier?: string | null;
  account?: { name?: string | null; accountType?: string | null } | null;
  contact?: { firstName?: string | null; lastName?: string | null } | null;
  owner?: { fullName?: string | null; email?: string | null } | null;
  ownerId?: string | null;
};

const STAGE_ORDER: OpportunityStage[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

const STAGE_DISPLAY: Record<OpportunityStage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

interface OpportunityContextValue {
  opportunities: Opportunity[];
  isLoading: boolean;
  refreshOpportunities: () => Promise<void> | void;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => Promise<void>;
  getKanbanColumns: () => Array<{ stage: OpportunityStage; displayName: string; opportunities: Opportunity[] }>; 
}

const OpportunityContext = createContext<OpportunityContextValue | undefined>(undefined);

export function OpportunityProvider({ children }: { children: React.ReactNode }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Minimal mock fetch (replace with real API wiring later)
  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: integrate real API or Supabase fetch here
      // Seed with a small deterministic sample so UI renders
      const sample: Opportunity[] = [
        { id: "opp-1", name: "Policy for Smith Co.", amount: 12000, probability: 35, stage: "NEW", createdAt: new Date().toISOString(), account: { name: "Smith Co.", accountType: "Business" }, currentCarrier: "Geico" },
        { id: "opp-2", name: "Homeowners - Jane Doe", amount: 1800, probability: 55, stage: "CONTACTED", createdAt: new Date().toISOString(), contact: { firstName: "Jane", lastName: "Doe" }, currentCarrier: "State Farm" },
        { id: "opp-3", name: "Auto - Johnson Family", amount: 2400, probability: 25, stage: "QUALIFIED", createdAt: new Date().toISOString(), account: { name: "Johnson Family" }, currentCarrier: "Progressive" },
      ];
      setOpportunities(sample);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const refreshOpportunities = useCallback(async () => {
    await fetchOpportunities();
  }, [fetchOpportunities]);

  const updateOpportunity = useCallback(async (id: string, patch: Partial<Opportunity>) => {
    setOpportunities(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
    // TODO: persist via API/Supabase
  }, []);

  const getKanbanColumns = useCallback(() => {
    const groups = new Map<OpportunityStage, Opportunity[]>();
    STAGE_ORDER.forEach((s) => groups.set(s, []));
    for (const opp of opportunities) {
      const s = (opp.stage || "NEW") as OpportunityStage;
      if (!groups.has(s)) groups.set(s, []);
      groups.get(s)!.push(opp);
    }
    return STAGE_ORDER.map((stage) => ({
      stage,
      displayName: STAGE_DISPLAY[stage],
      opportunities: groups.get(stage) || [],
    }));
  }, [opportunities]);

  const value = useMemo<OpportunityContextValue>(() => ({
    opportunities,
    isLoading,
    refreshOpportunities,
    updateOpportunity,
    getKanbanColumns,
  }), [opportunities, isLoading, refreshOpportunities, updateOpportunity, getKanbanColumns]);

  return (
    <OpportunityContext.Provider value={value}>{children}</OpportunityContext.Provider>
  );
}

export function useOpportunities() {
  const ctx = useContext(OpportunityContext);
  if (!ctx) throw new Error("useOpportunities must be used within OpportunityProvider");
  return ctx;
}

