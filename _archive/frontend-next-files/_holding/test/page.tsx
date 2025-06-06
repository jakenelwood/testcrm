'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TestIndexPage() {
  const testPages = [
    {
      title: 'RingCentral Simple Authentication',
      description: 'Test the basic RingCentral authentication flow',
      path: '/test/ringcentral-simple',
      tags: ['RingCentral', 'Authentication']
    },
    {
      title: 'RingCentral Call Test',
      description: 'Test making calls with RingCentral RingOut API',
      path: '/test/ringcentral-call',
      tags: ['RingCentral', 'Calling', 'RingOut']
    },
    {
      title: 'RingCentral WebRTC Test',
      description: 'Test making calls directly in the browser with WebRTC',
      path: '/test/ringcentral-webrtc',
      tags: ['RingCentral', 'WebRTC', 'Calling']
    },
    {
      title: 'RingCentral WebRTC New Test',
      description: 'Test the new WebRTC implementation',
      path: '/test/ringcentral-webrtc-new',
      tags: ['RingCentral', 'WebRTC', 'Calling']
    },
    {
      title: 'RingCentral WebRTC Enhanced Test',
      description: 'Test the enhanced WebRTC implementation with improved debugging',
      path: '/test/ringcentral-webrtc-enhanced',
      tags: ['RingCentral', 'WebRTC', 'Calling', 'Debugging', 'New']
    },
    {
      title: 'RingCentral Full Test',
      description: 'Test all RingCentral functionality',
      path: '/test/ringcentral',
      tags: ['RingCentral', 'Authentication', 'Calling', 'SMS']
    },
    {
      title: 'Supabase Test',
      description: 'Test Supabase integration',
      path: '/test-supabase',
      tags: ['Supabase', 'Database']
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Test Pages</h1>
      <p className="text-gray-600 mb-8">
        This page lists all the test pages available in the application. Use these pages to test various features and integrations.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testPages.map((page, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{page.title}</CardTitle>
              <CardDescription>{page.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {page.tags.map((tag, tagIndex) => (
                  <span 
                    key={tagIndex} 
                    className={`px-2 py-1 text-xs rounded-full ${
                      tag === 'New' 
                        ? 'bg-green-100 text-green-800' 
                        : tag === 'RingCentral' 
                        ? 'bg-blue-100 text-blue-800'
                        : tag === 'WebRTC'
                        ? 'bg-purple-100 text-purple-800'
                        : tag === 'Supabase'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link 
                href={page.path}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Go to Test Page
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Development Notes</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>These test pages are for development and testing purposes only.</li>
          <li>Make sure your environment variables are correctly set in the <code>.env.local</code> file.</li>
          <li>For RingCentral tests, ensure your RingCentral application has the correct permissions.</li>
          <li>For WebRTC tests, ensure your browser has microphone permissions enabled.</li>
        </ul>
      </div>
    </div>
  );
}
