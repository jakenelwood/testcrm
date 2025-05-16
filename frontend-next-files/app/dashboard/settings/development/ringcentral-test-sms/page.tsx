'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, XCircle, MessageSquare, RefreshCw, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { isRingCentralAuthenticated, authenticateWithRingCentral } from "@/utils/ringcentral";

export default function RingCentralTestSMSPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageId, setMessageId] = useState<string | null>(null);
  const [messageStatus, setMessageStatus] = useState<any>(null);
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

  // Send a test SMS
  const sendTestSMS = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number to send SMS to.",
        variant: "destructive"
      });
      return;
    }

    if (!message) {
      toast({
        title: "Message required",
        description: "Please enter a message to send.",
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
    setMessageId(null);
    setMessageStatus(null);
    
    // Stop any existing polling
    if (statusPolling) {
      clearInterval(statusPolling);
      setStatusPolling(null);
    }

    addLog(`Sending SMS to ${formattedNumber}...`);

    try {
      const response = await fetch('/api/ringcentral/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          to: formattedNumber,
          from: fromNumber,
          text: message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.message || 'Failed to send SMS');
      }

      addLog(`SMS sent successfully with ID: ${data.id}`);
      setMessageId(data.id);
      setMessageStatus({
        status: 'Sent',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "SMS Sent",
        description: "Your message has been sent successfully.",
      });

    } catch (err: any) {
      addLog(`Error sending SMS: ${err.message}`);
      
      // Check for specific error types
      if (err.message && err.message.includes('SMS')) {
        // SMS feature not available
        addLog('Error: SMS feature is not available for your RingCentral account');
        setError('SMS feature is not available for your RingCentral account. Please check your subscription.');
      } else {
        // Generic error
        setError(err.message || 'An error occurred while sending the SMS');
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to send SMS",
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
        <h1 className="text-3xl font-bold tracking-tight">RingCentral SMS Test</h1>
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>SMS Test Tool</AlertTitle>
        <AlertDescription>
          <p className="mb-2">This tool tests RingCentral's SMS functionality, allowing you to send text messages to any US phone number.</p>
          <p className="mt-2 text-sm font-medium">Note: The "from" number must be SMS-enabled in your RingCentral account.</p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Test SMS</CardTitle>
              <CardDescription>
                Enter a phone number and message to test RingCentral SMS functionality
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
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter your message here"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[100px]"
                />
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Maximum 160 characters per SMS</span>
                  <span>{message.length}/160 characters</span>
                </div>
              </div>

              <div className="mt-2">
                <Button
                  onClick={sendTestSMS}
                  disabled={isLoading || !phoneNumber || !message || !fromNumber}
                  className="flex items-center whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send SMS
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {messageStatus && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 border rounded-md bg-gray-50">
                    <h3 className="text-lg font-medium mb-2">Message Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Status:</span>
                        <span className="text-green-600">{messageStatus.status}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Sent at: {new Date(messageStatus.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
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
                Real-time logs of the SMS process
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
    </>
  );
}
