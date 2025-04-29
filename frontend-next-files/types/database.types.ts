export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone_number: string | null;
          insurance_type: 'Auto' | 'Home' | 'Specialty';
          status: 'New' | 'Contacted' | 'Quoted' | 'Sold' | 'Lost';
          current_carrier: string | null;
          premium: number | null;
          assigned_to: string | null;
          notes: string | null;
          auto_data: Json | null;
          home_data: Json | null;
          specialty_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone_number?: string | null;
          insurance_type: 'Auto' | 'Home' | 'Specialty';
          status?: 'New' | 'Contacted' | 'Quoted' | 'Sold' | 'Lost';
          current_carrier?: string | null;
          premium?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
          auto_data?: Json | null;
          home_data?: Json | null;
          specialty_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone_number?: string | null;
          insurance_type?: 'Auto' | 'Home' | 'Specialty';
          status?: 'New' | 'Contacted' | 'Quoted' | 'Sold' | 'Lost';
          current_carrier?: string | null;
          premium?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
          auto_data?: Json | null;
          home_data?: Json | null;
          specialty_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          note_content: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          note_content: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          note_content?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      lead_communications: {
        Row: {
          id: string;
          lead_id: string;
          type: 'Email' | 'SMS' | 'Call' | 'Note';
          direction: 'Inbound' | 'Outbound' | null;
          content: string | null;
          status: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          type: 'Email' | 'SMS' | 'Call' | 'Note';
          direction?: 'Inbound' | 'Outbound' | null;
          content?: string | null;
          status?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          type?: 'Email' | 'SMS' | 'Call' | 'Note';
          direction?: 'Inbound' | 'Outbound' | null;
          content?: string | null;
          status?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      lead_marketing_settings: {
        Row: {
          id: string;
          lead_id: string;
          campaign_id: string;
          is_active: boolean;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          campaign_id: string;
          is_active?: boolean;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          campaign_id?: string;
          is_active?: boolean;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
