'use client';

import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase/client';
import { Database } from '@/types/database.types';

// Define a type for the lead with joined data
type Lead = Database['public']['Tables']['leads']['Row'] & {
  client?: {
    name: string;
    email: string | null;
    phone_number: string | null;
  } | null;
  status?: {
    value: string;
  } | null;
  insurance_type?: {
    name: string;
  } | null;
};

export default function TestSupabase() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupabaseConfigured(false);
      setError('Supabase is not properly configured. Please check your environment variables.');
      setLoading(false);
      return;
    }

    async function fetchLeads() {
      try {
        setLoading(true);

        // Safely attempt to query Supabase with proper joins
        try {
          const { data, error } = await supabase
            .from('leads')
            .select(`
              *,
              client:client_id(*),
              status:lead_statuses!inner(value),
              insurance_type:insurance_types!inner(name)
            `)
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          console.log('Fetched leads with joins:', data);
          setLeads(data || []);
        } catch (err) {
          console.error('Error fetching leads:', err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      } catch (err) {
        console.error('Error in Supabase operation:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (supabaseConfigured) {
      fetchLeads();
    }
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>

      {loading && <p>Loading leads...</p>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <p>No leads found. Make sure you've created the tables and added test data.</p>
      )}

      {leads.length > 0 && (
        <div>
          <p className="mb-2">Found {leads.length} leads:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Insurance Type</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Current Carrier</th>
                  <th className="px-4 py-2 border">Premium</th>
                  <th className="px-4 py-2 border">Created At</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-2 border">{lead.client?.name || 'Unknown'}</td>
                    <td className="px-4 py-2 border">{lead.insurance_type?.name || 'Unknown'}</td>
                    <td className="px-4 py-2 border">{lead.status?.value || 'Unknown'}</td>
                    <td className="px-4 py-2 border">{lead.current_carrier || 'None'}</td>
                    <td className="px-4 py-2 border">${lead.premium?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-2 border">{lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
