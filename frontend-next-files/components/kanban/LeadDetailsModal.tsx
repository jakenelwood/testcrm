'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Lead, LeadNote, InsuranceType, LeadStatus } from "@/types/lead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import supabase from '@/utils/supabase/client';

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onLeadUpdated: (lead: Lead) => void;
}

export function LeadDetailsModal({ isOpen, onClose, lead, onLeadUpdated }: LeadDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('data');
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [communications, setCommunications] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Create a form state for the lead data
  const [formData, setFormData] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone_number: lead?.phone_number || '',
    insurance_type: lead?.insurance_type || 'Auto' as InsuranceType,
    current_carrier: lead?.current_carrier || '',
    premium: lead?.premium ? lead.premium.toString() : '',
    notes: lead?.notes || '',
    status: lead?.status || 'New' as LeadStatus,
    assigned_to: lead?.assigned_to || '',
    // Additional fields from ClientInfoForm
    street_address: lead?.street_address || '',
    city: lead?.city || '',
    state: lead?.state || '',
    zip_code: lead?.zip_code || '',
    date_of_birth: lead?.date_of_birth || '',
    gender: lead?.gender || '',
    marital_status: lead?.marital_status || '',
    drivers_license: lead?.drivers_license || '',
    license_state: lead?.license_state || '',
    referred_by: lead?.referred_by || '',
  });

  // Update form data when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone_number: lead.phone_number || '',
        insurance_type: lead.insurance_type || 'Auto' as InsuranceType,
        current_carrier: lead.current_carrier || '',
        premium: lead.premium ? lead.premium.toString() : '',
        notes: lead.notes || '',
        status: lead.status || 'New' as LeadStatus,
        assigned_to: lead.assigned_to || '',
        // Additional fields from ClientInfoForm
        street_address: lead.street_address || '',
        city: lead.city || '',
        state: lead.state || '',
        zip_code: lead.zip_code || '',
        date_of_birth: lead.date_of_birth || '',
        gender: lead.gender || '',
        marital_status: lead.marital_status || '',
        drivers_license: lead.drivers_license || '',
        license_state: lead.license_state || '',
        referred_by: lead.referred_by || '',
      });
    }
  }, [lead]);

  // Fetch lead notes
  useEffect(() => {
    if (isOpen && lead) {
      const fetchNotes = async () => {
        const { data, error } = await supabase
          .from('lead_notes')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notes:', error);
        } else {
          setNotes(data || []);
        }
      };

      const fetchCommunications = async () => {
        const { data, error } = await supabase
          .from('lead_communications')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching communications:', error);
        } else {
          setCommunications(data || []);
        }
      };

      fetchNotes();
      fetchCommunications();
    }
  }, [isOpen, lead]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({
          lead_id: lead.id,
          note_content: newNote,
          created_by: 'Brian B',
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error('Error adding note:', error);
        alert('Failed to add note. Please try again.');
      } else if (data) {
        setNotes([data[0], ...notes]);
        setNewNote('');

        // Also add to communications
        const { error: commError } = await supabase
          .from('lead_communications')
          .insert({
            lead_id: lead.id,
            type: 'Note',
            content: newNote,
            created_by: 'Brian B',
            created_at: new Date().toISOString(),
          });

        if (commError) {
          console.error('Error adding communication:', commError);
        }
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Convert premium to number if provided
      const premium = formData.premium ? parseFloat(formData.premium) : null;

      // Update lead in Supabase
      const { data, error } = await supabase
        .from('leads')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone_number: formData.phone_number || null,
          insurance_type: formData.insurance_type,
          status: formData.status,
          current_carrier: formData.current_carrier || null,
          premium: premium,
          notes: formData.notes || null,
          assigned_to: formData.assigned_to || null,
          // Additional fields
          street_address: formData.street_address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          marital_status: formData.marital_status || null,
          drivers_license: formData.drivers_license || null,
          license_state: formData.license_state || null,
          referred_by: formData.referred_by || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        toast({
          title: "Error",
          description: "Failed to update lead. Please try again.",
          variant: "destructive"
        });
      } else if (data) {
        // Update the lead in the parent component
        onLeadUpdated(data as Lead);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Lead updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Only call onClose when the dialog is being closed
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent clicks outside from propagating to elements underneath
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {lead.first_name} {lead.last_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="data" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="data">Lead Data</TabsTrigger>
            <TabsTrigger value="communications">Communication History</TabsTrigger>
            <TabsTrigger value="marketing">Marketing Automation</TabsTrigger>
          </TabsList>

          {/* Lead Data Tab */}
          <TabsContent value="data" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Basic Information</CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <ScrollArea className="h-[500px]">
                <CardContent className="grid grid-cols-2 gap-4">
                  {isEditing ? (
                    // Editable form
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone</Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="insurance_type">Insurance Type</Label>
                        <Select
                          value={formData.insurance_type}
                          onValueChange={(value) => handleSelectChange('insurance_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select insurance type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Auto">Auto</SelectItem>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Specialty">Specialty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_carrier">Current Carrier</Label>
                        <Input
                          id="current_carrier"
                          name="current_carrier"
                          value={formData.current_carrier}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="premium">Premium</Label>
                        <Input
                          id="premium"
                          name="premium"
                          type="number"
                          step="0.01"
                          value={formData.premium}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleSelectChange('status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Quoted">Quoted</SelectItem>
                            <SelectItem value="Sold">Sold</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assigned_to">Assigned To</Label>
                        <Input
                          id="assigned_to"
                          name="assigned_to"
                          value={formData.assigned_to}
                          onChange={handleInputChange}
                        />
                      </div>
                      {/* Address Information */}
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="street_address">Street Address</Label>
                        <Input
                          id="street_address"
                          name="street_address"
                          value={formData.street_address}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip_code">ZIP Code</Label>
                        <Input
                          id="zip_code"
                          name="zip_code"
                          value={formData.zip_code}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={formData.gender || ''}
                          onValueChange={(value) => handleSelectChange('gender', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marital_status">Marital Status</Label>
                        <Select
                          value={formData.marital_status || ''}
                          onValueChange={(value) => handleSelectChange('marital_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="drivers_license">Driver's License</Label>
                        <Input
                          id="drivers_license"
                          name="drivers_license"
                          value={formData.drivers_license}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license_state">License State</Label>
                        <Input
                          id="license_state"
                          name="license_state"
                          value={formData.license_state}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referred_by">Referred By</Label>
                        <Input
                          id="referred_by"
                          name="referred_by"
                          value={formData.referred_by}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={4}
                        />
                      </div>
                    </>
                  ) : (
                    // Read-only view
                    <>
                      <div>
                        <Label>Name</Label>
                        <div className="font-medium">{lead.first_name} {lead.last_name}</div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="font-medium">{lead.email || 'N/A'}</div>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <div className="font-medium">{lead.phone_number || 'N/A'}</div>
                      </div>
                      <div>
                        <Label>Insurance Type</Label>
                        <div className="font-medium">{lead.insurance_type}</div>
                      </div>
                      <div>
                        <Label>Current Carrier</Label>
                        <div className="font-medium">{lead.current_carrier || 'None'}</div>
                      </div>
                      <div>
                        <Label>Premium</Label>
                        <div className="font-medium">
                          ${lead.premium
                            ? lead.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0.00'}
                        </div>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="font-medium">{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}</div>
                      </div>
                      <div>
                        <Label>Assigned To</Label>
                        <div className="font-medium">{lead.assigned_to || 'Unassigned'}</div>
                      </div>
                      <div className="col-span-2">
                        <Label>Address</Label>
                        <div className="font-medium">
                          {lead.street_address ? (
                            <>
                              {lead.street_address}<br />
                              {lead.city}{lead.city && lead.state ? ', ' : ''}{lead.state} {lead.zip_code}
                            </>
                          ) : (
                            'No address'
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <div className="font-medium">{lead.date_of_birth || 'N/A'}</div>
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <div className="font-medium">{lead.gender || 'N/A'}</div>
                      </div>
                      <div>
                        <Label>Marital Status</Label>
                        <div className="font-medium">{lead.marital_status || 'N/A'}</div>
                      </div>
                      <div>
                        <Label>Driver's License</Label>
                        <div className="font-medium">{lead.drivers_license || 'N/A'}</div>
                      </div>
                      <div>
                        <Label>License State</Label>
                        <div className="font-medium">{lead.license_state || 'N/A'}</div>
                      </div>
                      <div>
                        <Label>Referred By</Label>
                        <div className="font-medium">{lead.referred_by || 'N/A'}</div>
                      </div>
                      <div className="col-span-2">
                        <Label>Notes</Label>
                        <div className="font-medium">{lead.notes || 'No notes'}</div>
                      </div>
                    </>
                  )}
                </CardContent>
              </ScrollArea>
              {isEditing && (
                <CardFooter className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              )}
            </Card>

            {lead.insurance_type === 'Auto' && lead.auto_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Auto Insurance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(lead.auto_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {lead.insurance_type === 'Home' && lead.home_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Home Insurance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(lead.home_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {lead.insurance_type === 'Specialty' && lead.specialty_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialty Insurance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(lead.specialty_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Communication History Tab */}
          <TabsContent value="communications" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
                <CardDescription>Add a note about this lead</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <Button onClick={handleAddNote} disabled={isSubmittingNote || !newNote.trim()}>
                    {isSubmittingNote ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
                <CardDescription>All interactions with this lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...notes, ...communications].sort((a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ).map((item, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {item.type || 'Note'} {item.direction ? `(${item.direction})` : ''}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(item.created_at)}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.created_by || 'System'}
                        </div>
                      </div>
                      <div className="mt-2">
                        {item.note_content || item.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {notes.length === 0 && communications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No communication history yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Automation Tab */}
          <TabsContent value="marketing" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Campaigns</CardTitle>
                <CardDescription>
                  Enable or disable marketing campaigns for this lead
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Marketing automation features coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
