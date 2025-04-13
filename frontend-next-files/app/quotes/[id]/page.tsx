'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUOTE_API } from '@/lib/api-config';
import DocumentGenerationPanel from '@/components/DocumentGenerationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { Loader2, ArrowLeft, Edit } from 'lucide-react';

export default function QuoteDetails() {
  const router = useRouter();
  const params = useParams();
  // Safe type assertion for the id parameter
  const quoteId = typeof params?.id === 'string' ? params.id : '';
  
  // Fetch quote details
  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      if (!quoteId) return null;
      const response = await fetch(QUOTE_API.getById(quoteId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      return response.json();
    },
    enabled: !!quoteId,
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto py-10">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {error ? 'Error loading quote details. Please try again.' : 'Quote not found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => router.push(`/quotes/edit/${quoteId}`)}>
          <Edit className="mr-2 h-4 w-4" /> Edit Quote
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quote Request Details</CardTitle>
            <CardDescription>
              Created on {quote.createdAt ? formatDate(new Date(quote.createdAt)) : 'Unknown date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium">Client Information</h3>
                <p className="text-sm text-muted-foreground">
                  {quote.client?.name || 'No client name'}<br />
                  {quote.client?.email || 'No email address'}<br />
                  {quote.client?.phone_number || 'No phone number'}<br />
                  {quote.client?.address || 'No address'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Quote Information</h3>
                <p className="text-sm text-muted-foreground">
                  Effective Date: {quote.effective_date ? formatDate(new Date(quote.effective_date)) : 'Not specified'}<br />
                  Quote Types: {getQuoteTypes(quote)}<br />
                  Status: {quote.status || 'New'}<br />
                  ID: {quote.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="documents">
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="details">Quote Details</TabsTrigger>
          </TabsList>
          <TabsContent value="documents" className="mt-4">
            <DocumentGenerationPanel quoteId={quoteId} />
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Quote Request Data</CardTitle>
                <CardDescription>Detailed information about this quote request</CardDescription>
              </CardHeader>
              <CardContent>
                {quote.has_auto && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Auto Insurance</h3>
                    <div className="bg-muted rounded-md p-4">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(quote.auto_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {quote.has_home && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Home Insurance</h3>
                    <div className="bg-muted rounded-md p-4">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(quote.home_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {quote.has_specialty && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Specialty Insurance</h3>
                    <div className="bg-muted rounded-md p-4">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(quote.specialty_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function getQuoteTypes(quote: any): string {
  const types = [];
  if (quote.has_auto) types.push('Auto');
  if (quote.has_home) types.push('Home');
  if (quote.has_specialty) types.push('Specialty');
  return types.length ? types.join(', ') : 'None';
} 