'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestRingCentralPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/ringcentral-config');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setConfig(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testOAuthFlow = () => {
    // This should trigger the OAuth flow
    window.location.href = '/api/ringcentral/auth?action=authorize';
  };

  const testAuthCheck = async () => {
    try {
      const response = await fetch('/api/ringcentral/auth?action=check');
      const data = await response.json();
      console.log('Auth check result:', data);
      alert(`Auth check result: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error('Auth check failed:', err);
      alert(`Auth check failed: ${err}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">RingCentral Configuration Test</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">RingCentral Configuration Test</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchConfig} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">RingCentral Configuration Test</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>Current RingCentral configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Configuration Valid:</span>
                {config?.isValid ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" /> Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Invalid
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Client ID:</span>
                {config?.hasClientId ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" /> {config.clientIdFirst10}...
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Missing
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Client Secret:</span>
                {config?.hasClientSecret ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" /> {config.secretLength} chars
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Missing
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Server URL:</span>
                <span className="text-sm font-mono">{config?.server}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Redirect URI:</span>
                <span className="text-sm font-mono">{config?.redirectUri}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>App URL:</span>
                <span className="text-sm font-mono">{config?.appUrl}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Scopes:</span>
                <span className="text-sm font-mono">{config?.scopes?.join(' ')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>Test RingCentral integration functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button onClick={testOAuthFlow} className="w-full">
                Test OAuth Flow (Start Authentication)
              </Button>
              
              <Button onClick={testAuthCheck} variant="outline" className="w-full">
                Test Auth Check
              </Button>
              
              <Button onClick={fetchConfig} variant="outline" className="w-full">
                Refresh Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raw Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
