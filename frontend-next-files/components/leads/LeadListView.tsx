'use client';

import { Lead, LeadStatus, PipelineStatus } from "@/types/lead";
import { LeadStatusDropdown } from "./LeadStatusDropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateMMDDYYYY } from "@/utils/date-format";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface LeadListViewProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadSelect: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: string) => void;
  statuses?: PipelineStatus[];
}

export function LeadListView({ leads, isLoading, onLeadSelect, onStatusChange, statuses = [] }: LeadListViewProps) {
  // Using our utility function for date formatting

  // Determine carrier badge color
  const getCarrierColor = (carrier: string | null) => {
    if (!carrier) return "bg-black text-white";

    switch (carrier.toLowerCase()) {
      case 'state farm': return "bg-red-500 text-white";
      case 'geico': return "bg-green-500 text-white";
      case 'progressive': return "bg-blue-500 text-white";
      case 'allstate': return "bg-yellow-500 text-black";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Insurance</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                Loading leads...
              </TableCell>
            </TableRow>
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No leads found. Try adjusting your search or add a new lead.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onLeadSelect(lead)}
              >
                <TableCell className="font-medium">
                  {lead.first_name} {lead.last_name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{lead.email || 'No email'}</span>
                    <span className="text-sm text-muted-foreground">{lead.phone_number || 'No phone'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{lead.insurance_type}</span>
                    {lead.current_carrier && (
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center w-fit mt-1 ${getCarrierColor(lead.current_carrier)}`}>
                        {lead.current_carrier}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDateMMDDYYYY(lead.created_at)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <LeadStatusDropdown
                    leadId={lead.id}
                    currentStatus={lead.status}
                    onStatusChange={onStatusChange}
                    statuses={statuses}
                    useColoredBadge={true}
                  />
                </TableCell>
                <TableCell>
                  {lead.assigned_to || 'Unassigned'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={`/dashboard/leads/${lead.id}`} target="_blank" rel="noopener noreferrer" title="View full lead details">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
