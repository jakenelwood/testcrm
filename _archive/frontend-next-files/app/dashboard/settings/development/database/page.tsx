'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Server } from "lucide-react";
import Link from "next/link";

export default function DatabasePage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Database Testing</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        Test and configure database connections and integrations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Database className="mr-2 h-5 w-5 text-[#3ECF8E]" />
              Supabase
            </CardTitle>
            <CardDescription>
              Test Supabase database connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test your Supabase database connection and view table information.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/settings/development/supabase-test">
                Test Supabase Connection
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Server className="mr-2 h-5 w-5 text-[#336791]" />
              PostgreSQL
            </CardTitle>
            <CardDescription>
              Direct PostgreSQL database tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tools for working directly with PostgreSQL databases.
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
