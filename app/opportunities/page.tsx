'use client'

import Link from 'next/link';

export default function OpportunitiesPage() {
  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Opportunities</h1>
      <div className="empty-state" data-testid="empty-opportunities">
        <p className="text-sm text-muted-foreground">No opportunities yet.</p>
        <Link href="/dashboard/opportunities" className="text-primary underline">Go to Dashboard Opportunities</Link>
      </div>
    </main>
  )
}

