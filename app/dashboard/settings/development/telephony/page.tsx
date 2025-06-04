'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Settings2 } from "lucide-react";
import Link from "next/link";

export default function TelephonyPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Telephony & SMS</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        Test and configure telephony and SMS integrations for your application.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Phone className="mr-2 h-5 w-5 text-[#0047AB]" />
              RingCentral
            </CardTitle>
            <CardDescription>
              RingCentral telephony integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test and configure RingCentral integration for making calls and sending SMS messages.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/settings/development/telephony/ringcentral">
                View RingCentral Tests
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Phone className="mr-2 h-5 w-5 text-[#F22F46]" />
              Twilio
            </CardTitle>
            <CardDescription>
              Twilio telephony integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test and configure Twilio integration for making calls and sending SMS messages.
            </p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Phone className="mr-2 h-5 w-5 text-[#FF6B6C]" />
              Telnyx
            </CardTitle>
            <CardDescription>
              Telnyx telephony integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test and configure Telnyx integration for making calls and sending SMS messages.
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
