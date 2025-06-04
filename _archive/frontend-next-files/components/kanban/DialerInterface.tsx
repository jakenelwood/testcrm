'use client';

import { Lead } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { makeRingCentralCall } from "@/utils/ringcentral";
import supabase from "@/utils/supabase/client";

interface DialerInterfaceProps {
  lead: Lead;
  onClose: () => void;
}

export function DialerInterface({ lead, onClose }: DialerInterfaceProps) {
  const { toast } = useToast();

  const handleClose = () => {
    console.log("DialerInterface: handleClose called from button");
    onClose();
  };

  const handleMakeCall = async () => {
    console.log("DialerInterface: Call button specifically clicked");
    const phoneNumberToCall = lead.phone_number;
    const ringCentralFromNumber = process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER;

    if (!phoneNumberToCall) {
      toast({
        title: "Error",
        description: "No phone number available for this lead.",
        variant: "destructive",
      });
      return;
    }

    if (!ringCentralFromNumber) {
      toast({
        title: "Configuration Error",
        description: "RingCentral calling number is not configured.",
        variant: "destructive",
      });
      console.error("RingCentral from number is not configured.");
      return;
    }

    toast({
      title: "Initiating call...",
      description: `Calling ${phoneNumberToCall} via RingCentral`,
    });

    try {
      await makeRingCentralCall(phoneNumberToCall, ringCentralFromNumber);
      toast({
        title: "Call initiated",
        description: "You should receive a call on your phone shortly.",
      });

      const { error: commError } = await supabase
        .from('lead_communications')
        .insert({
          lead_id: lead.id,
          type_id: 3,
          direction: 'Outbound',
          content: `RingCentral call initiated to ${phoneNumberToCall}`,
          created_by: 'User',
          created_at: new Date().toISOString(),
        });

      if (commError) {
        console.error('Error logging communication:', commError);
        toast({
          title: "Logging Error",
          description: "Call initiated but failed to log communication. See console.",
          variant: "destructive",
        });
      } else {
        console.log("Call communication logged.");
      }

    } catch (error) {
      console.error('RingCentral call error:', error);
      toast({
        title: "Call failed",
        description: typeof error === 'string' ? error : (error as Error)?.message || "Failed to initiate RingCentral call. See console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 pointer-events-auto"
      onClick={(e) => { 
        console.log("DialerInterface: Click on main overlay div registered!");
        e.stopPropagation(); 
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold mb-4">Dialer Interface</h2>
        <p className="mb-2">Calling: {lead.first_name} {lead.last_name}</p>
        <p className="mb-4">Phone: {lead.phone_number || 'N/A'}</p>
        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 text-lg"
            onClick={handleMakeCall}
          >
            Call
          </Button>
          <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleClose}>
            Hang Up
          </Button>
        </div>
      </div>
    </div>
  );
} 