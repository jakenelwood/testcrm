'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MessageSquare } from 'lucide-react';
import { isRingCentralAuthenticated, authenticateWithRingCentral, logoutFromRingCentral, makeCall, sendSMS } from '@/utils/ringcentral';

export default function RingCentralTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('+16127996380'); // Default to your number for testing
  const [message, setMessage] = useState('This is a test message from Gonzigo CRM');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [callResult, setCallResult] = useState<any>(null);
  const [smsResult, setSmsResult] = useState<any>(null);
  const [showSmsForm, setShowSmsForm] = useState(false);

  // Check authentication status on page load
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Check if the user is authenticated with RingCentral
  const checkAuthentication = async () => {
    setIsLoading(true);
    try {
      const authenticated = await isRingCentralAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle authentication
  const handleAuthenticate = () => {
    authenticateWithRingCentral();
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutFromRingCentral();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle making a call
  const handleCall = async () => {
    setIsLoading(true);
    setCallResult(null);
    
    try {
      const result = await makeCall(phoneNumber);
      setCallResult(result);
    } catch (error) {
      console.error('Error making call:', error);
      setCallResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending SMS
  const handleSendSMS = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setSmsResult(null);
    
    try {
      const result = await sendSMS(phoneNumber, message);
      setSmsResult(result);
      
      if (result.success) {
        setTimeout(() => {
          setShowSmsForm(false);
          setSmsResult(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSmsResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RingCentral Integration Test</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Authentication Card */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Test RingCentral authentication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={checkAuthentication} 
                disabled={isLoading}
                variant="outline"
              >
                Check Authentication Status
              </Button>
              
              {isAuthenticated !== null && (
                <div className="p-3 rounded border">
                  <p>
                    Status: {isAuthenticated 
                      ? '✅ Authenticated with RingCentral' 
                      : '❌ Not authenticated with RingCentral'}
                  </p>
                </div>
              )}
              
              {isAuthenticated === false && (
                <Button 
                  onClick={handleAuthenticate}
                  disabled={isLoading}
                >
                  Authenticate with RingCentral
                </Button>
              )}
              
              {isAuthenticated === true && (
                <Button 
                  onClick={handleLogout}
                  disabled={isLoading}
                  variant="destructive"
                >
                  Logout from RingCentral
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Phone Call and SMS Card */}
        <Card>
          <CardHeader>
            <CardTitle>Make Calls & Send SMS</CardTitle>
            <CardDescription>
              Test making calls and sending SMS messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter phone number (e.g., +16127996380)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <Button 
                  onClick={handleCall}
                  disabled={isLoading || !isAuthenticated}
                  className="flex items-center"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  {isLoading ? 'Calling...' : 'Call'}
                </Button>
                
                {!showSmsForm ? (
                  <Button 
                    onClick={() => setShowSmsForm(true)}
                    disabled={isLoading || !isAuthenticated}
                    variant="outline"
                    className="flex items-center"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send SMS
                  </Button>
                ) : (
                  <div className="w-full border rounded-md p-4 shadow-sm">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="mb-2"
                    />
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSmsForm(false);
                          setSmsResult(null);
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        onClick={handleSendSMS}
                        disabled={isLoading || !message.trim()}
                      >
                        {isLoading ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {callResult && (
                <div className="mt-2 p-3 rounded border">
                  {callResult.success ? (
                    <p className="text-green-600">Call initiated successfully! Call ID: {callResult.call_id}</p>
                  ) : (
                    <p className="text-red-600">Call failed: {callResult.error}</p>
                  )}
                </div>
              )}
              
              {smsResult && (
                <div className="mt-2 p-3 rounded border">
                  {smsResult.success ? (
                    <p className="text-green-600">Message sent successfully!</p>
                  ) : (
                    <p className="text-red-600">Failed to send message: {smsResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Note: You must be authenticated with RingCentral to make calls or send SMS messages.
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Make sure your RingCentral credentials are correctly set in the <code>.env.local</code> file</li>
          <li>Ensure your RingCentral application has the correct permissions (RingOut, SMS, ReadAccounts)</li>
          <li>Verify that your redirect URI is correctly configured in the RingCentral Developer Portal</li>
          <li>Phone numbers should be in E.164 format (e.g., +16127996380)</li>
        </ul>
      </div>
    </div>
  );
}
