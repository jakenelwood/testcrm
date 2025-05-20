'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead, InsuranceType, LeadStatus } from "@/types/lead";
import supabase from '@/utils/supabase/client';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (lead: Lead) => void;
}

export function AddLeadModal({ isOpen, onClose, onLeadCreated }: AddLeadModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    insurance_type: 'Auto' as InsuranceType,
    current_carrier: '',
    premium: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert premium to number if provided
      const premium = formData.premium ? parseFloat(formData.premium) : null;

      // Create lead in Supabase
      const { data, error } = await supabase
        .from('leads_ins_info')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone_number: formData.phone_number || null,
          insurance_type: formData.insurance_type,
          status: 'New' as LeadStatus,
          current_carrier: formData.current_carrier || null,
          premium: premium,
          notes: formData.notes || null,
          assigned_to: 'Brian B', // Default assignment
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        alert('Failed to create lead. Please try again.');
      } else if (data) {
        onLeadCreated(data as Lead);
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          insurance_type: 'Auto' as InsuranceType,
          current_carrier: '',
          premium: '',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the basic information for the new lead. You can add more details later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
