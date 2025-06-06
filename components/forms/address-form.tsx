'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { updateClientAddress } from '@/utils/address-helpers';

// Define form schema with Zod
const addressFormSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  clientId: string;
  addressType?: 'address' | 'mailing_address';
  initialData?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  onSuccess?: () => void;
}

export default function AddressForm({
  clientId,
  addressType = 'address',
  initialData,
  onSuccess
}: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      street: initialData?.street || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zip_code: initialData?.zip_code || '',
    }
  });

  const onSubmit = async (data: AddressFormValues) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, error } = await updateClientAddress(
        supabase,
        clientId,
        data,
        addressType
      );

      if (!success || error) {
        throw new Error(error?.message || 'Failed to update address');
      }

      toast({
        title: "Success",
        description: "Address updated successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error updating address:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update address",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          placeholder="123 Main St"
          {...register("street")}
        />
        {errors.street && (
          <p className="text-sm text-red-500">{errors.street.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Anytown"
            {...register("city")}
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="CA"
            {...register("state")}
          />
          {errors.state && (
            <p className="text-sm text-red-500">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            placeholder="12345"
            {...register("zip_code")}
          />
          {errors.zip_code && (
            <p className="text-sm text-red-500">{errors.zip_code.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Address'}
      </Button>
    </form>
  );
}
