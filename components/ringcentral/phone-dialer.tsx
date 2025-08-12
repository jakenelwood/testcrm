'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, X, PhoneOff, ChevronDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Caller ID options
type CallerIdType = 'default' | 'direct' | 'company' | 'custom' | 'blocked';

interface PhoneDialerProps {
  phoneNumber?: string;
  onCallComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  className?: string;
  showAdvancedOptions?: boolean;
}

export function PhoneDialer({
  phoneNumber: initialPhoneNumber = '',
  onCallComplete,
  size = 'md',
  variant = 'default',
  className,
  showAdvancedOptions = false
}: PhoneDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [callerIdType, setCallerIdType] = useState<CallerIdType>('default');
  const [customCallerId, setCustomCallerId] = useState('');

  // Format phone number as user types
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits, plus sign at the beginning, and parentheses
    const value = e.target.value.replace(/[^\d+() -]/g, '');
    setPhoneNumber(value);
  };

  // Make a call using RingOut
  const makeCall = async () => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      toast({
        title: "Phone number required",
        description: "Please enter a valid phone number to call.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCallInProgress(true);
      setCallStatus('Initiating call...');

      // Prepare the request payload
      const payload: any = {
        phoneNumber,
      };

      // Add caller ID information if not using default
      if (callerIdType !== 'default') {
        payload.callerIdType = callerIdType;

        // If using custom caller ID, include the number
        if (callerIdType === 'custom' && customCallerId) {
          payload.customCallerId = customCallerId;
        }
      }

      const response = await fetch('/api/ringcentral/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.message || 'Failed to make call');
      }

      const callId = data.callId;
      setCallStatus('Call initiated');
      toast({
        title: "Call initiated",
        description: "RingCentral is calling your phone. Answer to connect to the destination number.",
      });

      // Poll the call status to provide real-time updates
      let statusCheckCount = 0;
      const maxStatusChecks = 10; // Check for up to 30 seconds (10 checks * 3 seconds)
      let consecutiveErrors = 0;
      let isRateLimited = false;
      let rateLimitBackoff = 5000; // Start with 5 seconds backoff

      const checkStatus = async () => {
        if (statusCheckCount >= maxStatusChecks) {
          setIsCallInProgress(false);
          setCallStatus('Call timed out');
          return;
        }

        try {
          // If we're rate limited, use exponential backoff
          if (isRateLimited) {
            console.log(`[${new Date().toISOString()}] Rate limited, waiting ${rateLimitBackoff/1000} seconds before retry`);
            await new Promise(resolve => setTimeout(resolve, rateLimitBackoff));
            // Increase backoff for next time (exponential backoff)
            rateLimitBackoff = Math.min(rateLimitBackoff * 2, 30000); // Max 30 seconds
            isRateLimited = false;
          }

          const statusResponse = await fetch(`/api/ringcentral/call-status?callId=${callId}&verbose=true`);

          if (statusResponse.ok) {
            consecutiveErrors = 0; // Reset error counter on success
            const statusData = await statusResponse.json();

            // Check if we have valid status data
            if (!statusData.data || !statusData.data.status) {
              console.log('Call status data incomplete:', statusData);
              statusCheckCount++;
              setTimeout(checkStatus, 3000);
              return;
            }

            const status = statusData.data.status;
            console.log(`[${new Date().toISOString()}] Call status:`, status);

            if (status.callStatus === 'Success') {
              setCallStatus('Call connected');
              setTimeout(() => {
                setIsCallInProgress(false);
                setCallStatus(null);
                if (onCallComplete) {
                  onCallComplete();
                }
              }, 2000);
              return;
            } else if (status.callStatus === 'InProgress') {
              if (status.callerStatus === 'Success' && status.calleeStatus === 'InProgress') {
                setCallStatus('Phone answered, connecting to destination...');
              } else {
                setCallStatus('Calling your phone...');
              }
              statusCheckCount++;
              setTimeout(checkStatus, 3000); // Check again in 3 seconds
            } else if (status.callStatus === 'Failed' || status.callStatus === 'Busy') {
              setIsCallInProgress(false);
              setCallStatus(`Call ${status.callStatus.toLowerCase()}`);
              toast({
                title: `Call ${status.callStatus.toLowerCase()}`,
                description: "The call could not be completed.",
                variant: "destructive"
              });
            } else {
              statusCheckCount++;
              setTimeout(checkStatus, 3000); // Check again in 3 seconds
            }
          } else {
            // Check for rate limiting (429 status)
            if (statusResponse.status === 429) {
              console.log(`[${new Date().toISOString()}] Rate limited by RingCentral API`);
              isRateLimited = true;
              statusCheckCount++;
              setTimeout(checkStatus, 1000); // Try again soon with backoff applied
              return;
            }

            // Handle authentication errors
            if (statusResponse.status === 401) {
              console.log(`[${new Date().toISOString()}] Authentication error checking call status`);
              setCallStatus('Authentication error. Please try again.');

              // If we get multiple auth errors, end the call status checking
              consecutiveErrors++;
              if (consecutiveErrors >= 3) {
                setIsCallInProgress(false);
                toast({
                  title: "Authentication error",
                  description: "Could not verify call status due to authentication issues.",
                  variant: "destructive"
                });
                return;
              }
            }

            // For other errors, continue polling with increasing delay
            console.log(`[${new Date().toISOString()}] Error checking call status: ${statusResponse.status}`);
            statusCheckCount++;
            setTimeout(checkStatus, 3000 + (consecutiveErrors * 1000)); // Increase delay with each error
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error checking call status:`, error);
          consecutiveErrors++;
          statusCheckCount++;

          // Use longer delay after errors
          const delay = 3000 + (consecutiveErrors * 1000);
          console.log(`Retrying in ${delay/1000} seconds...`);
          setTimeout(checkStatus, delay);
        }
      };

      // Start checking the call status
      setTimeout(checkStatus, 2000); // Start checking after 2 seconds

    } catch (error: any) {
      console.error('Error making call:', error);
      setCallStatus('Call failed');
      toast({
        title: "Call failed",
        description: error.message || "There was an error making the call. Please try again.",
        variant: "destructive"
      });

      // Reset after error
      setTimeout(() => {
        setIsCallInProgress(false);
        setCallStatus(null);
      }, 3000);
    }
  };

  // Cancel the call
  const cancelCall = () => {
    setIsCallInProgress(false);
    setCallStatus('Call cancelled');

    toast({
      title: "Call cancelled",
      description: "The call has been cancelled.",
    });

    setTimeout(() => {
      setCallStatus(null);
    }, 2000);
  };

  // Size classes for the component
  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex space-x-2">
        <Input
          type="tel"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          className={cn(sizeClasses[size])}
          disabled={isCallInProgress}
        />

        {!isCallInProgress ? (
          <Button
            onClick={makeCall}
            variant={variant}
            size={size === 'md' ? 'default' : size}
            className="flex items-center"
            disabled={!phoneNumber || isCallInProgress}
          >
            <Phone className="mr-2 h-4 w-4" />
            Call
          </Button>
        ) : (
          <Button
            onClick={cancelCall}
            variant="destructive"
            size={size === 'md' ? 'default' : size}
            className="flex items-center"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>

      {callStatus && (
        <div className="text-sm text-muted-foreground">
          Status: {callStatus}
        </div>
      )}

      {showAdvancedOptions && (
        <Collapsible
          open={isAdvancedOpen}
          onOpenChange={setIsAdvancedOpen}
          className="w-full space-y-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex w-full justify-between p-2">
              <span>Advanced Options</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                isAdvancedOpen ? "rotate-180" : ""
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-1">
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Caller ID</label>
                <Select
                  value={callerIdType}
                  onValueChange={(value) => setCallerIdType(value as CallerIdType)}
                >
                  <SelectTrigger className={cn(sizeClasses[size])}>
                    <SelectValue placeholder="Select caller ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Number</SelectItem>
                    <SelectItem value="direct">Direct Number</SelectItem>
                    <SelectItem value="company">Company Number</SelectItem>
                    <SelectItem value="custom">Custom Number</SelectItem>
                    <SelectItem value="blocked">Blocked (Private)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {callerIdType === 'custom' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Custom Caller ID</label>
                  <Input
                    type="tel"
                    placeholder="Enter custom caller ID"
                    value={customCallerId}
                    onChange={(e) => setCustomCallerId(e.target.value.replace(/[^\d+() -]/g, ''))}
                    className={cn(sizeClasses[size])}
                    disabled={isCallInProgress}
                  />
                  <p className="text-xs text-muted-foreground">
                    Note: Custom caller ID must be a verified number in your RingCentral account.
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
