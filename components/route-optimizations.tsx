'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component for route-level components
const RouteLoadingSpinner = ({ message = "Loading page..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Route-level dynamic imports to reduce large chunks
export const DynamicLeadsPage = dynamic(
  () => import('@/app/dashboard/leads/page'),
  {
    loading: () => <RouteLoadingSpinner message="Loading leads dashboard..." />,
    ssr: false
  }
);

export const DynamicLeadDetailsPage = dynamic(
  () => import('@/app/dashboard/leads/[id]/page'),
  {
    loading: () => <RouteLoadingSpinner message="Loading lead details..." />,
    ssr: false
  }
);

export const DynamicNewLeadPage = dynamic(
  () => import('@/app/dashboard/new/page'),
  {
    loading: () => <RouteLoadingSpinner message="Loading new lead form..." />,
    ssr: false
  }
);

export const DynamicSettingsPage = dynamic(
  () => import('@/app/dashboard/settings/page'),
  {
    loading: () => <RouteLoadingSpinner message="Loading settings..." />,
    ssr: false
  }
);

// Component-level optimizations for heavy components
export const DynamicDataTable = dynamic(
  () => import('@/components/ui/data-table'),
  {
    loading: () => <RouteLoadingSpinner message="Loading table..." />,
    ssr: false
  }
);

export const DynamicChart = dynamic(
  () => import('@/components/ui/chart'),
  {
    loading: () => <RouteLoadingSpinner message="Loading chart..." />,
    ssr: false
  }
);

// Wrapper for route optimization
export function OptimizedRoute({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback || <RouteLoadingSpinner />}>
      {children}
    </Suspense>
  );
}
