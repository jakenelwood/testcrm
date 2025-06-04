'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

export default function RingCentralDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ringcentral/debug');
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch debug information');
      console.error('Error fetching debug info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const renderCharCodes = (charCodes: number[] | undefined) => {
    if (!charCodes) return 'No data';
    
    return (
      <div className="grid grid-cols-8 gap-1 text-xs">
        {charCodes.map((code, index) => (
          <div key={index} className="flex flex-col items-center border p-1 rounded">
            <span>{String.fromCharCode(code)}</span>
            <span className="text-gray-500">{code}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>RingCentral OAuth Debug</CardTitle>
          <CardDescription>
            Detailed information about RingCentral OAuth configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button 
              onClick={fetchDebugInfo} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Refresh Debug Info'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {debugInfo && (
            <Tabs defaultValue="config">
              <TabsList>
                <TabsTrigger value="config">Config</TabsTrigger>
                <TabsTrigger value="env">Environment</TabsTrigger>
                <TabsTrigger value="auth">Auth URL</TabsTrigger>
                <TabsTrigger value="token">Token Params</TabsTrigger>
              </TabsList>
              
              <TabsContent value="config" className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">REDIRECT_URI (from config)</h3>
                    <p className="text-sm mb-2 font-mono break-all">{debugInfo.config.REDIRECT_URI}</p>
                    <p className="text-xs text-gray-500">Length: {debugInfo.config.REDIRECT_URI_LENGTH}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Character Codes:</h4>
                      {renderCharCodes(debugInfo.config.REDIRECT_URI_CHAR_CODES)}
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">NEXT_PUBLIC_APP_URL (from config)</h3>
                    <p className="text-sm mb-2 font-mono break-all">{debugInfo.config.NEXT_PUBLIC_APP_URL}</p>
                    <p className="text-xs text-gray-500">Length: {debugInfo.config.NEXT_PUBLIC_APP_URL_LENGTH}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="env" className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">REDIRECT_URI (direct from env)</h3>
                    <p className="text-sm mb-2 font-mono break-all">{debugInfo.env_direct.REDIRECT_URI}</p>
                    <p className="text-xs text-gray-500">Length: {debugInfo.env_direct.REDIRECT_URI_LENGTH}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Character Codes:</h4>
                      {renderCharCodes(debugInfo.env_direct.REDIRECT_URI_CHAR_CODES)}
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">NEXT_PUBLIC_APP_URL (direct from env)</h3>
                    <p className="text-sm mb-2 font-mono break-all">{debugInfo.env_direct.NEXT_PUBLIC_APP_URL}</p>
                    <p className="text-xs text-gray-500">Length: {debugInfo.env_direct.NEXT_PUBLIC_APP_URL_LENGTH}</p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Environment Info</h3>
                    <p className="text-sm">NODE_ENV: {debugInfo.environment.NODE_ENV}</p>
                    <p className="text-sm">VERCEL_ENV: {debugInfo.environment.VERCEL_ENV}</p>
                    <p className="text-sm">VERCEL_URL: {debugInfo.environment.VERCEL_URL}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="auth" className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Authorization URL</h3>
                    <p className="text-sm mb-2 font-mono break-all">{debugInfo.auth_url.full}</p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">redirect_uri Parameter</h3>
                    <p className="text-sm mb-2 font-mono break-all">{debugInfo.auth_url.redirect_uri}</p>
                    <p className="text-xs text-gray-500">Length: {debugInfo.auth_url.redirect_uri_length}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Character Codes:</h4>
                      {renderCharCodes(debugInfo.auth_url.redirect_uri_char_codes)}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="token" className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Token Exchange redirect_uri Parameter</h3>
                    <p className="text-sm mb-2 font-mono break-all">{debugInfo.token_params.redirect_uri}</p>
                    <p className="text-xs text-gray-500">Length: {debugInfo.token_params.redirect_uri_length}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Character Codes:</h4>
                      {renderCharCodes(debugInfo.token_params.redirect_uri_char_codes)}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
