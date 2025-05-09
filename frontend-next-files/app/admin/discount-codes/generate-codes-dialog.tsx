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

interface GenerateCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GenerateCodesDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: GenerateCodesDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    count: 5,
    prefix: '',
    codeLength: 8,
    discount_type: 'percentage',
    discount_percent: 10,
    discount_amount: 0,
    max_uses: 1,
    expires_at: null as Date | null,
    is_active: true,
    is_one_time_use: true,
    campaign_id: '',
    min_purchase_amount: null as number | null,
    applicable_plan: null as string[] | null,
    description: 'Generated discount code'
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
      if (formData.count < 1 || formData.count > 100) {
        throw new Error('Number of codes must be between 1 and 100');
      }
      
      if (formData.codeLength < 4 || formData.codeLength > 20) {
        throw new Error('Code length must be between 4 and 20');
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
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : null
      };
      
      // Send to API
      const response = await fetch('/api/admin/discount-codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate discount codes');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Successfully generated ${result.data.length} discount codes`,
      });
      
      onSuccess();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to generate discount codes',
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
            <DialogTitle>Generate Discount Codes</DialogTitle>
            <DialogDescription>
              Generate multiple discount codes at once for campaigns or bulk distribution.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Number of Codes</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.count}
                  onChange={(e) => handleChange('count', parseInt(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix (Optional)</Label>
                <Input
                  id="prefix"
                  placeholder="e.g., SUMMER-"
                  value={formData.prefix}
                  onChange={(e) => handleChange('prefix', e.target.value.toUpperCase())}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="codeLength">Code Length</Label>
                <Input
                  id="codeLength"
                  type="number"
                  min="4"
                  max="20"
                  value={formData.codeLength}
                  onChange={(e) => handleChange('codeLength', parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
              
              {formData.discount_type === 'percentage' ? (
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
              ) : formData.discount_type === 'fixed_amount' ? (
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
              ) : (
                <div className="space-y-2">
                  <Label>Free Trial</Label>
                  <p className="text-sm text-gray-500">
                    Users will get a free trial period.
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Uses Per Code</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  placeholder="1"
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
                placeholder="Enter a description for these discount codes"
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
              {loading ? 'Generating...' : 'Generate Codes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
