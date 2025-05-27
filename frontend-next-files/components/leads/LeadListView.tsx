'use client';

import { Lead, LeadStatus, PipelineStatus } from "@/types/lead";
import { LeadStatusDropdown } from "./LeadStatusDropdown";
import { StatusFilter } from "./StatusFilter";
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
  selectedStatuses?: string[];
  onStatusFilterChange?: (statuses: string[]) => void;
}

export function LeadListView({
  leads,
  isLoading,
  onLeadSelect,
  onStatusChange,
  statuses = [],
  selectedStatuses = [],
  onStatusFilterChange
}: LeadListViewProps) {
  // Using our utility function for date formatting

  // Determine carrier badge color
  const getCarrierColor = (carrier: string | null) => {
    if (!carrier) return "bg-gradient-to-r from-gray-700 to-gray-800 text-white";

    switch (carrier.toLowerCase()) {
      case 'state farm': return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case 'geico': return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case 'progressive': return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case 'allstate': return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  return (
    <div className="rounded-lg border border-border shadow-sm overflow-hidden bg-card">
      <Table>
        <TableHeader className="bg-muted/50 border-b border-border">
          <TableRow>
            <TableHead className="font-semibold text-foreground">Name</TableHead>
            <TableHead className="font-semibold text-foreground">Contact</TableHead>
            <TableHead className="font-semibold text-foreground">Insurance</TableHead>
            <TableHead className="font-semibold text-foreground">Created</TableHead>
            <TableHead className="font-semibold text-foreground">
              <div className="flex items-center justify-between">
                <span>Status</span>
                {onStatusFilterChange && statuses.length > 0 && (
                  <StatusFilter
                    statuses={statuses}
                    selectedStatuses={selectedStatuses}
                    onStatusFilterChange={onStatusFilterChange}
                  />
                )}
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground">Assigned To</TableHead>
            <TableHead className="font-semibold text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-4 border-t-primary border-b-primary border-l-transparent border-r-transparent animate-spin mb-4"></div>
                  <p className="text-muted-foreground font-medium">Loading leads...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">No leads found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md text-center">
                    Try adjusting your search filters or add a new lead to get started.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors duration-150"
                onClick={() => onLeadSelect(lead)}
              >
                <TableCell className="font-medium text-foreground">
                  {lead.first_name} {lead.last_name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{lead.email || 'No email'}</span>
                    <span className="text-sm text-muted-foreground">{lead.phone_number || 'No phone'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{lead.insurance_type}</span>
                    {lead.current_carrier && (
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center w-fit mt-1 shadow-sm ${getCarrierColor(lead.current_carrier)}`}>
                        {lead.current_carrier}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
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
                  {lead.assigned_to ? (
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm mr-2">
                        {lead.assigned_to.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-foreground">{lead.assigned_to}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
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
