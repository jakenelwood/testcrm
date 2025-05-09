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
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  RefreshCw,
  Download,
  Filter
} from "lucide-react";
import { format } from 'date-fns';
import { CreateDiscountDialog } from './create-discount-dialog';
import { GenerateCodesDialog } from './generate-codes-dialog';

export default function DiscountCodesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for discount codes
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  
  // State for filters and sorting
  const [filters, setFilters] = useState({
    search: '',
    filterActive: '',
    campaignId: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  
  // Fetch discount codes
  const fetchDiscountCodes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.filterActive) queryParams.append('filterActive', filters.filterActive);
      if (filters.campaignId) queryParams.append('campaignId', filters.campaignId);
      
      const response = await fetch(`/api/admin/discount-codes?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch discount codes');
      }
      
      const data = await response.json();
      setDiscountCodes(data.data || []);
      setPagination(data.pagination || pagination);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to fetch discount codes',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };
  
  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 }); // Reset to first page when filter changes
  };
  
  // Handle sort change
  const handleSortChange = (column: string) => {
    if (filters.sortBy === column) {
      // Toggle sort order if same column
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Set new sort column with default desc order
      setFilters({
        ...filters,
        sortBy: column,
        sortOrder: 'desc'
      });
    }
  };
  
  // Handle delete discount code
  const handleDeleteCode = async (id: string) => {
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
      
      // Refresh the list
      fetchDiscountCodes();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to delete discount code',
      });
    }
  };
  
  // Handle toggle active status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update discount code');
      }
      
      toast({
        title: "Success",
        description: `Discount code ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      
      // Refresh the list
      fetchDiscountCodes();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to update discount code',
      });
    }
  };
  
  // Effect to fetch discount codes when filters or pagination changes
  useEffect(() => {
    fetchDiscountCodes();
  }, [pagination.page, pagination.pageSize, filters]);
  
  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Get discount value helper
  const getDiscountValue = (code: any) => {
    if (code.discount_type === 'percentage') {
      return `${code.discount_percent}%`;
    } else if (code.discount_type === 'fixed_amount') {
      return `$${code.discount_amount.toFixed(2)}`;
    } else if (code.discount_type === 'free_trial') {
      return 'Free Trial';
    }
    return `${code.discount_percent}%`; // Default to percentage
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discount Codes</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setGenerateDialogOpen(true)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Codes
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Discount Code
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search discount codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search codes..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <Select
              value={filters.filterActive}
              onValueChange={(value) => handleFilterChange('filterActive', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.campaignId}
              onValueChange={(value) => handleFilterChange('campaignId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Campaigns</SelectItem>
                {/* We would dynamically populate this from campaigns */}
                <SelectItem value="summer2023">Summer 2023</SelectItem>
                <SelectItem value="holiday2023">Holiday 2023</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  search: '',
                  filterActive: '',
                  campaignId: '',
                  sortBy: 'created_at',
                  sortOrder: 'desc'
                });
                setPagination({ ...pagination, page: 1 });
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange('code')}
                  >
                    Code
                    {filters.sortBy === 'code' && (
                      <span className="ml-1">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange('created_at')}
                  >
                    Created
                    {filters.sortBy === 'created_at' && (
                      <span className="ml-1">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange('expires_at')}
                  >
                    Expires
                    {filters.sortBy === 'expires_at' && (
                      <span className="ml-1">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading discount codes...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : discountCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No discount codes found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  discountCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {code.discount_type === 'percentage' ? 'Percentage' : 
                           code.discount_type === 'fixed_amount' ? 'Fixed Amount' : 
                           code.discount_type === 'free_trial' ? 'Free Trial' : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getDiscountValue(code)}</TableCell>
                      <TableCell>{formatDate(code.created_at)}</TableCell>
                      <TableCell>{formatDate(code.expires_at)}</TableCell>
                      <TableCell>
                        {code.current_uses || 0} / {code.max_uses || '∞'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={code.is_active ? "success" : "secondary"}>
                          {code.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/discount-codes/${code.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/discount-codes/${code.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(code.id, code.is_active)}>
                              {code.is_active ? (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteCode(code.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {discountCodes.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <div className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Create Discount Dialog */}
      <CreateDiscountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          fetchDiscountCodes();
          setCreateDialogOpen(false);
        }}
      />
      
      {/* Generate Codes Dialog */}
      <GenerateCodesDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onSuccess={() => {
          fetchDiscountCodes();
          setGenerateDialogOpen(false);
        }}
      />
    </div>
  );
}
