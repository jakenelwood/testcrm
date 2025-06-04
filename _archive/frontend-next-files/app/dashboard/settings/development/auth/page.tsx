'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, UserCheck } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Authentication Testing</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        Test and configure authentication systems and user management.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-[#0047AB]" />
              Authentication Test
            </CardTitle>
            <CardDescription>
              Test authentication flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test authentication with Supabase and RingCentral, and manage user accounts.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/settings/development/auth-test">
                Test Authentication
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <UserCheck className="mr-2 h-5 w-5 text-[#0047AB]" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tools for managing user accounts, roles, and permissions.
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
