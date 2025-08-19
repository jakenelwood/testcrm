'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';

function StepsPanel({ campaignId }: { campaignId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['campaign-steps', campaignId],
    queryFn: async () => (await fetch(`/api/campaigns/${campaignId}/steps`)).json(),
  });
  const steps = data?.data ?? [];

  async function addStep() {
    const stepNumber = (steps[steps.length - 1]?.stepNumber ?? 0) + 1;
    await fetch(`/api/campaigns/${campaignId}/steps`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepNumber }),
    });
    qc.invalidateQueries({ queryKey: ['campaign-steps', campaignId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <div className="text-sm text-muted-foreground">{steps.length} steps</div>
        <Button onClick={addStep} size="sm">Add step</Button>
      </div>
      {steps.length === 0 ? (
        <div className="text-sm text-muted-foreground">No steps yet. Click "Add step" to create your first step.</div>
      ) : (
        <ul className="space-y-2">
          {steps.map((s: any) => (
            <li key={s.id} className="p-2 rounded border flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span>Step {s.stepNumber}{s.branchLabel ? ` • ${s.branchLabel}` : ''}</span>
                <span className="text-xs text-muted-foreground">ID: <code className="font-mono">{s.id}</code></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{s.templateId ? 'Templated' : 'Manual'}</span>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(s.id)}>Copy ID</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AudiencePanel({ campaignId }: { campaignId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['campaign-targets', campaignId],
    queryFn: async () => (await fetch(`/api/campaigns/${campaignId}/targets`)).json(),
  });
  const targets = data?.data ?? [];

  const [opportunityId, setOpportunityId] = React.useState('');

  async function addTarget() {
    if (!opportunityId) return;
    await fetch(`/api/campaigns/${campaignId}/targets`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId }),
    });
    setOpportunityId('');
    qc.invalidateQueries({ queryKey: ['campaign-targets', campaignId] });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">Add targets by Opportunity ID (UUID). You can use the Step IDs above when enqueuing.</div>
        <div className="flex gap-2">
          <Input placeholder="Opportunity ID (UUID)" value={opportunityId} onChange={e => setOpportunityId(e.target.value)} />
          <Button onClick={addTarget}>Add</Button>
        </div>
      </div>
      {targets.length === 0 ? (
        <div className="text-sm text-muted-foreground">No targets yet. Add at least one Opportunity ID.</div>
      ) : (
        <ul className="space-y-2">
          {targets.map((t: any) => (
            <li key={t.id} className="p-2 rounded border flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-xs">Opportunity: <code className="font-mono">{t.opportunityId}</code></span>
                <span className="text-xs text-muted-foreground">Target ID: <code className="font-mono">{t.id}</code></span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(t.id)}>Copy Target ID</Button>
                <EnqueueButton campaignId={campaignId} targetId={t.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OverridesPanel({ campaignId }: { campaignId: string }) {
  const [form, setForm] = React.useState({ targetId: '', stepId: '', overrides: '{}' });
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const overrides = JSON.parse(form.overrides);
      const res = await fetch(`/api/campaigns/${campaignId}/overrides`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: form.targetId, stepId: form.stepId, overrides }),
      });
      if (!res.ok) throw new Error('Failed to save overrides');
      alert('Saved');
    } catch (e: any) {
      setError(e?.message || 'Invalid JSON');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">Use Target IDs from Audience and Step IDs from Steps. Provide a JSON object to override per-target per-step values.</div>
      <Input placeholder="Target ID" value={form.targetId} onChange={e => setForm({ ...form, targetId: e.target.value })} />
      <Input placeholder="Step ID" value={form.stepId} onChange={e => setForm({ ...form, stepId: e.target.value })} />
      <Textarea rows={6} placeholder={'{\n  "subject": "..."\n}'} value={form.overrides} onChange={e => setForm({ ...form, overrides: e.target.value })} />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Overrides'}</Button>
      </div>
    </div>
  );
}

function EnqueueButton({ campaignId, targetId }: { campaignId: string; targetId: string }) {
  const [loading, setLoading] = React.useState(false);
  async function enqueue() {
    setLoading(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/enqueue`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, stepId: targetId, channel: 'email', payload: {} }),
      });
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button size="sm" onClick={enqueue} disabled={loading}>{loading ? 'Enqueuing...' : 'Enqueue'}</Button>
  );
}


export default function CampaignDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?id=${id}`);
      if (!res.ok) throw new Error('Failed to load campaign');
      return res.json();
    }
  });

  const campaign = data?.data?.[0] ?? null;

  return (
    <div className="p-4 space-y-4">
      {isLoading ? (
        <Skeleton className="h-8 w-48" />
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load campaign.</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{campaign?.name ?? 'Campaign'}</h1>
              <p className="text-sm text-muted-foreground capitalize">{campaign?.status}</p>
            </div>
            <div className="space-x-2">
              <Button variant="secondary">Pause</Button>
              <Button>Resume</Button>
            </div>
          </div>

          <Tabs defaultValue="steps" className="mt-4">
            <TabsList>
              <TabsTrigger value="steps">Steps</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="overrides">Overrides</TabsTrigger>
            </TabsList>

            <TabsContent value="steps">
              <Card>
                <CardHeader>
                  <CardTitle>Steps</CardTitle>
                  <CardDescription>Define and sequence steps</CardDescription>
                </CardHeader>
                <CardContent>
                  <StepsPanel campaignId={id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audience">
              <Card>
                <CardHeader>
                  <CardTitle>Audience</CardTitle>
                  <CardDescription>Add targets to this campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <AudiencePanel campaignId={id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overrides">
              <Card>
                <CardHeader>
                  <CardTitle>Overrides</CardTitle>
                  <CardDescription>Per-target per-step overrides</CardDescription>
                </CardHeader>
                <CardContent>
                  <OverridesPanel campaignId={id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </>
      )}
    </div>
  );
}

