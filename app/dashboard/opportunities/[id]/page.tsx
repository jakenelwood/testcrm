'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Phone, MessageSquare, Mail, MapPin, Calendar, DollarSign, Building, User, Brain } from "lucide-react";
import { formatDateMMDDYYYY, formatCurrency } from "@/utils/date-format";
import { OpportunityDetailsModal } from "@/components/opportunities/OpportunityDetailsModal";
import supabase from '@/utils/supabase/client';
import { useToast } from "@/components/ui/use-toast";

interface OpportunityDetailPageProps {}

export default function OpportunityDetailPage({}: OpportunityDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const opportunityId = params.id as string;

  useEffect(() => {
    const fetchOpportunity = async () => {
      if (!opportunityId) return;

      try {
        setLoading(true);
        
        // Fetch opportunity with joined contact and account data
        const { data, error } = await supabase
          .from('opportunities')
          .select(`
            *,
            contact:contacts(*),
            account:accounts(*),
            pipeline:pipelines(*),
            stage:pipeline_stages(*),
            owner:users(*)
          `)
          .eq('id', opportunityId)
          .single();

        if (error) {
          console.error('Error fetching opportunity:', error);
          toast({
            title: "Error",
            description: "Failed to load opportunity details.",
            variant: "destructive"
          });
          return;
        }

        setOpportunity(data);
      } catch (error) {
        console.error('Error fetching opportunity:', error);
        toast({
          title: "Error",
          description: "Failed to load opportunity details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunity();
  }, [opportunityId, toast]);

  const handleOpportunityUpdated = (updatedOpportunity: any) => {
    setOpportunity(updatedOpportunity);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">Opportunity Not Found</h1>
          <p className="text-muted-foreground mt-2">The opportunity you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push('/dashboard/opportunities')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
      </div>
    );
  }

  const contact = opportunity.contact;
  const account = opportunity.account;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/opportunities')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {contact?.firstName} {contact?.lastName}
              {account && <span className="ml-2 text-lg font-normal text-muted-foreground">({account.name})</span>}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={opportunity.status === 'open' ? 'default' : opportunity.status === 'closed-won' ? 'success' : 'destructive'}>
                {opportunity.status}
              </Badge>
              {opportunity.stage && (
                <Badge variant="outline">{opportunity.stage.name}</Badge>
              )}
              {account && (
                <Badge variant="secondary">Business</Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Name</h4>
                  <p className="text-lg">{contact?.firstName} {contact?.lastName}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                  <div className="flex items-center space-x-2">
                    <p>{contact?.email || 'Not provided'}</p>
                    {contact?.email && (
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Phone</h4>
                  <div className="flex items-center space-x-2">
                    <p>{contact?.phone || 'Not provided'}</p>
                    {contact?.phone && (
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Date of Birth</h4>
                  <p>{contact?.dateOfBirth ? formatDateMMDDYYYY(contact.dateOfBirth) : 'Not provided'}</p>
                </div>
              </div>

              {contact?.address && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Address
                    </h4>
                    <p>{contact.address}</p>
                    <p>{contact.city}, {contact.state} {contact.zipCode}</p>
                  </div>
                </>
              )}

              {contact?.mailingAddress && contact.mailingAddress !== contact?.address && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Mailing Address</h4>
                  <p>{contact.mailingAddress}</p>
                  <p>{contact.mailingCity}, {contact.mailingState} {contact.mailingZipCode}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Information (if applicable) */}
          {account && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Business Name</h4>
                    <p className="text-lg">{account.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Business Type</h4>
                    <p>{account.businessType || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Industry</h4>
                    <p>{account.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Year Established</h4>
                    <p>{account.yearEstablished || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Annual Revenue</h4>
                    <p>{account.annualRevenue ? formatCurrency(account.annualRevenue) : 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Employees</h4>
                    <p>{account.employeeCount || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Current Carrier</h4>
                  <p>{opportunity.currentCarrier || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Total Premium</h4>
                  <p>{opportunity.premium ? formatCurrency(opportunity.premium) : 'Not specified'}</p>
                </div>
                {contact?.autoPremium && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Auto Premium</h4>
                    <p>{formatCurrency(contact.autoPremium)}</p>
                  </div>
                )}
                {contact?.homePremium && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Home Premium</h4>
                    <p>{formatCurrency(contact.homePremium)}</p>
                  </div>
                )}
                {contact?.specialtyPremium && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Specialty Premium</h4>
                    <p>{formatCurrency(contact.specialtyPremium)}</p>
                  </div>
                )}
                {account?.commercialPremium && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Commercial Premium</h4>
                    <p>{formatCurrency(account.commercialPremium)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Opportunity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Value</h4>
                <p className="text-2xl font-bold">{opportunity.value ? formatCurrency(opportunity.value) : 'Not set'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Probability</h4>
                <p>{opportunity.probability ? `${opportunity.probability}%` : 'Not set'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Expected Close Date</h4>
                <p>{opportunity.expectedCloseDate ? formatDateMMDDYYYY(opportunity.expectedCloseDate) : 'Not set'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Owner</h4>
                <p>{opportunity.owner?.firstName} {opportunity.owner?.lastName}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          {(opportunity.aiSummary || opportunity.aiNextAction || opportunity.aiQuoteRecommendation) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {opportunity.aiSummary && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
                    <p className="text-sm">{opportunity.aiSummary}</p>
                  </div>
                )}
                {opportunity.aiNextAction && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Next Action</h4>
                    <p className="text-sm">{opportunity.aiNextAction}</p>
                  </div>
                )}
                {opportunity.aiFollowUpPriority && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Follow-up Priority</h4>
                    <Badge variant={
                      opportunity.aiFollowUpPriority <= 2 ? 'destructive' : 
                      opportunity.aiFollowUpPriority <= 3 ? 'default' : 'secondary'
                    }>
                      Priority {opportunity.aiFollowUpPriority}
                    </Badge>
                  </div>
                )}
                {opportunity.aiQuoteRecommendation && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Quote Recommendation</h4>
                    <p className="text-sm">{opportunity.aiQuoteRecommendation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {opportunity.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{opportunity.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <OpportunityDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          opportunity={opportunity}
          onOpportunityUpdated={handleOpportunityUpdated}
        />
      )}
    </div>
  );
}
