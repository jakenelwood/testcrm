'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Code, Wrench, Phone } from "lucide-react";

export default function DevelopmentPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Development Tools</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Phone className="mr-2 h-5 w-5 text-[#0047AB]" />
              RingCentral RingOut Testing
            </CardTitle>
            <CardDescription>
              Debug and test RingCentral RingOut calling functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tools for testing RingCentral RingOut integration. Test authentication, diagnostics, and make test calls using RingCentral's RingOut API.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/dashboard/settings/development/ringcentral-test-call">
                  Test Call Tool
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/settings/development/ringcentral-diagnostics">
                  Diagnostics Tool
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/settings/development/ringcentral-debug">
                  OAuth Debug Tool
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Code className="mr-2 h-5 w-5 text-[#0047AB]" />
              Database Testing
            </CardTitle>
            <CardDescription>
              Test database connections and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tools for testing database connections, viewing tables, and verifying data integrity.
            </p>
            <Button asChild className="w-full">
              <a href="/dashboard/settings/development/supabase-test">
                Test Supabase Connection
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Wrench className="mr-2 h-5 w-5 text-[#0047AB]" />
              Authentication Testing
            </CardTitle>
            <CardDescription>
              Test authentication flows and user management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tools for testing authentication with Supabase and RingCentral, and managing user accounts.
            </p>
            <Button asChild className="w-full">
              <a href="/dashboard/settings/development/auth-test">
                Test Authentication
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
