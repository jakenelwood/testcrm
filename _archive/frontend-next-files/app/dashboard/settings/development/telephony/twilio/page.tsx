'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Settings2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TwilioPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Twilio Integration</h1>
      </div>

      <Alert className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          Twilio integration is currently under development and will be available soon.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Phone className="mr-2 h-5 w-5 text-[#F22F46]" />
              Voice Calling
            </CardTitle>
            <CardDescription>
              Test Twilio voice calling features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test Twilio's voice calling functionality for making phone calls.
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-[#F22F46]" />
              SMS Messaging
            </CardTitle>
            <CardDescription>
              Test Twilio SMS messaging features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test sending SMS messages through Twilio.
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Settings2 className="mr-2 h-5 w-5 text-[#F22F46]" />
              Configuration
            </CardTitle>
            <CardDescription>
              Configure Twilio integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure your Twilio account settings and credentials.
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
