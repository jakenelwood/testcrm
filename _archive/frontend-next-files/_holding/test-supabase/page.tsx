import TestSupabase from '@/components/test-supabase';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function TestSupabasePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Integration Test</h1>
      <Suspense fallback={<div>Loading Supabase component...</div>}>
        <TestSupabase />
      </Suspense>
    </div>
  );
}
