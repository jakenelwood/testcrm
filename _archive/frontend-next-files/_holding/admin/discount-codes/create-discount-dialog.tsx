'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { CalendarIcon } from "lucide-react";

interface CreateDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDiscountDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateDiscountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_percent: 10,
    discount_amount: 0,
    max_uses: null as number | null,
    expires_at: null as Date | null,
    is_active: true,
    is_one_time_use: false,
    campaign_id: '',
    min_purchase_amount: null as number | null,
    applicable_plan: null as string[] | null,
    description: ''
  });
  
  // Handle input change
  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form
      if (!formData.code) {
        throw new Error('Discount code is required');
      }
      
      if (formData.discount_type === 'percentage' && 
          (formData.discount_percent < 1 || formData.discount_percent > 100)) {
        throw new Error('Percentage discount must be between 1 and 100');
      }
      
      if (formData.discount_type === 'fixed_amount' && formData.discount_amount <= 0) {
        throw new Error('Fixed amount discount must be greater than 0');
      }
      
      // Prepare data for API
      const apiData = {
        ...formData,
        // Convert expires_at to ISO string if it exists
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : null,
        // Set appropriate discount values based on type
        discount_percent: formData.discount_type === 'percentage' ? formData.discount_percent : null,
        discount_amount: formData.discount_type === 'fixed_amount' ? formData.discount_amount : null
      };
      
      // Send to API
      const response = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create discount code');
      }
      
      toast({
        title: "Success",
        description: "Discount code created successfully",
      });
      
      // Reset form and close dialog
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_percent: 10,
        discount_amount: 0,
        max_uses: null,
        expires_at: null,
        is_active: true,
        is_one_time_use: false,
        campaign_id: '',
        min_purchase_amount: null,
        applicable_plan: null,
        description: ''
      });
      
      onSuccess();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to create discount code',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Discount Code</DialogTitle>
            <DialogDescription>
              Create a new discount code for your customers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Discount Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., SUMMER2023"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => handleChange('discount_type', value)}
                >
                  <SelectTrigger id="discount_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.discount_type === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="discount_percent">Discount Percentage</Label>
                <div className="flex items-center">
                  <Input
                    id="discount_percent"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => handleChange('discount_percent', parseInt(e.target.value))}
                    required
                  />
                  <span className="ml-2">%</span>
                </div>
              </div>
            )}
            
            {formData.discount_type === 'fixed_amount' && (
              <div className="space-y-2">
                <Label htmlFor="discount_amount">Discount Amount</Label>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <Input
                    id="discount_amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => handleChange('discount_amount', parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Maximum Uses</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.max_uses === null ? '' : formData.max_uses}
                  onChange={(e) => handleChange('max_uses', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expiration Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expires_at ? (
                        format(formData.expires_at, "PPP")
                      ) : (
                        <span>No expiration</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expires_at || undefined}
                      onSelect={(date) => handleChange('expires_at', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign_id">Campaign ID</Label>
                <Input
                  id="campaign_id"
                  placeholder="e.g., summer2023"
                  value={formData.campaign_id}
                  onChange={(e) => handleChange('campaign_id', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_purchase_amount">Minimum Purchase</Label>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <Input
                    id="min_purchase_amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="No minimum"
                    value={formData.min_purchase_amount === null ? '' : formData.min_purchase_amount}
                    onChange={(e) => handleChange('min_purchase_amount', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a description for this discount code"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_one_time_use"
                  checked={formData.is_one_time_use}
                  onCheckedChange={(checked) => handleChange('is_one_time_use', checked)}
                />
                <Label htmlFor="is_one_time_use">One-time use only</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Discount Code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
