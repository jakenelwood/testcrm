'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, XCircle, RefreshCw, User, Key } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { Textarea } from "@/components/ui/textarea";
import { isRingCentralAuthenticated, authenticateWithRingCentral } from "@/utils/ringcentral";

export default function AuthTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [ringcentralAuth, setRingcentralAuth] = useState<boolean | null>(null);
  const [ringcentralTokens, setRingcentralTokens] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Add a log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1]?.split('.')[0] || new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  // Test authentication
  const testAuthentication = async () => {
    setIsLoading(true);
    setError(null);
    setSupabaseUser(null);
    setRingcentralAuth(null);
    setRingcentralTokens(null);
    
    addLog('Testing authentication...');
    
    try {
      // Initialize Supabase client
      addLog('Initializing Supabase client...');
      const supabase = createClient();
      
      // Get current user
      addLog('Getting current user from Supabase...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Supabase user error: ${userError.message}`);
      }
      
      if (user) {
        addLog(`Found Supabase user: ${user.id} (${user.email})`);
        setSupabaseUser(user);
        
        // Check for RingCentral tokens
        addLog('Checking for RingCentral tokens in database...');
        const { data: tokens, error: tokensError } = await supabase
          .from('ringcentral_tokens')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        
        if (tokensError && tokensError.code !== 'PGRST116') {
          addLog(`Error fetching tokens: ${tokensError.message}`);
        } else if (tokens) {
          addLog('Found RingCentral tokens in database');
          setRingcentralTokens(tokens);
        } else {
          addLog('No RingCentral tokens found in database');
        }
      } else {
        addLog('No Supabase user found');
        
        // Try to sign up anonymously
        addLog('Creating anonymous user...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `anonymous-${Date.now()}@gonzigo.com`,
          password: `Anonymous${Date.now()}!`,
          options: {
            data: {
              is_anonymous: true,
              created_via: 'auth_test'
            }
          }
        });
        
        if (signUpError) {
          throw new Error(`Failed to create anonymous user: ${signUpError.message}`);
        }
        
        if (signUpData?.user) {
          addLog(`Successfully created anonymous user: ${signUpData.user.id}`);
          setSupabaseUser(signUpData.user);
        } else {
          addLog('No user returned after sign up');
        }
      }
      
      // Check RingCentral authentication
      addLog('Checking RingCentral authentication...');
      const isAuthenticated = await isRingCentralAuthenticated();
      setRingcentralAuth(isAuthenticated);
      
      if (isAuthenticated) {
        addLog('RingCentral authentication successful');
      } else {
        addLog('Not authenticated with RingCentral');
      }
      
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
      setError(err.message || 'An error occurred while testing authentication');
    } finally {
      setIsLoading(false);
    }
  };

  // Run the test on page load
  useEffect(() => {
    testAuthentication();
  }, []);

  // Authenticate with RingCentral
  const handleRingCentralAuth = () => {
    addLog('Redirecting to RingCentral authentication...');
    authenticateWithRingCentral('/dashboard/settings/development/auth-test');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Authentication Test</h1>
        <Button onClick={testAuthentication} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Testing...' : 'Test Authentication'}
        </Button>
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Authentication Test</AlertTitle>
        <AlertDescription>
          This tool tests the authentication flow for both Supabase and RingCentral.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>
                Status of your authentication with Supabase and RingCentral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supabase User */}
              <div className="p-4 border rounded-md">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="text-lg font-medium">Supabase User</h3>
                </div>
                
                {supabaseUser ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>User authenticated</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">ID:</span> {supabaseUser.id}</div>
                      <div><span className="font-medium">Email:</span> {supabaseUser.email}</div>
                      <div><span className="font-medium">Created:</span> {new Date(supabaseUser.created_at).toLocaleString()}</div>
                      <div><span className="font-medium">Anonymous:</span> {supabaseUser.user_metadata?.is_anonymous ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span>No Supabase user found</span>
                  </div>
                )}
              </div>
              
              {/* RingCentral Authentication */}
              <div className="p-4 border rounded-md">
                <div className="flex items-center mb-2">
                  <Key className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="text-lg font-medium">RingCentral Authentication</h3>
                </div>
                
                {ringcentralAuth === true ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Authenticated with RingCentral</span>
                    </div>
                    
                    {ringcentralTokens && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Token ID:</span> {ringcentralTokens.id}</div>
                        <div><span className="font-medium">User ID:</span> {ringcentralTokens.user_id}</div>
                        <div><span className="font-medium">Expires:</span> {new Date(ringcentralTokens.expires_at).toLocaleString()}</div>
                        <div><span className="font-medium">Scope:</span> {ringcentralTokens.scope}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span>Not authenticated with RingCentral</span>
                    </div>
                    
                    <Button onClick={handleRingCentralAuth}>
                      Authenticate with RingCentral
                    </Button>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
              <CardDescription>
                Real-time logs of the authentication test
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <Textarea 
                className="h-[400px] font-mono text-xs" 
                readOnly 
                value={logs.join('\n')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
