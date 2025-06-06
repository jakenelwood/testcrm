'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Settings2, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function TelephonyPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Telephony & SMS</h1>
          <p className="text-muted-foreground">Manage calls, SMS, and telephony integrations</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SMS Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">5,678</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">892</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">94.2%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center text-foreground">
              <Phone className="mr-2 h-5 w-5 text-primary" />
              Make a Call
            </CardTitle>
            <CardDescription>
              Initiate calls directly from the CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Make calls to leads and clients using integrated telephony.
            </p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/dashboard/settings/development/ringcentral-test-call">
                <Phone className="mr-2 h-4 w-4" />
                Test Call Feature
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center text-foreground">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Send SMS
            </CardTitle>
            <CardDescription>
              Send text messages to contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Send SMS messages to leads and clients for quick communication.
            </p>
            <Button asChild variant="outline" className="w-full border-border hover:bg-accent">
              <Link href="/dashboard/settings/development/ringcentral-test-sms">
                <MessageSquare className="mr-2 h-4 w-4" />
                Test SMS Feature
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center text-foreground">
              <Settings2 className="mr-2 h-5 w-5 text-primary" />
              Configuration
            </CardTitle>
            <CardDescription>
              Manage telephony settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure RingCentral integration and telephony settings.
            </p>
            <Button asChild variant="outline" className="w-full border-border hover:bg-accent">
              <Link href="/dashboard/settings/development/telephony">
                <Settings2 className="mr-2 h-4 w-4" />
                Telephony Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Development Tools */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Development & Testing Tools</CardTitle>
          <CardDescription>
            Tools for testing and debugging telephony integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-border hover:bg-accent">
              <Link href="/dashboard/settings/development/ringcentral-test-call">
                <Phone className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground">Test Call</span>
                <span className="text-xs text-muted-foreground text-center">Test RingCentral calling</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-border hover:bg-accent">
              <Link href="/dashboard/settings/development/ringcentral-test-sms">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground">Test SMS</span>
                <span className="text-xs text-muted-foreground text-center">Test SMS messaging</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-border hover:bg-accent">
              <Link href="/dashboard/settings/development/ringout-demo">
                <Phone className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground">RingOut Demo</span>
                <span className="text-xs text-muted-foreground text-center">Advanced calling demo</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 border-border hover:bg-accent">
              <Link href="/dashboard/settings/development/ringcentral-diagnostics">
                <Settings2 className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground">Diagnostics</span>
                <span className="text-xs text-muted-foreground text-center">Debug integration issues</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 