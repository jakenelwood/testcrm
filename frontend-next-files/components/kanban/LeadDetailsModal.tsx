'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Lead, LeadNote } from "@/types/lead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
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
                  <Label>Notes</Label>
                  <div className="font-medium">{lead.notes || 'No notes'}</div>
                </div>
              </CardContent>
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
