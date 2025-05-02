'use client';

/**
 * LEADS PAGE (ROOT LEVEL)
 * 
 * This is a simple redirect page that forwards to the dashboard/leads page
 * with the appropriate pipeline parameter.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchDefaultPipeline } from '@/utils/pipeline-api';

export default function LeadsRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const redirectToLeads = async () => {
      try {
        // Get pipeline ID from URL or use default
        const pipelineId = searchParams.get('pipeline');
        
        if (pipelineId) {
          // If pipeline ID is provided, redirect to dashboard/leads with that pipeline
          router.push(`/dashboard/leads?pipeline=${pipelineId}`);
        } else {
          // Otherwise, get the default pipeline and redirect
          const defaultPipeline = await fetchDefaultPipeline();
          router.push(`/dashboard/leads?pipeline=${defaultPipeline.id}`);
        }
      } catch (error) {
        console.error('Error redirecting to leads:', error);
        // Fallback to dashboard/leads without pipeline parameter
        router.push('/dashboard/leads');
      }
    };
    
    redirectToLeads();
  }, [router, searchParams]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Redirecting to Leads...</h2>
        <p className="text-muted-foreground">Please wait while we load your pipeline.</p>
      </div>
    </div>
  );
}
