'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneDialer } from "@/components/ringcentral/phone-dialer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, PhoneIcon } from "lucide-react";

export default function RingOutDemoPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">RingOut Demo</h1>
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>About RingOut</AlertTitle>
        <AlertDescription>
          RingOut is a RingCentral feature that works with any RingCentral account. It first calls your phone,
          then connects you to the destination number when you answer.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Dialer</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
          <TabsTrigger value="integration">Integration Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Phone Dialer</CardTitle>
              <CardDescription>
                Make calls using RingCentral RingOut
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Enter a phone number and click "Call" to initiate a RingOut call. RingCentral will first call your phone,
                and when you answer, it will connect you to the destination number.
              </p>

              <PhoneDialer size="lg" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Dialer</CardTitle>
              <CardDescription>
                Make calls with custom caller ID options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                This dialer includes advanced options like setting the caller ID that will be displayed to the recipient.
              </p>

              <PhoneDialer size="lg" showAdvancedOptions={true} />

              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h3 className="text-sm font-medium mb-2">Caller ID Options:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li><strong>Default Number:</strong> Uses your default RingCentral number</li>
                  <li><strong>Direct Number:</strong> Uses your direct phone number</li>
                  <li><strong>Company Number:</strong> Uses your company's main number</li>
                  <li><strong>Custom Number:</strong> Uses a verified number you specify</li>
                  <li><strong>Blocked:</strong> Hides your caller ID (appears as "Private" or "Unknown")</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Card Integration</CardTitle>
                <CardDescription>
                  Example of how the dialer can be integrated into a client card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">John Smith</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active Client</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    <div>Email: john.smith@example.com</div>
                    <div className="flex items-center">
                      <span>Phone: (612) 555-1234</span>
                      <PhoneIcon className="h-3 w-3 ml-2 text-blue-500 cursor-pointer" />
                    </div>
                  </div>
                  <PhoneDialer phoneNumber="(612) 555-1234" size="sm" variant="secondary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead List Integration</CardTitle>
                <CardDescription>
                  Example of how the dialer can be integrated into a lead list
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Sarah Johnson</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">(651) 555-9876</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            New Lead
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center text-blue-600"
                            onClick={() => {
                              // This would open the dialer with the phone number pre-filled
                              document.getElementById('demo-dialer')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <PhoneIcon className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div id="demo-dialer" className="mt-4">
                  <PhoneDialer phoneNumber="(651) 555-9876" size="sm" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

// Import Button component to avoid TypeScript errors
import { Button } from "@/components/ui/button";
