'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useOpportunities, OpportunityProvider } from "@/contexts/opportunity-context";
import { OpportunityKanbanBoard } from "@/components/kanban/OpportunityKanbanBoard";
import { OpportunityListView } from "@/components/opportunities/OpportunityListView";
import { CreateOpportunityModal } from "@/components/opportunities/CreateOpportunityModal";
import { OpportunityDetailsModal } from "@/components/opportunities/OpportunityDetailsModal";
import { DevelopmentModeBanner } from "@/components/ui/development-mode-banner";
import { BarChart3, Users, Search, LayoutGrid, List } from "lucide-react";

function OpportunitiesPageContent() {
  const { opportunities, isLoading, refreshOpportunities } = useOpportunities();
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle opportunity selection
  const handleOpportunitySelect = (opportunity: any) => {
    console.log('handleOpportunitySelect called with:', opportunity);
    setSelectedOpportunity(opportunity);
    setShowOpportunityModal(true);
    console.log('Modal state set to true');
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowOpportunityModal(false);
    setSelectedOpportunity(null);
  };

  // Handle opportunity update
  const handleOpportunityUpdated = (updatedOpportunity: any) => {
    refreshOpportunities();
  };

  // Filter opportunities based on search query
  const filteredOpportunities = opportunities.filter(opp => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      opp.name?.toLowerCase().includes(searchLower) ||
      opp.contact?.firstName?.toLowerCase().includes(searchLower) ||
      opp.contact?.lastName?.toLowerCase().includes(searchLower) ||
      opp.account?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate summary statistics
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const totalOpportunities = opportunities.length;
  const avgProbability = opportunities.length > 0
    ? opportunities.reduce((sum, opp) => sum + opp.probability, 0) / opportunities.length
    : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden" role="main">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-2 sm:p-4">
        <div className="max-w-screen-2xl mx-auto w-full space-y-4">
          {/* Development Mode Banner */}
          <DevelopmentModeBanner
            message="Connected to Supabase database. Some tables may be missing or have permission issues."
            onRefresh={() => window.location.reload()}
          />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
              <p className="text-muted-foreground">Manage your opportunities through the sales process</p>
            </div>
            <CreateOpportunityModal />
          </div>

          {/* Search and View Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ToggleGroup type="single" value={currentView} onValueChange={(value) => value && setCurrentView(value as 'kanban' | 'list')}>
              <ToggleGroupItem value="kanban" aria-label="Toggle Kanban view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Toggle List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Pipeline value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOpportunities}</div>
                <p className="text-xs text-muted-foreground">
                  Active opportunities
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
                <CardTitle data-testid="opportunity-pipeline-heading">Opportunity Pipeline</CardTitle>
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

export default function OpportunitiesPage() {
  return (
    <OpportunityProvider>
      <OpportunitiesPageContent />
    </OpportunityProvider>
  );
}

