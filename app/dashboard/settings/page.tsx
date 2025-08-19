'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelector as ColorThemeSelector } from "@/components/theme-selector";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Paintbrush } from "lucide-react";

import { isRingCentralAuthenticated, authenticateWithRingCentral } from "@/utils/ringcentral";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("appearance");
  const [isRingCentralAuth, setIsRingCentralAuth] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Check RingCentral authentication status
  useEffect(() => {
    const checkRingCentralAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const isAuthenticated = await isRingCentralAuthenticated();
        setIsRingCentralAuth(isAuthenticated);
      } catch (error) {
        console.error('Error checking RingCentral authentication:', error);
        setIsRingCentralAuth(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkRingCentralAuth();
  }, []);

  // Handle RingCentral authentication
  const handleRingCentralAuth = async () => {
    if (isRingCentralAuth) {
      // Show error message for reconnect attempt
      toast({
        title: "Already authenticated",
        description: "You are already authenticated with RingCentral.",
      });
      return;
    }

    try {
      authenticateWithRingCentral('/dashboard/settings');
    } catch (error) {
      console.error('Error authenticating with RingCentral:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate with RingCentral. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle RingCentral disconnect
  const handleRingCentralDisconnect = async () => {
    if (!isRingCentralAuth) {
      toast({
        title: "Not connected",
        description: "You are not currently connected to RingCentral.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCheckingAuth(true);
      
      const response = await fetch('/api/ringcentral/auth?action=logout', {
        method: 'GET',
      });

      if (response.ok) {
        setIsRingCentralAuth(false);
        toast({
          title: "Disconnected successfully",
          description: "You have been disconnected from RingCentral.",
        });
      } else {
        throw new Error('Failed to disconnect from RingCentral');
      }
    } catch (error) {
      console.error('Error disconnecting from RingCentral:', error);
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect from RingCentral. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Handle RingCentral button click (connect or disconnect)
  const handleRingCentralButtonClick = () => {
    if (isRingCentralAuth) {
      handleRingCentralDisconnect();
    } else {
      handleRingCentralAuth();
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header section with consistent page padding */}
      <div className="flex-shrink-0 p-2 sm:p-4">
        <div className="max-w-screen-2xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content section with the same padding as Dashboard */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 pt-0">
        <div className="max-w-screen-2xl mx-auto w-full">
          <Tabs defaultValue="appearance" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dark Mode</CardTitle>
              <CardDescription>
                Choose between light and dark mode, or use system preference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Color theme selector */}
          <ColorThemeSelector />
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Account settings will be added in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Telephony Integrations</CardTitle>
              <CardDescription>
                Connect your telephony services to enable calling and messaging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* RingCentral Integration */}
                <div className="border rounded-lg p-6 transition-all hover:shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    {isCheckingAuth ? (
                      <Badge variant="outline" className="animate-pulse">
                        Checking...
                      </Badge>
                    ) : isRingCentralAuth ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        <XCircle className="h-3 w-3 mr-1" /> Not Connected
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <div
                      className="relative w-48 h-24 cursor-pointer transition-transform hover:scale-105"
                      onClick={handleRingCentralButtonClick}
                      style={{
                        filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))',
                      }}
                    >
                      <Image
                        src="/images/ringcentral_logo.svg"
                        alt="RingCentral Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </div>

                    <div className="text-center">
                      <h3 className="font-medium text-lg mb-1">RingCentral</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect to RingCentral for voice calling and SMS messaging
                      </p>

                      <Button
                        onClick={handleRingCentralButtonClick}
                        variant={isRingCentralAuth ? "destructive" : "default"}
                        className="w-full"
                        disabled={isCheckingAuth}
                      >
                        {isCheckingAuth ? "Processing..." : (isRingCentralAuth ? "Disconnect" : "Connect")}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Twilio Integration - Coming Soon */}
                <div className="border rounded-lg p-6 transition-all relative overflow-hidden opacity-60">
                  <div className="absolute top-0 right-0 p-2">
                    <Badge variant="outline" className="text-gray-500">
                      Coming Soon
                    </Badge>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-48 h-24 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-400">Twilio</span>
                    </div>

                    <div className="text-center">
                      <h3 className="font-medium text-lg mb-1">Twilio</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect to Twilio for voice calling and SMS messaging
                      </p>

                      <Button
                        disabled
                        variant="outline"
                        className="w-full"
                      >
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Telnyx Integration - Coming Soon */}
                <div className="border rounded-lg p-6 transition-all relative overflow-hidden opacity-60">
                  <div className="absolute top-0 right-0 p-2">
                    <Badge variant="outline" className="text-gray-500">
                      Coming Soon
                    </Badge>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-48 h-24 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-400">Telnyx</span>
                    </div>

                    <div className="text-center">
                      <h3 className="font-medium text-lg mb-1">Telnyx</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect to Telnyx for voice calling and SMS messaging
                      </p>

                      <Button
                        disabled
                        variant="outline"
                        className="w-full"
                      >
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings will be added in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}
