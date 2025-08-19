'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component for heavy components
const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin mr-2" />
    <span>{message}</span>
  </div>
);

// Dynamic imports for large components to reduce initial bundle size
export const DynamicLeadDetailsModal = dynamic(
  () => import('@/components/kanban/LeadDetailsModal'),
  {
    loading: () => <LoadingSpinner message="Loading lead details..." />,
    ssr: false
  }
);

export const DynamicLeadInfoForm = dynamic(
  () => import('@/components/forms/lead-info-form'),
  {
    loading: () => <LoadingSpinner message="Loading form..." />,
    ssr: false
  }
);

export const DynamicAutoInsuranceForm = dynamic(
  () => import('@/components/forms/auto-insurance-form'),
  {
    loading: () => <LoadingSpinner message="Loading auto form..." />,
    ssr: false
  }
);

export const DynamicHomeInsuranceForm = dynamic(
  () => import('@/components/home-insurance-form'),
  {
    loading: () => <LoadingSpinner message="Loading home form..." />,
    ssr: false
  }
);

// Split form components into smaller chunks
export const DynamicOtherInsuredForm = dynamic(
  () => import('@/components/forms/other-insured-form').then(mod => ({ default: mod.OtherInsuredForm })),
  {
    loading: () => <LoadingSpinner message="Loading insured form..." />,
    ssr: false
  }
);

export const DynamicHomeForm = dynamic(
  () => import('@/components/forms/home-form').then(mod => ({ default: mod.HomeForm })),
  {
    loading: () => <LoadingSpinner message="Loading home form..." />,
    ssr: false
  }
);

export const DynamicSpecialtyItemForm = dynamic(
  () => import('@/components/forms/specialty-item-form').then(mod => ({ default: mod.SpecialtyItemForm })),
  {
    loading: () => <LoadingSpinner message="Loading specialty form..." />,
    ssr: false
  }
);

export const DynamicQuoteRequestForm = dynamic(
  () => import('@/components/forms/quote-request-form'),
  {
    loading: () => <LoadingSpinner message="Loading quote form..." />,
    ssr: false
  }
);

export const DynamicLeadImportModal = dynamic(
  () => import('@/components/leads/LeadImportModal'),
  {
    loading: () => <LoadingSpinner message="Loading import modal..." />,
    ssr: false
  }
);

// Wrapper component with Suspense boundary
export function DynamicComponentWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}
