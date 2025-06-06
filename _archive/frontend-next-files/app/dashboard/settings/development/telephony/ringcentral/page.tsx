'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Settings2, Database, KeyRound } from "lucide-react";
import Link from "next/link";

export default function RingCentralPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">RingCentral Integration</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        Test and configure RingCentral integration for your application.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Phone className="mr-2 h-5 w-5 text-[#0047AB]" />
              Voice Calling
            </CardTitle>
            <CardDescription>
              Test RingCentral voice calling features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test RingCentral's RingOut functionality for making phone calls.
            </p>
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/settings/development/ringcentral-test-call">
                  <Phone className="mr-2 h-4 w-4" />
                  Test Call
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/settings/development/ringout-demo">
                  <Phone className="mr-2 h-4 w-4" />
                  RingOut Demo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-[#0047AB]" />
              SMS Messaging
            </CardTitle>
            <CardDescription>
              Test RingCentral SMS messaging features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test sending SMS messages through RingCentral.
            </p>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/settings/development/ringcentral-test-sms">
                <MessageSquare className="mr-2 h-4 w-4" />
                Test SMS
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Settings2 className="mr-2 h-5 w-5 text-[#0047AB]" />
              Diagnostics
            </CardTitle>
            <CardDescription>
              Test and diagnose RingCentral integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tools for diagnosing RingCentral integration issues.
            </p>
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/settings/development/ringcentral-diagnostics">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Diagnostics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Database className="mr-2 h-5 w-5 text-[#0047AB]" />
              Database
            </CardTitle>
            <CardDescription>
              Test RingCentral database integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test the Supabase database integration for RingCentral.
            </p>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/settings/development/supabase-test">
                <Database className="mr-2 h-4 w-4" />
                Database Test
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-[#0047AB]" />
              Authentication
            </CardTitle>
            <CardDescription>
              Test RingCentral authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test the authentication flow for RingCentral integration.
            </p>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/settings/development/auth-test">
                <KeyRound className="mr-2 h-4 w-4" />
                Auth Test
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
