'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  RefreshCw,
  Download,
  Calendar,
  User,
  Tag,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from 'date-fns';

export default function DiscountCodeDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;
  
  // State for discount code
  const [discountCode, setDiscountCode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      setDiscountCode(data.data || null);
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
  
  // Handle delete discount code
  const handleDeleteCode = async () => {
    if (!confirm('Are you sure you want to delete this discount code?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete discount code');
      }
      
      toast({
        title: "Success",
        description: "Discount code deleted successfully",
      });
      
      // Navigate back to list
      router.push('/admin/discount-codes');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to delete discount code',
      });
    }
  };
  
  // Handle toggle active status
  const handleToggleActive = async () => {
    if (!discountCode) return;
    
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !discountCode.is_active
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update discount code');
      }
      
      toast({
        title: "Success",
        description: `Discount code ${!discountCode.is_active ? 'activated' : 'deactivated'} successfully`,
      });
      
      // Refresh the data
      fetchDiscountCode();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to update discount code',
      });
    }
  };
  
  // Effect to fetch discount code on mount
  useEffect(() => {
    fetchDiscountCode();
  }, [id]);
  
  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Get discount value helper
  const getDiscountValue = (code: any) => {
    if (!code) return '';
    
    if (code.discount_type === 'percentage') {
      return `${code.discount_percent}%`;
    } else if (code.discount_type === 'fixed_amount') {
      return `$${code.discount_amount.toFixed(2)}`;
    } else if (code.discount_type === 'free_trial') {
      return 'Free Trial';
    }
    return `${code.discount_percent}%`; // Default to percentage
  };
  
  if (loading) {
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
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
              <div className="h-24 bg-gray-200 rounded w-full mb-4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !discountCode) {
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
            <p className="text-gray-600 mb-6">
              {error || 'Discount code not found'}
            </p>
            <Button onClick={() => fetchDiscountCode()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
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
          onClick={() => router.push('/admin/discount-codes')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discount Codes
        </Button>
        <div className="flex gap-2">
          <Button 
            variant={discountCode.is_active ? "destructive" : "default"}
            onClick={handleToggleActive}
          >
            {discountCode.is_active ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/admin/discount-codes/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDeleteCode}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{discountCode.code}</div>
            <div className="mt-2 flex items-center">
              <Badge variant={discountCode.is_active ? "success" : "secondary"}>
                {discountCode.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {discountCode.is_one_time_use && (
                <Badge variant="outline" className="ml-2">
                  One-time use
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getDiscountValue(discountCode)}</div>
            <div className="mt-2 text-gray-500">
              {discountCode.discount_type === 'percentage' ? 'Percentage discount' : 
               discountCode.discount_type === 'fixed_amount' ? 'Fixed amount discount' : 
               'Free trial'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {discountCode.current_uses || 0} / {discountCode.max_uses || '∞'}
            </div>
            <div className="mt-2 text-gray-500">
              {discountCode.max_uses ? `Limited to ${discountCode.max_uses} uses` : 'Unlimited uses'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="details" className="mb-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Discount Code Details</CardTitle>
              <CardDescription>
                Complete information about this discount code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Tag className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <div className="font-medium">Code</div>
                        <div>{discountCode.code}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <div className="font-medium">Created</div>
                        <div>{formatDate(discountCode.created_at)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <div className="font-medium">Expires</div>
                        <div>{formatDate(discountCode.expires_at)}</div>
                      </div>
                    </div>
                    
                    {discountCode.campaign_id && (
                      <div className="flex items-start">
                        <Tag className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">Campaign</div>
                          <div>{discountCode.campaign_id}</div>
                        </div>
                      </div>
                    )}
                    
                    {discountCode.specific_user_id && (
                      <div className="flex items-start">
                        <User className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">Specific User</div>
                          <div>{discountCode.specific_user_id}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Discount Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Tag className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <div className="font-medium">Type</div>
                        <div>
                          {discountCode.discount_type === 'percentage' ? 'Percentage' : 
                           discountCode.discount_type === 'fixed_amount' ? 'Fixed Amount' : 
                           'Free Trial'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Tag className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <div className="font-medium">Value</div>
                        <div>{getDiscountValue(discountCode)}</div>
                      </div>
                    </div>
                    
                    {discountCode.min_purchase_amount && (
                      <div className="flex items-start">
                        <Tag className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">Minimum Purchase</div>
                          <div>${discountCode.min_purchase_amount.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                    
                    {discountCode.applicable_plan && discountCode.applicable_plan.length > 0 && (
                      <div className="flex items-start">
                        <Tag className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">Applicable Plans</div>
                          <div>{discountCode.applicable_plan.join(', ')}</div>
                        </div>
                      </div>
                    )}
                    
                    {discountCode.description && (
                      <div className="flex items-start">
                        <Tag className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">Description</div>
                          <div>{discountCode.description}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="redemptions">
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
              <CardDescription>
                Track how this discount code has been used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discountCode.code_redemptions && discountCode.code_redemptions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Order ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discountCode.code_redemptions.map((redemption: any) => (
                      <TableRow key={redemption.id}>
                        <TableCell>{formatDate(redemption.redeemed_at)}</TableCell>
                        <TableCell>
                          {redemption.profiles?.email || redemption.user_id}
                        </TableCell>
                        <TableCell>{redemption.order_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  This discount code has not been used yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
