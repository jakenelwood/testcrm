'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example component showing how to use Drizzle with your existing Supabase setup
 * 
 * This demonstrates:
 * 1. Making API calls that use both Supabase auth and Drizzle queries
 * 2. Handling the transition period while setting up Drizzle
 * 3. Type-safe data handling
 */

interface ApiResponse {
  message: string;
  user?: {
    id: string;
    email: string;
  };
  stats?: {
    userCount: number;
  };
  note?: string;
  timestamp: string;
}

export default function DrizzleExample() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/example-drizzle');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createTestLead = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/example-drizzle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Lead creation result:', result);
      
      // Refresh data after creating lead
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🗄️ Drizzle + Supabase Integration</CardTitle>
          <CardDescription>
            Example component showing how Drizzle works alongside your existing Supabase setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={fetchData} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Fetch Data'}
            </Button>
            <Button 
              onClick={createTestLead} 
              disabled={loading}
              variant="default"
            >
              {loading ? 'Creating...' : 'Create Test Lead'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">✅ {data.message}</p>
                {data.note && (
                  <p className="text-green-600 text-sm mt-1">💡 {data.note}</p>
                )}
              </div>

              {data.user && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800 font-medium">👤 Authenticated User:</p>
                  <p className="text-blue-600">ID: {data.user.id}</p>
                  <p className="text-blue-600">Email: {data.user.email}</p>
                </div>
              )}

              {data.stats && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                  <p className="text-purple-800 font-medium">📊 Database Stats:</p>
                  <p className="text-purple-600">Total Users: {data.stats.userCount}</p>
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-gray-800 font-medium">🕒 Response Time:</p>
                <p className="text-gray-600 text-sm">{data.timestamp}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span>Drizzle packages installed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span>Configuration files created</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">⏳</span>
              <span>DATABASE_URL configuration (run: npm run test:drizzle)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">⏳</span>
              <span>Schema generation (run: npm run db:generate-schema)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
