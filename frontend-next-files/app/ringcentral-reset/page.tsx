'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function RingCentralResetPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (type: 'success' | 'error' | 'info', message: string, details?: any) => {
    setResults(prev => [...prev, {
      id: Date.now(),
      type,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const resetTokens = async () => {
    setIsResetting(true);
    try {
      addResult('info', 'Starting token reset...');
      
      const response = await fetch('/api/ringcentral/auth?action=reset', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        addResult('success', 'Tokens reset successfully!', data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }));
        addResult('error', `Reset failed: ${errorData.error || response.statusText}`, errorData);
      }
    } catch (error: any) {
      addResult('error', `Reset error: ${error.message}`, error);
    } finally {
      setIsResetting(false);
    }
  };

  const cleanupTokens = async () => {
    setIsCleaning(true);
    try {
      addResult('info', 'Starting token cleanup...');
      
      const response = await fetch('/api/ringcentral/auth?action=cleanup', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        addResult('success', 'Tokens cleaned up successfully!', data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }));
        addResult('error', `Cleanup failed: ${errorData.error || response.statusText}`, errorData);
      }
    } catch (error: any) {
      addResult('error', `Cleanup error: ${error.message}`, error);
    } finally {
      setIsCleaning(false);
    }
  };

  const checkAuth = async () => {
    setIsChecking(true);
    try {
      addResult('info', 'Checking authentication status...');
      
      const response = await fetch('/api/ringcentral/auth?action=check', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated) {
          addResult('success', `Authentication working! Source: ${data.source}`, data);
        } else {
          addResult('error', 'Not authenticated', data);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }));
        addResult('error', `Auth check failed: ${errorData.error || response.statusText}`, errorData);
      }
    } catch (error: any) {
      addResult('error', `Auth check error: ${error.message}`, error);
    } finally {
      setIsChecking(false);
    }
  };

  const forceReauth = () => {
    addResult('info', 'Redirecting to RingCentral authorization...');
    window.location.href = '/api/ringcentral/auth?action=authorize';
  };

  const performFullRecovery = async () => {
    clearResults();
    addResult('info', 'Starting full RingCentral recovery process...');
    
    // Step 1: Check current state
    await checkAuth();
    
    // Step 2: Cleanup expired tokens
    await cleanupTokens();
    
    // Step 3: Reset all tokens
    await resetTokens();
    
    // Step 4: Check auth again
    await checkAuth();
    
    addResult('info', 'Recovery process complete. If still not authenticated, click "Force Re-authentication"');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">RingCentral Token Reset</h1>
        <p className="text-muted-foreground">
          Use this page to diagnose and fix RingCentral authentication issues.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Individual actions to fix specific issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={checkAuth} 
              disabled={isChecking}
              variant="outline"
              className="w-full"
            >
              {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Authentication
            </Button>
            
            <Button 
              onClick={cleanupTokens} 
              disabled={isCleaning}
              variant="outline"
              className="w-full"
            >
              {isCleaning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cleanup Expired Tokens
            </Button>
            
            <Button 
              onClick={resetTokens} 
              disabled={isResetting}
              variant="destructive"
              className="w-full"
            >
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Reset All Tokens
            </Button>
            
            <Button 
              onClick={forceReauth}
              variant="default"
              className="w-full"
            >
              Force Re-authentication
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Full Recovery
            </CardTitle>
            <CardDescription>
              Comprehensive recovery process for severe issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={performFullRecovery}
              disabled={isResetting || isCleaning || isChecking}
              className="w-full"
              size="lg"
            >
              {(isResetting || isCleaning || isChecking) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Full Recovery
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will check auth, cleanup tokens, reset everything, and verify the fix.
            </p>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Results</CardTitle>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <Alert key={result.id} className={
                  result.type === 'success' ? 'border-green-200 bg-green-50' :
                  result.type === 'error' ? 'border-red-200 bg-red-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <div className="flex items-start gap-2">
                    {result.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                    {result.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />}
                    {result.type === 'info' && <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5" />}
                    <div className="flex-1">
                      <AlertDescription className="font-medium">
                        {result.message}
                      </AlertDescription>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Show details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Token Revoked Errors</h4>
              <p className="text-muted-foreground">Use "Reset All Tokens" then "Force Re-authentication"</p>
            </div>
            <div>
              <h4 className="font-medium">Rate Limiting (429 errors)</h4>
              <p className="text-muted-foreground">Use "Cleanup Expired Tokens" and wait 5-15 minutes</p>
            </div>
            <div>
              <h4 className="font-medium">Call Timeouts (504 errors)</h4>
              <p className="text-muted-foreground">These should be reduced with the new timeout protections</p>
            </div>
            <div>
              <h4 className="font-medium">General Auth Issues</h4>
              <p className="text-muted-foreground">Use "Start Full Recovery" for comprehensive fix</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
