'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const query = new URLSearchParams({ search, ...(status ? { status } : {}), ...(type ? { campaignType: type } : {}) }).toString();

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', query],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?${query}`);
      if (!res.ok) throw new Error('Failed to load campaigns');
      return res.json();
    },
  });

  const campaigns = data?.data ?? [];

  const createCampaign = async () => {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setOpen(false);
      setName('');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" role="main">
      <div className="flex-shrink-0 p-2 sm:p-4">
        <div className="max-w-screen-2xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
              <p className="text-muted-foreground">Create and manage automated outreach targeting opportunities</p>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <Card className="w-full">
            <CardContent className="pt-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={status} onValueChange={(v) => setStatus(v === '__all' ? '' : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">All</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <Select value={type} onValueChange={(v) => setType(v === '__all' ? '' : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">All</SelectItem>
                      <SelectItem value="multi_channel">Multi-channel</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="ai_automated">AI Automated</SelectItem>
                      <SelectItem value="ai_nurture">AI Nurture</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="reengagement">Re-engagement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-2 sm:p-4 pt-0">
        <div className="max-w-screen-2xl mx-auto w-full">
          <Card className="h-full">
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>Draft, active, and paused campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse border rounded-md p-4">
                    <div className="h-5 w-2/3 bg-gray-200 mb-2" />
                    <div className="h-3 w-1/3 bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground mb-4">No campaigns found.</p>
                <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Create your first campaign</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((c: any) => (
                  <Card key={c.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        <Link href={`/dashboard/campaigns/${c.id}`} className="hover:underline">{c.name}</Link>
                      </CardTitle>
                      <CardDescription className="capitalize">{c.status}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sent: {c.totalSent ?? 0}</span>
                      <Link href={`/dashboard/campaigns/${c.id}`}>
                        <Button variant="secondary" size="sm">Open</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createCampaign} disabled={!name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

