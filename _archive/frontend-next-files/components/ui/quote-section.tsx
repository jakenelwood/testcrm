'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Quote } from "@/types/lead";
import { useToast } from "@/components/ui/use-toast";
import supabase from '@/utils/supabase/client';

interface QuoteSectionProps {
  leadId: string;
  insuranceType: 'Auto' | 'Home' | 'Renters' | 'Specialty';
  existingQuote?: Quote;
  onQuoteUpdated?: (quote: Quote) => void;
  className?: string;
}

export function QuoteSection({ 
  leadId, 
  insuranceType, 
  existingQuote, 
  onQuoteUpdated,
  className = "" 
}: QuoteSectionProps) {
  const [isEditing, setIsEditing] = useState(!existingQuote);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [quoteData, setQuoteData] = useState({
    paid_in_full_amount: existingQuote?.paid_in_full_amount?.toString() || '',
    monthly_payment_amount: existingQuote?.monthly_payment_amount?.toString() || '',
    contract_term: existingQuote?.contract_term || '',
    notes: existingQuote?.notes || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setQuoteData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const quotePayload = {
        lead_id: leadId,
        insurance_type: insuranceType,
        paid_in_full_amount: quoteData.paid_in_full_amount ? parseFloat(quoteData.paid_in_full_amount) : null,
        monthly_payment_amount: quoteData.monthly_payment_amount ? parseFloat(quoteData.monthly_payment_amount) : null,
        contract_term: quoteData.contract_term || null,
        notes: quoteData.notes || null,
        is_active: true
      };

      let result;
      if (existingQuote) {
        // Update existing quote
        result = await supabase
          .from('quotes')
          .update(quotePayload)
          .eq('id', existingQuote.id)
          .select()
          .single();
      } else {
        // Create new quote
        result = await supabase
          .from('quotes')
          .insert(quotePayload)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Quote saved",
        description: `${insuranceType} quote has been ${existingQuote ? 'updated' : 'created'} successfully.`,
      });

      setIsEditing(false);
      if (onQuoteUpdated) {
        onQuoteUpdated(result.data);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Error",
        description: "Failed to save quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (existingQuote) {
      setQuoteData({
        paid_in_full_amount: existingQuote.paid_in_full_amount?.toString() || '',
        monthly_payment_amount: existingQuote.monthly_payment_amount?.toString() || '',
        contract_term: existingQuote.contract_term || '',
        notes: existingQuote.notes || ''
      });
    } else {
      setQuoteData({
        paid_in_full_amount: '',
        monthly_payment_amount: '',
        contract_term: '',
        notes: ''
      });
    }
    setIsEditing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{insuranceType} Quote</CardTitle>
            <CardDescription>
              {existingQuote ? 'Quote information' : 'Add quote details'}
            </CardDescription>
          </div>
          {!isEditing && existingQuote && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Quote
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`paid-in-full-${insuranceType}`}>Paid in Full Amount</Label>
                <Input
                  id={`paid-in-full-${insuranceType}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quoteData.paid_in_full_amount}
                  onChange={(e) => handleInputChange('paid_in_full_amount', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`monthly-payment-${insuranceType}`}>Monthly Payment Amount</Label>
                <Input
                  id={`monthly-payment-${insuranceType}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quoteData.monthly_payment_amount}
                  onChange={(e) => handleInputChange('monthly_payment_amount', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`contract-term-${insuranceType}`}>Contract Term</Label>
              <Select 
                value={quoteData.contract_term} 
                onValueChange={(value) => handleInputChange('contract_term', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6mo">6 months</SelectItem>
                  <SelectItem value="12mo">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`quote-notes-${insuranceType}`}>Quote Notes</Label>
              <Textarea
                id={`quote-notes-${insuranceType}`}
                placeholder="Additional notes about this quote..."
                value={quoteData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Quote'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </>
        ) : existingQuote ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingQuote.paid_in_full_amount && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Paid in Full</Label>
                  <p className="text-lg font-semibold">{formatCurrency(existingQuote.paid_in_full_amount)}</p>
                </div>
              )}
              
              {existingQuote.monthly_payment_amount && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Monthly Payment</Label>
                  <p className="text-lg font-semibold">{formatCurrency(existingQuote.monthly_payment_amount)}</p>
                </div>
              )}
            </div>

            {existingQuote.contract_term && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Contract Term</Label>
                <p className="text-base">{existingQuote.contract_term === '6mo' ? '6 months' : '12 months'}</p>
              </div>
            )}

            {existingQuote.notes && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                <p className="text-base">{existingQuote.notes}</p>
              </div>
            )}

            {existingQuote.quote_date && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Quote Date</Label>
                <p className="text-sm">{new Date(existingQuote.quote_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No quote available</p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => setIsEditing(true)}
            >
              Add Quote
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
