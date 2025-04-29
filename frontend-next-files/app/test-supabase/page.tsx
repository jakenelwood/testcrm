import TestSupabase from '@/components/test-supabase';

export default function TestSupabasePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Integration Test</h1>
      <TestSupabase />
    </div>
  );
}
