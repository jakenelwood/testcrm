'use client';

import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase/client';
import { Database } from '@/types/database.types';

type Lead = Database['public']['Tables']['leads']['Row'];

export default function TestSupabase() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setLeads(data || []);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
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
                    <td className="px-4 py-2 border">{lead.first_name} {lead.last_name}</td>
                    <td className="px-4 py-2 border">{lead.insurance_type}</td>
                    <td className="px-4 py-2 border">{lead.status}</td>
                    <td className="px-4 py-2 border">{lead.current_carrier || 'None'}</td>
                    <td className="px-4 py-2 border">${lead.premium?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-2 border">{new Date(lead.created_at).toLocaleString()}</td>
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
