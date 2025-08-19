'use client';

import { QuoteFormContainer } from "@/components/forms/quote-form-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewQuotePage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-2 sm:p-4">
        <div className="max-w-screen-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">New Lead</h1>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 sm:p-4 pt-0">
        <div className="max-w-screen-2xl mx-auto w-full">
          <QuoteFormContainer />
        </div>
      </div>
    </div>
  );
}