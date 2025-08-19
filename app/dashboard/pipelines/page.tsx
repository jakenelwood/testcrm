'use client';

import { useState } from 'react';
// import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
// import { useToast } from "@/components/ui/use-toast";
import { useOpportunities } from "@/contexts/opportunity-context";
import { OpportunityKanbanBoard } from "@/components/kanban/OpportunityKanbanBoard";
import { OpportunityListView } from "@/components/opportunities/OpportunityListView";
import { CreateOpportunityModal } from "@/components/opportunities/CreateOpportunityModal";
import { OpportunityDetailsModal } from "@/components/opportunities/OpportunityDetailsModal";
import { DevelopmentModeBanner } from "@/components/ui/development-mode-banner";
import { BarChart3, Users, Search, LayoutGrid, List } from "lucide-react";

export default function OpportunitiesPage() {
  const { opportunities, isLoading, refreshOpportunities } = useOpportunities();
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  // const { toast } = useToast();

  // Handle opportunity selection
  const handleOpportunitySelect = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowOpportunityModal(true);
  };

  // Handle opportunity updated
  const handleOpportunityUpdated = (updatedOpportunity: any) => {
    setSelectedOpportunity(updatedOpportunity);
    refreshOpportunities(); // Refresh the list to show updated data
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowOpportunityModal(false);
    setSelectedOpportunity(null);
  };

  // Filter opportunities based on search query
  const filteredOpportunities = opportunities.filter(opportunity => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      opportunity.name.toLowerCase().includes(searchLower) ||
      (opportunity.contact?.firstName?.toLowerCase().includes(searchLower)) ||
      (opportunity.contact?.lastName?.toLowerCase().includes(searchLower)) ||
      (opportunity.contact?.email?.toLowerCase().includes(searchLower)) ||
      (opportunity.account?.name?.toLowerCase().includes(searchLower)) ||
      (opportunity.currentCarrier?.toLowerCase().includes(searchLower)) ||
      (opportunity.insuranceTypes?.some(type => type.toLowerCase().includes(searchLower)))
    );
  });

  // Calculate summary statistics
  const totalOpportunities = filteredOpportunities.length;
  const totalValue = filteredOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const avgProbability = filteredOpportunities.length > 0
    ? filteredOpportunities.reduce((sum, opp) => sum + opp.probability, 0) / filteredOpportunities.length
    : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden" role="main">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-2 sm:p-4"><div className="max-w-screen-2xl mx-auto w-full space-y-4">
        {/* Development Mode Banner */}
        <DevelopmentModeBanner
          message="Connected to Supabase database. Some tables may be missing or have permission issues."
          onRefresh={() => window.location.reload()}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
            <p className="text-muted-foreground">Manage your opportunities through the sales process</p>
          </div>
          <CreateOpportunityModal />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex-shrink-0">
            <ToggleGroup type="single" value={currentView} onValueChange={(value) => value && setCurrentView(value as 'kanban' | 'list')}>
              <ToggleGroupItem value="kanban" aria-label="Toggle Kanban view">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Toggle List view">
                <List className="h-4 w-4 mr-2" />
                List
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOpportunities}</div>
              <p className="text-xs text-muted-foreground">
                Active opportunities in pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total potential revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Probability</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgProbability.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Average win probability
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
        </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden p-2 sm:p-4 pt-0">
        <div className="max-w-screen-2xl mx-auto w-full">

        {currentView === 'kanban' ? (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Opportunity Pipeline</CardTitle>
              <CardDescription>
                Drag opportunities between stages to update their status
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full p-0">
              <OpportunityKanbanBoard onOpportunitySelect={handleOpportunitySelect} />
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Opportunities List</CardTitle>
              <CardDescription>
                View and manage all opportunities in a table format
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <OpportunityListView
                opportunities={filteredOpportunities}
                isLoading={isLoading}
                onOpportunitySelect={handleOpportunitySelect}
              />
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Opportunity Details Modal */}
      {showOpportunityModal && selectedOpportunity && (
        <OpportunityDetailsModal
          isOpen={showOpportunityModal}
          onClose={handleModalClose}
          opportunity={selectedOpportunity}
          onOpportunityUpdated={handleOpportunityUpdated}
        />
      )}
    </div>
  );
}
