'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ClientsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the leads page
    router.push('/dashboard/leads');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="mt-4 text-gray-600">Redirecting to leads...</p>
    </div>
  );
}
