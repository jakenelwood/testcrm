'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeTest } from "@/components/theme/theme-test";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { ThemeName } from "@/lib/themes";
import { useState, useEffect } from "react";
import { ApplyStoneTheme } from "./apply-stone-theme";
import { DirectThemeTest } from "./direct-theme-test";
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

  // Debug: Log the current theme
  console.log("Current theme in Settings page:", theme);

  // Available themes
  const themes = [
    { name: 'neutral', label: 'Neutral' },
    { name: 'stone', label: 'Stone' },
    { name: 'zinc', label: 'Zinc' },
    { name: 'gray', label: 'Gray' },
    { name: 'slate', label: 'Slate' }
  ];

  return (
    <>
      <ApplyStoneTheme />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

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
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {themes.map((t) => (
                  <Button
                    key={t.name}
                    variant={theme === t.name ? "default" : "outline"}
                    className="w-full justify-center"
                    onClick={() => {
                      console.log("Changing theme from", theme, "to", t.name);
                      setTheme(t.name as ThemeName);
                      // Debug: Check if theme was updated after a short delay
                      setTimeout(() => {
                        console.log("Theme after change:", document.documentElement.dataset.theme);
                        console.log("CSS Variables:", {
                          background: getComputedStyle(document.documentElement).getPropertyValue('--background'),
                          foreground: getComputedStyle(document.documentElement).getPropertyValue('--foreground'),
                          primary: getComputedStyle(document.documentElement).getPropertyValue('--primary')
                        });
                      }, 100);
                    }}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>

              <div className="mt-6 p-4 border rounded-md bg-muted/50">
                <h3 className="font-medium mb-4">Preview</h3>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-primary"></div>
                      <span>Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-secondary"></div>
                      <span>Secondary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-accent"></div>
                      <span>Accent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-destructive"></div>
                      <span>Destructive</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Button Examples</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="default">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="destructive">Destructive</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Card Example</h4>
                    <Card className="w-full max-w-sm">
                      <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card description text</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>This is sample content in a card.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                      onClick={handleRingCentralAuth}
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
                        onClick={handleRingCentralAuth}
                        variant={isRingCentralAuth ? "outline" : "default"}
                        className="w-full"
                      >
                        {isRingCentralAuth ? "Reconnect" : "Connect"}
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
    </>
  );
}
