'use client';

import { useState } from 'react';
import { PhoneCall } from '@/components/ui/PhoneCall';
import { SendSMS } from '@/components/ui/SendSMS';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authenticateWithRingCentral, isRingCentralAuthenticated, logoutFromRingCentral } from '@/utils/ringcentral';

export default function RingCentralTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('+16127996380'); // Default to your number for testing
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={handleAuthenticate} 
              disabled={isLoading || isAuthenticated === true}
            >
              Authenticate
            </Button>
            <Button 
              onClick={handleLogout} 
              disabled={isLoading || isAuthenticated === false}
              variant="destructive"
            >
              Logout
            </Button>
          </CardFooter>
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
                <PhoneCall 
                  phoneNumber={phoneNumber} 
                  variant="default" 
                  size="default" 
                />
                <SendSMS 
                  phoneNumber={phoneNumber} 
                  variant="outline" 
                  size="default" 
                />
              </div>
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
