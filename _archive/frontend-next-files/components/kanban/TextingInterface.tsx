'use client';

import { Lead } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface TextingInterfaceProps {
  lead: Lead;
  onClose: () => void;
}

export function TextingInterface({ lead, onClose }: TextingInterfaceProps) {
  const handleClose = () => {
    console.log("TextingInterface: handleClose called");
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 pointer-events-auto"
      onClick={(e) => { 
        // Assuming similar logging as DialerInterface if needed
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
        <h2 className="text-xl font-semibold mb-4">Texting Interface</h2>
        <p className="mb-1">To: {lead.first_name} {lead.last_name}</p>
        <p className="mb-3 text-sm text-gray-500">Phone: {lead.phone_number}</p>
        <Textarea placeholder="Enter your message..." rows={4} className="mb-4" />
        {/* Add actual texting UI elements here */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
} 