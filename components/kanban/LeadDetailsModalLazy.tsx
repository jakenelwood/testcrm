'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Lazy load the heavy LeadDetailsModal component
const LeadDetailsModal = dynamic(() => import('./LeadDetailsModal'), {
  loading: () => (
    <Dialog open>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading lead details...</span>
        </div>
      </DialogContent>
    </Dialog>
  ),
  ssr: false // Disable SSR for this heavy component
});

interface LeadDetailsModalLazyProps {
  [key: string]: any; // Accept all props and pass them through
}

export default function LeadDetailsModalLazy(props: LeadDetailsModalLazyProps) {
  return (
    <Suspense fallback={
      <Dialog open>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading lead details...</span>
          </div>
        </DialogContent>
      </Dialog>
    }>
      <LeadDetailsModal {...props} />
    </Suspense>
  );
}
