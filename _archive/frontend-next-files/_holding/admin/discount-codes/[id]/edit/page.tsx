'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";

export default function EditDiscountCodePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;
  
  // State for loading and form
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Fetch discount code
  const fetchDiscountCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch discount code');
      }
      
      const data = await response.json();
      
      if (!data.data) {
        throw new Error('Discount code not found');
      }
      
      // Format the data for the form
      setFormData({
        ...data.data,
        // Convert ISO date string to Date object if it exists
        expires_at: data.data.expires_at ? new Date(data.data.expires_at) : null
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to fetch discount code',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change
  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
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
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update discount code');
      }
      
      toast({
        title: "Success",
        description: "Discount code updated successfully",
      });
      
      // Navigate back to detail view
      router.push(`/admin/discount-codes/${id}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to update discount code',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Effect to fetch discount code on mount
  useEffect(() => {
    fetchDiscountCode();
  }, [id]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/admin/discount-codes/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Discount Code
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading discount code...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/discount-codes')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Discount Codes
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => fetchDiscountCode()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/admin/discount-codes/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discount Code
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Discount Code</CardTitle>
          <CardDescription>
            Update the details for discount code: {formData.code}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
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
            
            <div className="grid grid-cols-2 gap-6">
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
            
            <div className="grid grid-cols-2 gap-6">
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
            
            <div className="flex items-center space-x-6">
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/admin/discount-codes/${id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
