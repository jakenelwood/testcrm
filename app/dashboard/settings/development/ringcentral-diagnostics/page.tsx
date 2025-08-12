'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, XCircle, PhoneIcon, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RingCentralDiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [extensionInfo, setExtensionInfo] = useState<any>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [envConfig, setEnvConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch account info
      try {
        const accountResponse = await fetch('/api/ringcentral/account-info');
        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          setAccountInfo(accountData.accountInfo);
        } else {
          console.warn(`Failed to fetch account info: ${accountResponse.status} ${accountResponse.statusText}`);
        }
      } catch (err) {
        console.error('Error fetching account info:', err);
      }

      // Fetch extension info
      try {
        const extensionResponse = await fetch('/api/ringcentral/extension-info');
        if (extensionResponse.ok) {
          const extensionData = await extensionResponse.json();
          setExtensionInfo(extensionData.extensionInfo);
        } else {
          console.warn(`Failed to fetch extension info: ${extensionResponse.status} ${extensionResponse.statusText}`);
        }
      } catch (err) {
        console.error('Error fetching extension info:', err);
      }

      // Fetch phone numbers
      try {
        const phoneNumbersResponse = await fetch('/api/ringcentral/phone-numbers');
        if (phoneNumbersResponse.ok) {
          const phoneNumbersData = await phoneNumbersResponse.json();
          setPhoneNumbers(phoneNumbersData.phoneNumbers || []);
        } else {
          console.warn(`Failed to fetch phone numbers: ${phoneNumbersResponse.status} ${phoneNumbersResponse.statusText}`);
        }
      } catch (err) {
        console.error('Error fetching phone numbers:', err);
      }

      // Fetch permissions
      try {
        const permissionsResponse = await fetch('/api/ringcentral/permissions');
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          setPermissions(permissionsData.permissions || []);
        } else {
          console.warn(`Failed to fetch permissions: ${permissionsResponse.status} ${permissionsResponse.statusText}`);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
      }

      // Fetch environment configuration
      try {
        const envResponse = await fetch('/api/ringcentral/diagnostics');
        if (envResponse.ok) {
          const envData = await envResponse.json();
          setEnvConfig(envData);
        } else {
          console.warn(`Failed to fetch environment config: ${envResponse.status} ${envResponse.statusText}`);
        }
      } catch (err) {
        console.error('Error fetching environment config:', err);
      }

    } catch (err: any) {
      console.error('Error fetching RingCentral info:', err);
      setError(err.message || 'An error occurred while fetching RingCentral information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">RingCentral RingOut Diagnostics</h1>
        <Button
          onClick={fetchAccountInfo}
          disabled={isLoading}
          className="flex items-center"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>RingOut Diagnostics</AlertTitle>
        <AlertDescription>
          <p>This tool provides diagnostics specifically for RingCentral's RingOut functionality, which requires:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>A Direct Number (not a Softphone) as the "from" number</li>
            <li>Proper authentication with the RingOut scope</li>
            <li>Correct environment configuration</li>
          </ul>
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="account">Account Info</TabsTrigger>
          <TabsTrigger value="extension">Extension Info</TabsTrigger>
          <TabsTrigger value="numbers">Phone Numbers</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>RingCentral Configuration</CardTitle>
              <CardDescription>
                Environment variables and configuration diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : envConfig ? (
                <div className="space-y-6">
                  {/* Environment Variables */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Environment Variables</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">RINGCENTRAL_SERVER</h4>
                        <p className="text-sm">{envConfig.environment.RINGCENTRAL_SERVER || 'Not set'}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">RINGCENTRAL_FROM_NUMBER</h4>
                        <p className="text-sm">{envConfig.environment.RINGCENTRAL_FROM_NUMBER || 'Not set'}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER</h4>
                        <p className="text-sm">{envConfig.environment.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER || 'Not set'}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">REDIRECT_URI</h4>
                        <p className="text-sm">{envConfig.environment.REDIRECT_URI || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Issues */}
                  {envConfig.inconsistencies && envConfig.inconsistencies.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-yellow-500">Configuration Issues</h3>
                      <div className="space-y-4">
                        {envConfig.inconsistencies.map((issue: any, index: number) => (
                          <Alert key={index} variant="error">
                            <AlertTitle>{issue.type}</AlertTitle>
                            <AlertDescription>{issue.message}</AlertDescription>
                            {issue.values && (
                              <div className="mt-2 text-sm">
                                {Object.entries(issue.values).map(([key, value]: [string, any]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {value || 'Not set'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {envConfig.recommendations && envConfig.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Recommendations</h3>
                      <div className="space-y-4">
                        {envConfig.recommendations.map((rec: any, index: number) => (
                          <Alert key={index} variant={
                            rec.severity === 'CRITICAL' ? 'destructive' :
                            rec.severity === 'HIGH' ? 'destructive' :
                            rec.severity === 'MEDIUM' ? 'error' : 'default'
                          }>
                            <AlertTitle>{rec.issue}</AlertTitle>
                            <AlertDescription>
                              <p>{rec.action}</p>
                              {rec.details && <p className="mt-1 text-sm">{rec.details}</p>}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Authentication Status */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Authentication Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Access Token</h4>
                        <div className="flex items-center">
                          {envConfig.authentication.accessTokenPresent ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <p className="text-sm">
                            {envConfig.authentication.accessTokenPresent
                              ? `Present (${envConfig.authentication.accessTokenLength} chars)`
                              : 'Not present'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Token Expiry</h4>
                        <div className="flex items-center">
                          {!envConfig.authentication.tokenExpired ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <p className="text-sm">
                            {envConfig.authentication.tokenExpiry !== 'Not set'
                              ? `${envConfig.authentication.tokenExpired ? 'Expired' : 'Valid'} (${envConfig.authentication.tokenExpiresIn})`
                              : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!envConfig.authentication.accessTokenPresent && (
                      <div className="mt-4">
                        <Button
                          onClick={() => window.location.href = '/api/ringcentral/auth?action=authorize'}
                          className="bg-[#0047AB] hover:bg-[#003d91]"
                        >
                          Authenticate with RingCentral
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No configuration information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Details about your RingCentral account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : accountInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Account ID</h3>
                      <p className="text-sm">{accountInfo.id}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Account Name</h3>
                      <p className="text-sm">{accountInfo.name}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Status</h3>
                      <p className="text-sm">{accountInfo.status}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Type</h3>
                      <p className="text-sm">{accountInfo.type}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Service Plan</h3>
                    {accountInfo.serviceInfo?.servicePlan?.name && (
                      <p className="text-sm">{accountInfo.serviceInfo.servicePlan.name}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No account information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extension">
          <Card>
            <CardHeader>
              <CardTitle>Extension Information</CardTitle>
              <CardDescription>
                Details about your RingCentral extension
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : extensionInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Extension ID</h3>
                      <p className="text-sm">{extensionInfo.id}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Extension Number</h3>
                      <p className="text-sm">{extensionInfo.extensionNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Name</h3>
                      <p className="text-sm">{extensionInfo.name || extensionInfo.contact?.firstName + ' ' + extensionInfo.contact?.lastName}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Type</h3>
                      <p className="text-sm">{extensionInfo.type}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Status</h3>
                      <p className="text-sm">{extensionInfo.status}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {extensionInfo.permissions?.calling === 'Enabled' && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm">Calling</span>
                        </div>
                      )}
                      {extensionInfo.permissions?.ringOut === 'Enabled' && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm">RingOut</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No extension information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbers">
          <Card>
            <CardHeader>
              <CardTitle>Phone Numbers</CardTitle>
              <CardDescription>
                Phone numbers associated with your RingCentral account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : phoneNumbers && phoneNumbers.length > 0 ? (
                <div className="space-y-4">
                  {phoneNumbers.map((number, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex items-center mb-2">
                        <PhoneIcon className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-lg font-medium">{number.phoneNumber}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Type:</span> {number.type}
                        </div>
                        <div>
                          <span className="font-medium">Usage Type:</span> {number.usageType}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> {number.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No phone numbers available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Permissions for your RingCentral application
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : permissions && permissions.length > 0 ? (
                <div className="space-y-2">
                  {permissions.map((permission, index) => (
                    <div key={index} className="flex items-center p-2 border-b last:border-b-0">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{permission}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No permissions information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
