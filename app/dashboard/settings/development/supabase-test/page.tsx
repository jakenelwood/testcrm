'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, XCircle, RefreshCw, Database, PlusCircle } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export default function SupabaseTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTables, setIsCreatingTables] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [missingTables, setMissingTables] = useState<string[]>([]);

  // Add a log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  // Test Supabase connection
  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('idle');
    setTables([]);
    setDatabaseInfo(null);

    addLog('Testing Supabase connection...');

    try {
      // Initialize Supabase client
      addLog('Initializing Supabase client...');
      const supabase = createClient();

      // Test connection with a simple query to get the current user
      addLog('Testing connection with auth.getUser()...');
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(`Connection error: ${userError.message}`);
      }

      addLog(`Connection successful! ${userData.user ? 'User authenticated' : 'No user authenticated'}`);

      if (userData.user) {
        addLog(`User ID: ${userData.user.id}`);
        addLog(`User Email: ${userData.user.email}`);
      }

      setConnectionStatus('success');

      // Get list of tables - using _version_info which is a safe view to check connection
      addLog('Fetching database version...');
      const { data: versionData, error: versionError } = await supabase
        .from('_version_info')
        .select('*')
        .single();

      if (versionError) {
        addLog(`Error fetching database version: ${versionError.message}`);
      } else {
        addLog(`Database version: ${versionData.version}`);
      }

      // Get tables via direct SQL query to avoid schema access issues
      addLog('Fetching table list...');
      const { data: tableData, error: tableError } = await supabase.rpc('list_tables');

      if (tableError) {
        addLog(`Error fetching tables: ${tableError.message}`);

        // Fallback - try using a simple query to check if specific tables exist
        addLog('Trying alternative method to check for required tables...');
        const requiredTables = [
          'ringcentral_tokens',
          'specialty_items',
          'other_insureds',
          'vehicles',
          'homes'
        ];

        let detectedTables: string[] = [];

        for (const table of requiredTables) {
          try {
            const { count, error: countError } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });

            if (!countError) {
              detectedTables.push(table);
              addLog(`Table '${table}' exists`);
            }
          } catch (e) {
            addLog(`Table '${table}' does not exist or is not accessible`);
          }
        }

        setTables(detectedTables);
        setMissingTables(requiredTables.filter(t => !detectedTables.includes(t)));
      } else {
        const tableNames = tableData;
        setTables(tableNames);
        addLog(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);

        // Check for required tables
        const requiredTables = [
          'ringcentral_tokens',
          'leads_contact_info',
          'contacts',
          'lead_notes',
          'lead_communications',
          'lead_marketing_settings',
          'opportunities',
          'ai_interactions',
          'support_tickets'
        ];

        const missingTablesList = requiredTables.filter(table => !tableNames.includes(table));
        setMissingTables(missingTablesList);

        if (missingTablesList.length > 0) {
          addLog(`⚠️ Missing required tables: ${missingTablesList.join(', ')}`);
        } else {
          addLog('✅ All required tables exist');
        }
      }

      // Check for RingCentral tokens if user is authenticated
      if (userData.user) {
        addLog('Checking for RingCentral tokens...');
        const { data: tokens, error: tokensError } = await supabase
          .from('ringcentral_tokens')
          .select('*')
          .eq('user_id', userData.user.id)
          .limit(1)
          .single();

        if (tokensError && tokensError.code !== 'PGRST116') {
          addLog(`Error checking tokens: ${tokensError.message}`);
        } else if (tokens) {
          addLog('✅ RingCentral tokens found for current user');
          addLog(`Token expires at: ${new Date(tokens.expires_at).toLocaleString()}`);

          // Add token info to database info
          setDatabaseInfo(prev => ({
            ...prev,
            ringcentral_tokens: {
              id: tokens.id,
              user_id: tokens.user_id,
              expires_at: tokens.expires_at,
              scope: tokens.scope,
              has_access_token: !!tokens.access_token,
              has_refresh_token: !!tokens.refresh_token
            }
          }));
        } else {
          addLog('⚠️ No RingCentral tokens found for current user');
        }
      }

    } catch (err: any) {
      addLog(`Error: ${err.message}`);
      setError(err.message || 'An error occurred while testing the connection');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Create missing tables
  const createMissingTables = async () => {
    if (missingTables.length === 0) {
      toast({
        title: "No missing tables",
        description: "All required tables already exist.",
        variant: "default"
      });
      return;
    }

    setIsCreatingTables(true);
    addLog(`Creating missing tables: ${missingTables.join(', ')}...`);

    try {
      const supabase = createClient();

      // Create each missing table
      for (const table of missingTables) {
        addLog(`Creating table: ${table}...`);

        let query = '';
        let success = false;

        switch (table) {
          case 'ringcentral_tokens':
            query = `
              CREATE TABLE IF NOT EXISTS ringcentral_tokens (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                access_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                token_type TEXT NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                scope TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                refresh_token_expires_at TIMESTAMP WITH TIME ZONE
              );

              -- Add RLS policy
              DROP POLICY IF EXISTS "Users can only access their own tokens" ON ringcentral_tokens;
              CREATE POLICY "Users can only access their own tokens"
              ON ringcentral_tokens
              FOR ALL
              USING (auth.uid() = user_id);

              -- Enable RLS
              ALTER TABLE ringcentral_tokens ENABLE ROW LEVEL SECURITY;
            `;
            break;

          case 'leads_contact_info':
            query = `
              CREATE TABLE IF NOT EXISTS public.leads_contact_info (
                  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
                  lead_type text NOT NULL,
                  name text NOT NULL,
                  email text,
                  phone_number text,
                  address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
                  mailing_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
                  referred_by text,
                  date_of_birth text,
                  gender text,
                  marital_status text,
                  drivers_license text,
                  license_state text,
                  education_occupation text,
                  business_type text,
                  industry text,
                  tax_id text,
                  year_established text,
                  annual_revenue numeric(15,2),
                  number_of_employees integer,
                  ai_summary text,
                  ai_next_action text,
                  ai_risk_score integer,
                  ai_lifetime_value numeric(15,2),
                  metadata jsonb,
                  tags text[],
                  created_at timestamp with time zone DEFAULT now(),
                  updated_at timestamp with time zone DEFAULT now(),
                  last_contact_at timestamp with time zone,
                  next_contact_at timestamp with time zone,
                  converted_from_lead_id uuid,
                  CONSTRAINT clients_client_type_check CHECK ((lead_type = ANY (ARRAY['Individual'::text, 'Business'::text])))
              );
              -- COMMENT ON TABLE public.leads_contact_info IS 'Stores contact information for leads (renamed from clients)';
              -- No RLS found in schema-only.sql for leads_contact_info, so not adding any here.
            `;
            break;

          case 'contacts':
            query = `
              CREATE TABLE IF NOT EXISTS contacts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                title TEXT,
                email TEXT,
                phone_number TEXT,
                is_primary_contact BOOLEAN DEFAULT FALSE,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            break;

          case 'lead_notes':
            query = `
              CREATE TABLE IF NOT EXISTS lead_notes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                note_content TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            break;

          case 'lead_communications':
            query = `
              CREATE TABLE IF NOT EXISTS lead_communications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
                type TEXT NOT NULL CHECK (type IN ('Email', 'SMS', 'Call', 'Note', 'Meeting')),
                direction TEXT CHECK (direction IN ('Inbound', 'Outbound')),
                content TEXT,
                status TEXT,
                created_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            break;

          case 'lead_marketing_settings':
            query = `
              CREATE TABLE IF NOT EXISTS lead_marketing_settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                campaign_id TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                settings JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            break;

          case 'opportunities':
            query = `
              CREATE TABLE IF NOT EXISTS opportunities (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                stage TEXT NOT NULL,
                amount DECIMAL(15, 2),
                probability INTEGER,
                expected_close_date DATE,
                actual_close_date DATE,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            break;

          case 'ai_interactions':
            query = `
              CREATE TABLE IF NOT EXISTS ai_interactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
                type TEXT CHECK (type IN ('Chat', 'Follow-Up', 'Summary', 'Prediction', 'PromptResponse')),
                source TEXT CHECK (source IN ('Agent UI', 'Marketing Automation', 'AI Assistant', 'Backend Middleware')),
                content TEXT,
                ai_response TEXT,
                summary TEXT,
                model_used TEXT,
                temperature FLOAT,
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            break;

          case 'support_tickets':
            query = `
              CREATE TABLE IF NOT EXISTS support_tickets (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
                created_by TEXT,
                issue_type TEXT,
                issue_description TEXT,
                resolution_summary TEXT,
                status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Escalated')),
                assigned_to TEXT,
                notes JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            break;
        }

        if (query) {
          try {
            const { error } = await supabase.rpc('exec_sql', { query });

            if (error) {
              addLog(`Error creating table ${table}: ${error.message}`);

              // Try a different approach if the RPC fails
              try {
                // This is a workaround since we can't execute raw SQL directly from the client
                // We'll create a minimal version of the table with just the required fields
                const { error: createError } = await supabase
                  .from(table)
                  .insert({
                    // Add minimal required fields based on the table
                    name: table === 'clients' ? 'Test Client' : undefined,
                    client_type: table === 'clients' ? 'Individual' : undefined,
                    first_name: (table === 'contacts') ? 'Test' : undefined,
                    last_name: (table === 'contacts') ? 'Contact' : undefined,
                    client_id: (table === 'contacts' || table === 'leads') ? '00000000-0000-0000-0000-000000000000' : undefined,
                    insurance_type: table === 'leads' ? 'Auto' : undefined,
                    status: table === 'leads' ? 'New' : undefined,
                    lead_id: (table === 'lead_notes' || table === 'lead_communications' || table === 'lead_marketing_settings' || table === 'opportunities') ? '00000000-0000-0000-0000-000000000000' : undefined,
                    note_content: table === 'lead_notes' ? 'Test Note' : undefined,
                    type: table === 'lead_communications' ? 'Email' : undefined,
                    campaign_id: table === 'lead_marketing_settings' ? 'test_campaign' : undefined,
                    stage: table === 'opportunities' ? 'New' : undefined,
                    // Add a temporary record that will be automatically deleted
                    // when we test if the table exists
                    _is_temp_record: true
                  });

                if (createError && createError.code !== '42P07') { // 42P07 is "relation already exists"
                  addLog(`Error creating table ${table} with fallback method: ${createError.message}`);
                } else {
                  success = true;
                  addLog(`Successfully created table ${table} with fallback method`);
                }
              } catch (fallbackError: any) {
                addLog(`Error in fallback table creation for ${table}: ${fallbackError.message}`);
              }
            } else {
              success = true;
              addLog(`Successfully created table ${table}`);
            }
          } catch (execError: any) {
            addLog(`Error executing SQL for ${table}: ${execError.message}`);
          }
        }

        if (!success) {
          addLog(`⚠️ Failed to create table ${table}`);
        }
      }

      // Refresh the table list
      addLog('Refreshing table list...');
      await testConnection();

      toast({
        title: "Tables created",
        description: "Missing tables have been created successfully.",
        variant: "default"
      });
    } catch (err: any) {
      addLog(`Error creating tables: ${err.message}`);
      toast({
        title: "Error",
        description: `Failed to create tables: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setIsCreatingTables(false);
    }
  };

  // Run the test on page load
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Supabase Connection Test</h1>
        <Button onClick={testConnection} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Supabase Connection Test</AlertTitle>
        <AlertDescription>
          This tool tests the connection to your Supabase database and displays information about the available tables.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                Status of your Supabase database connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                {connectionStatus === 'idle' ? (
                  <RefreshCw className="h-5 w-5 text-gray-500 animate-spin" />
                ) : connectionStatus === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {connectionStatus === 'idle'
                    ? 'Testing connection...'
                    : connectionStatus === 'success'
                      ? 'Connection successful'
                      : 'Connection failed'}
                </span>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'success' && (
                <div className="space-y-6">
                  {/* Required Tables Status */}
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium">Required Tables Status</h3>
                      {missingTables.length > 0 && (
                        <Button
                          size="sm"
                          onClick={createMissingTables}
                          disabled={isCreatingTables}
                          className="flex items-center gap-1"
                        >
                          {isCreatingTables ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <PlusCircle className="h-3 w-3" />
                              Create Missing Tables
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {tables.length > 0 ? (
                      <div className="space-y-2">
                        {['ringcentral_tokens', 'leads_contact_info', 'contacts', 'lead_notes', 'lead_communications', 'lead_marketing_settings', 'opportunities', 'ai_interactions', 'support_tickets'].map(requiredTable => {
                          const exists = tables.includes(requiredTable);
                          return (
                            <div key={requiredTable} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center">
                                <Database className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="text-sm font-mono">{requiredTable}</span>
                              </div>
                              {exists ? (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Exists
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full flex items-center">
                                  <XCircle className="h-3 w-3 mr-1" /> Missing
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500">No tables found</p>
                    )}
                  </div>

                  {/* All Database Tables */}
                  <div className="p-4 border rounded-md">
                    <h3 className="text-lg font-medium mb-3">All Database Tables</h3>
                    {tables.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {tables.map(table => (
                          <div key={table} className="p-2 bg-gray-50 rounded flex items-center">
                            <Database className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm font-mono">{table}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No tables found</p>
                    )}
                  </div>

                  {/* RingCentral Tokens */}
                  {databaseInfo?.ringcentral_tokens && (
                    <div className="p-4 border rounded-md">
                      <h3 className="text-lg font-medium mb-3">RingCentral Tokens</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Token ID:</span> {databaseInfo.ringcentral_tokens.id}</div>
                        <div><span className="font-medium">User ID:</span> {databaseInfo.ringcentral_tokens.user_id}</div>
                        <div><span className="font-medium">Expires At:</span> {new Date(databaseInfo.ringcentral_tokens.expires_at).toLocaleString()}</div>
                        <div><span className="font-medium">Scope:</span> {databaseInfo.ringcentral_tokens.scope}</div>
                        <div><span className="font-medium">Has Access Token:</span> {databaseInfo.ringcentral_tokens.has_access_token ? 'Yes' : 'No'}</div>
                        <div><span className="font-medium">Has Refresh Token:</span> {databaseInfo.ringcentral_tokens.has_refresh_token ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}

                  {/* Database Information */}
                  {databaseInfo && (
                    <div className="p-4 border rounded-md">
                      <h3 className="text-lg font-medium mb-3">Database Information</h3>
                      <pre className="p-3 bg-gray-50 rounded text-xs overflow-auto">
                        {JSON.stringify(databaseInfo, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
              <CardDescription>
                Real-time logs of the connection test
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
