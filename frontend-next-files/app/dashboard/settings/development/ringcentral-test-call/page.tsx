'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, XCircle, PhoneIcon, RefreshCw, AlertTriangle, PhoneOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { isRingCentralAuthenticated, authenticateWithRingCentral } from "@/utils/ringcentral";

export default function RingCentralTestCallPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callId, setCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<any>(null);
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fromNumber, setFromNumber] = useState<string | null>(null);

  // Add a log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  // Get the from number from the environment
  useEffect(() => {
    // Hardcode the from number directly from the .env.local file
    const fromNumberValue = '+16124643934';
    setFromNumber(fromNumberValue);

    // Log the from number for debugging
    console.log('From number set to:', fromNumberValue);

    // Also add a log entry
    addLog(`From number set to: ${fromNumberValue}`);
  }, []);

  // Make a test call
  const makeTestCall = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number to call.",
        variant: "destructive"
      });
      return;
    }

    // Format the phone number to ensure it's a US number with +1 prefix
    let formattedNumber = phoneNumber;

    // Remove any non-digit characters for consistent processing
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // If it doesn't start with +1
    if (!phoneNumber.startsWith('+1')) {
      // If it's a 10-digit number, add +1
      if (digitsOnly.length === 10) {
        formattedNumber = `+1${digitsOnly}`;
        addLog(`Automatically added +1 country code: ${formattedNumber}`);
      }
      // If it's an 11-digit number starting with 1, add +
      else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        formattedNumber = `+${digitsOnly}`;
        addLog(`Automatically formatted to E.164: ${formattedNumber}`);
      }
      // If it already has a + but not +1, and it's a US number
      else if (phoneNumber.startsWith('+') && !phoneNumber.startsWith('+1') && digitsOnly.length >= 10) {
        // This might be a misformatted US number
        formattedNumber = `+1${digitsOnly.substring(digitsOnly.length - 10)}`;
        addLog(`Reformatted as US number: ${formattedNumber}`);
      }
    }

    // If it starts with +612, it might be misformatted (should be +1612 for US)
    if (formattedNumber.startsWith('+612')) {
      formattedNumber = `+1${formattedNumber.substring(4)}`;
      addLog(`Reformatted number from +612... to +1612... format`);
    }

    if (formattedNumber !== phoneNumber) {
      addLog(`Using reformatted phone number: ${formattedNumber}`);
      setPhoneNumber(formattedNumber);
    }

    setIsLoading(true);
    setError(null);
    setCallId(null);
    setCallStatus(null);

    // Stop any existing polling
    if (statusPolling) {
      clearInterval(statusPolling);
      setStatusPolling(null);
    }

    addLog(`Initiating call to ${formattedNumber}...`);

    try {
      const response = await fetch('/api/ringcentral/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: formattedNumber })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.message || 'Failed to make call');
      }

      addLog(`Call initiated successfully with ID: ${data.callId}`);
      setCallId(data.callId);

      // Start polling for call status
      const interval = setInterval(() => {
        pollCallStatus(data.callId);
      }, 2000);

      setStatusPolling(interval);

      // Initial status check
      pollCallStatus(data.callId);

    } catch (err: any) {
      addLog(`Error making call: ${err.message}`);

      // Check for specific error types
      if (err.message && err.message.includes('InternationalCalls')) {
        // International calling error
        addLog('Error: International calling is not enabled for your RingCentral account');
        addLog('Make sure you\'re using a US number in the format +1XXXXXXXXXX');
        setError('International calling is not enabled. Please use a US number in the format +1XXXXXXXXXX.');
      } else if (err.message && err.message.includes('CMN-113')) {
        // Feature not available error
        addLog('Error: A required feature is not available for your RingCentral account');
        setError('A required feature is not available for your RingCentral account. Please check your subscription.');
      } else {
        // Generic error
        setError(err.message || 'An error occurred while making the call');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for call status
  const pollCallStatus = async (id: string) => {
    if (!id) return;

    try {
      const response = await fetch(`/api/ringcentral/call-status?callId=${id}&verbose=true`);

      if (!response.ok) {
        const errorData = await response.json();
        addLog(`Error checking call status: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      setCallStatus(data);

      // Log status changes
      if (data.statusDescription) {
        addLog(`Call status: ${data.statusDescription}`);
      }

      // Stop polling if call is complete
      if (data.callDetails?.status?.callStatus === 'Success' ||
          data.callDetails?.status?.callStatus === 'Failed' ||
          data.callDetails?.status?.callStatus === 'Busy') {
        if (statusPolling) {
          clearInterval(statusPolling);
          setStatusPolling(null);
          addLog('Call completed, stopped status polling');
        }
      }

    } catch (err: any) {
      addLog(`Error polling call status: ${err.message}`);
    }
  };

  // Cancel call status polling
  const cancelStatusPolling = () => {
    if (statusPolling) {
      clearInterval(statusPolling);
      setStatusPolling(null);
      addLog('Status polling cancelled');
    }
  };

  // Clear call state
  const clearCallState = () => {
    setCallId(null);
    setCallStatus(null);

    // Stop polling
    if (statusPolling) {
      clearInterval(statusPolling);
      setStatusPolling(null);
    }

    addLog('Call state cleared');
  };

  // End the active call
  const endCall = async () => {
    if (!callId) {
      toast({
        title: "No active call",
        description: "There is no active call to end.",
        variant: "destructive"
      });
      return;
    }

    addLog(`Attempting to end call with ID: ${callId}...`);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ringcentral/end-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.message || 'Failed to end call');
      }

      addLog('Call ended successfully');

      // Update call status
      setCallStatus({
        ...callStatus,
        statusDescription: 'Call ended by user',
        nextStep: 'Call has been terminated',
        timestamp: new Date().toISOString()
      });

      // Stop polling
      if (statusPolling) {
        clearInterval(statusPolling);
        setStatusPolling(null);
      }

      toast({
        title: "Call Ended",
        description: "The call has been terminated successfully.",
      });

      // Clear call state after a short delay
      setTimeout(() => {
        clearCallState();
      }, 3000);

    } catch (err: any) {
      addLog(`Error ending call: ${err.message}`);
      setError(err.message || 'An error occurred while ending the call');

      toast({
        title: "Error",
        description: err.message || "Failed to end call",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [statusPolling]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">RingCentral RingOut Test</h1>
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>RingOut Test Tool</AlertTitle>
        <AlertDescription>
          <p className="mb-2">This tool tests RingCentral's RingOut functionality, which is a two-legged call process:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>RingCentral first calls your phone (the "from" number)</li>
            <li>When you answer, it connects you to the destination number</li>
          </ol>
          <p className="mt-2 text-sm font-medium">Note: The "from" number must be a Direct Number, not a Softphone.</p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Make RingOut Test Call</CardTitle>
              <CardDescription>
                Enter a phone number to test RingCentral RingOut calling functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">From Number</label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={fromNumber || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  {!fromNumber && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Missing From Number</AlertTitle>
                      <AlertDescription>
                        The from number is not configured. Check your environment variables.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">To Number</label>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="tel"
                      placeholder="Enter US phone number (e.g., 6125551234)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    US numbers will automatically be formatted with +1 country code
                  </div>
                  <div className="mt-2 flex space-x-2">
                    {!callId ? (
                      <Button
                        onClick={makeTestCall}
                        disabled={isLoading || !phoneNumber || !fromNumber}
                        className="flex items-center whitespace-nowrap"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Calling...
                          </>
                        ) : (
                          <>
                            <PhoneIcon className="mr-2 h-4 w-4" />
                            Make Call
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={endCall}
                        disabled={isLoading}
                        className="flex items-center whitespace-nowrap"
                      >
                        <PhoneOff className="mr-2 h-4 w-4" />
                        End Call
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {callStatus && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 border rounded-md bg-gray-50">
                    <h3 className="text-lg font-medium mb-2">Call Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Status:</span>
                        <span className="text-blue-600">{callStatus.statusDescription}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Next Step:</span>
                        <span>{callStatus.nextStep}</span>
                      </div>
                      {callStatus.troubleshooting && callStatus.troubleshooting.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium">Troubleshooting Tips:</span>
                          <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                            {callStatus.troubleshooting.map((tip: string, i: number) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Last updated: {new Date(callStatus.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    <div className="flex space-x-2">
                      {callId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={endCall}
                          disabled={isLoading}
                          className="flex items-center"
                        >
                          <PhoneOff className="mr-2 h-4 w-4" />
                          End Call
                        </Button>
                      )}

                      {callStatus && callStatus.statusDescription && (
                        callStatus.statusDescription.includes('ended') ||
                        callStatus.statusDescription.includes('completed') ||
                        callStatus.statusDescription.includes('failed')
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearCallState}
                          className="flex items-center"
                        >
                          <PhoneIcon className="mr-2 h-4 w-4" />
                          New Call
                        </Button>
                      )}
                    </div>

                    {statusPolling && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelStatusPolling}
                      >
                        Stop Status Updates
                      </Button>
                    )}
                  </div>
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
                Real-time logs of the call process
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <Textarea
                className="h-[400px] font-mono text-xs"
                readOnly
                value={logs.join('\n')}
              />
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogs([])}
              >
                Clear Logs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {callStatus && callStatus.callDetails && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Raw Call Data</CardTitle>
            <CardDescription>
              Technical details from the RingCentral API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="h-[200px] font-mono text-xs"
              readOnly
              value={JSON.stringify(callStatus.callDetails, null, 2)}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
