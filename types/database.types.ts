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
      // Pipeline Tables
      pipelines: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          is_default: boolean;
          display_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          is_default?: boolean;
          display_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          display_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pipeline_statuses: {
        Row: {
          id: number;
          pipeline_id: number;
          name: string;
          description: string | null;
          is_final: boolean | null;
          display_order: number;
          color_hex: string | null;
          icon_name: string | null;
          ai_action_template: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          pipeline_id: number;
          name: string;
          description?: string | null;
          is_final?: boolean | null;
          display_order: number;
          color_hex?: string | null;
          icon_name?: string | null;
          ai_action_template?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          pipeline_id?: number;
          name?: string;
          description?: string | null;
          is_final?: boolean | null;
          display_order?: number;
          color_hex?: string | null;
          icon_name?: string | null;
          ai_action_template?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Lookup Tables
      lead_statuses: {
        Row: {
          id: number;
          value: string;
          description: string | null;
          is_final: boolean | null;
          display_order: number | null;
          color_hex: string | null;
          icon_name: string | null;
          ai_action_template: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          value: string;
          description?: string | null;
          is_final?: boolean | null;
          display_order?: number | null;
          color_hex?: string | null;
          icon_name?: string | null;
          ai_action_template?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          value?: string;
          description?: string | null;
          is_final?: boolean | null;
          display_order?: number | null;
          color_hex?: string | null;
          icon_name?: string | null;
          ai_action_template?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      insurance_types: {
        Row: {
          id: number;
          name: string;
          is_personal: boolean | null;
          is_commercial: boolean | null;
          description: string | null;
          icon_name: string | null;
          form_schema: Json | null;
          ai_prompt_template: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          is_personal?: boolean | null;
          is_commercial?: boolean | null;
          description?: string | null;
          icon_name?: string | null;
          form_schema?: Json | null;
          ai_prompt_template?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          is_personal?: boolean | null;
          is_commercial?: boolean | null;
          description?: string | null;
          icon_name?: string | null;
          form_schema?: Json | null;
          ai_prompt_template?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      communication_types: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          icon_name: string | null;
          requires_follow_up: boolean | null;
          ai_summary_template: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          icon_name?: string | null;
          requires_follow_up?: boolean | null;
          ai_summary_template?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          icon_name?: string | null;
          requires_follow_up?: boolean | null;
          ai_summary_template?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      campaigns: {
        Row: {
          id: string;
          name: string | null;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          campaign_type: string | null;
          target_audience: Json | null;
          content_template: Json | null;
          metrics: Json | null;
          ai_optimization_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name?: string | null;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          campaign_type?: string | null;
          target_audience?: Json | null;
          content_template?: Json | null;
          metrics?: Json | null;
          ai_optimization_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          campaign_type?: string | null;
          target_audience?: Json | null;
          content_template?: Json | null;
          metrics?: Json | null;
          ai_optimization_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      // Address Table
      addresses: {
        Row: {
          id: string;
          street: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          type: string | null;
          is_verified: boolean | null;
          geocode_lat: number | null;
          geocode_lng: number | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          street?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          type?: string | null;
          is_verified?: boolean | null;
          geocode_lat?: number | null;
          geocode_lng?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          street?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          type?: string | null;
          is_verified?: boolean | null;
          geocode_lat?: number | null;
          geocode_lng?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          verified_at?: string | null;
        };
      };

      // Clients Table (renamed to leads_contact_info)
      leads_contact_info: {
        Row: {
          id: string;
          client_type: string;
          name: string;
          email: string | null;
          phone_number: string | null;
          address_id: string | null;
          mailing_address_id: string | null;
          referred_by: string | null;
          date_of_birth: string | null;
          gender: string | null;
          marital_status: string | null;
          drivers_license: string | null;
          license_state: string | null;
          education_occupation: string | null;
          business_type: string | null;
          industry: string | null;
          tax_id: string | null;
          year_established: string | null;
          annual_revenue: number | null;
          number_of_employees: number | null;
          ai_summary: string | null;
          ai_next_action: string | null;
          ai_risk_score: number | null;
          ai_lifetime_value: number | null;
          metadata: Json | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
          last_contact_at: string | null;
          next_contact_at: string | null;
        };
        Insert: {
          id?: string;
          client_type: string;
          name: string;
          email?: string | null;
          phone_number?: string | null;
          address_id?: string | null;
          mailing_address_id?: string | null;
          referred_by?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          drivers_license?: string | null;
          license_state?: string | null;
          education_occupation?: string | null;
          business_type?: string | null;
          industry?: string | null;
          tax_id?: string | null;
          year_established?: string | null;
          annual_revenue?: number | null;
          number_of_employees?: number | null;
          ai_summary?: string | null;
          ai_next_action?: string | null;
          ai_risk_score?: number | null;
          ai_lifetime_value?: number | null;
          metadata?: Json | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_contact_at?: string | null;
          next_contact_at?: string | null;
        };
        Update: {
          id?: string;
          client_type?: string;
          name?: string;
          email?: string | null;
          phone_number?: string | null;
          address_id?: string | null;
          mailing_address_id?: string | null;
          referred_by?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          drivers_license?: string | null;
          license_state?: string | null;
          education_occupation?: string | null;
          business_type?: string | null;
          industry?: string | null;
          tax_id?: string | null;
          year_established?: string | null;
          annual_revenue?: number | null;
          number_of_employees?: number | null;
          ai_summary?: string | null;
          ai_next_action?: string | null;
          ai_risk_score?: number | null;
          ai_lifetime_value?: number | null;
          metadata?: Json | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_contact_at?: string | null;
          next_contact_at?: string | null;
        };
      };

      // Leads Table (renamed to leads_ins_info)
      leads_ins_info: {
        Row: {
          id: string;
          client_id: string | null;
          pipeline_id: number;
          status_id: number | null;
          insurance_type_id: number | null;
          assigned_to: string | null;
          notes: string | null;
          current_carrier: string | null;
          premium: number | null;
          auto_premium: number | null;
          home_premium: number | null;
          specialty_premium: number | null;
          commercial_premium: number | null;
          umbrella_value: number | null;
          umbrella_uninsured_underinsured: string | null;
          auto_current_insurance_carrier: string | null;
          auto_months_with_current_carrier: number | null;
          specialty_type: string | null;
          specialty_make: string | null;
          specialty_model: string | null;
          specialty_year: number | null;
          commercial_coverage_type: string | null;
          commercial_industry: string | null;
          auto_data: Json | null;
          auto_data_schema_version: string | null;
          home_data: Json | null;
          home_data_schema_version: string | null;
          specialty_data: Json | null;
          specialty_data_schema_version: string | null;
          commercial_data: Json | null;
          commercial_data_schema_version: string | null;
          liability_data: Json | null;
          liability_data_schema_version: string | null;
          additional_insureds: Json | null;
          additional_locations: Json | null;
          ai_summary: string | null;
          ai_next_action: string | null;
          ai_quote_recommendation: string | null;
          ai_follow_up_priority: number | null;
          metadata: Json | null;
          tags: string[] | null;
          created_at: string | null;
          updated_at: string | null;
          status_changed_at: string | null;
          last_contact_at: string | null;
          next_contact_at: string | null;
          quote_generated_at: string | null;
          sold_at: string | null;
          lost_at: string | null;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          pipeline_id: number;
          status_id?: number | null;
          insurance_type_id?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
          current_carrier?: string | null;
          premium?: number | null;
          auto_premium?: number | null;
          home_premium?: number | null;
          specialty_premium?: number | null;
          commercial_premium?: number | null;
          umbrella_value?: number | null;
          umbrella_uninsured_underinsured?: string | null;
          auto_current_insurance_carrier?: string | null;
          auto_months_with_current_carrier?: number | null;
          specialty_type?: string | null;
          specialty_make?: string | null;
          specialty_model?: string | null;
          specialty_year?: number | null;
          commercial_coverage_type?: string | null;
          commercial_industry?: string | null;
          auto_data?: Json | null;
          auto_data_schema_version?: string | null;
          home_data?: Json | null;
          home_data_schema_version?: string | null;
          specialty_data?: Json | null;
          specialty_data_schema_version?: string | null;
          commercial_data?: Json | null;
          commercial_data_schema_version?: string | null;
          liability_data?: Json | null;
          liability_data_schema_version?: string | null;
          additional_insureds?: Json | null;
          additional_locations?: Json | null;
          ai_summary?: string | null;
          ai_next_action?: string | null;
          ai_quote_recommendation?: string | null;
          ai_follow_up_priority?: number | null;
          metadata?: Json | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          status_changed_at?: string | null;
          last_contact_at?: string | null;
          next_contact_at?: string | null;
          quote_generated_at?: string | null;
          sold_at?: string | null;
          lost_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          pipeline_id?: number;
          status_id?: number | null;
          insurance_type_id?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
          current_carrier?: string | null;
          premium?: number | null;
          auto_premium?: number | null;
          home_premium?: number | null;
          specialty_premium?: number | null;
          commercial_premium?: number | null;
          umbrella_value?: number | null;
          umbrella_uninsured_underinsured?: string | null;
          auto_current_insurance_carrier?: string | null;
          auto_months_with_current_carrier?: number | null;
          specialty_type?: string | null;
          specialty_make?: string | null;
          specialty_model?: string | null;
          specialty_year?: number | null;
          commercial_coverage_type?: string | null;
          commercial_industry?: string | null;
          auto_data?: Json | null;
          auto_data_schema_version?: string | null;
          home_data?: Json | null;
          home_data_schema_version?: string | null;
          specialty_data?: Json | null;
          specialty_data_schema_version?: string | null;
          commercial_data?: Json | null;
          commercial_data_schema_version?: string | null;
          liability_data?: Json | null;
          liability_data_schema_version?: string | null;
          additional_insureds?: Json | null;
          additional_locations?: Json | null;
          ai_summary?: string | null;
          ai_next_action?: string | null;
          ai_quote_recommendation?: string | null;
          ai_follow_up_priority?: number | null;
          metadata?: Json | null;
          tags?: string[] | null;
          created_at?: string | null;
          updated_at?: string | null;
          status_changed_at?: string | null;
          last_contact_at?: string | null;
          next_contact_at?: string | null;
          quote_generated_at?: string | null;
          sold_at?: string | null;
          lost_at?: string | null;
        };
      };

      // Contacts Table
      contacts: {
        Row: {
          id: string;
          client_id: string; // References leads_contact_info.id
          first_name: string;
          last_name: string;
          title: string | null;
          email: string | null;
          phone_number: string | null;
          is_primary_contact: boolean | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string; // References leads_contact_info.id
          first_name: string;
          last_name: string;
          title?: string | null;
          email?: string | null;
          phone_number?: string | null;
          is_primary_contact?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string; // References leads_contact_info.id
          first_name?: string;
          last_name?: string;
          title?: string | null;
          email?: string | null;
          phone_number?: string | null;
          is_primary_contact?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      // Lead Notes Table
      lead_notes: {
        Row: {
          id: string;
          lead_id: string; // References leads_ins_info.id
          note_content: string;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string; // References leads_ins_info.id
          note_content: string;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string; // References leads_ins_info.id
          note_content?: string;
          created_by?: string | null;
          created_at?: string | null;
        };
      };

      // Lead Communications Table
      lead_communications: {
        Row: {
          id: string;
          lead_id: string; // References leads_ins_info.id
          contact_id: string | null;
          type_id: number | null;
          direction: string | null;
          content: string | null;
          status: string | null;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string; // References leads_ins_info.id
          contact_id?: string | null;
          type_id?: number | null;
          direction?: string | null;
          content?: string | null;
          status?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string; // References leads_ins_info.id
          contact_id?: string | null;
          type_id?: number | null;
          direction?: string | null;
          content?: string | null;
          status?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
      };

      // Lead Marketing Settings Table
      lead_marketing_settings: {
        Row: {
          id: string;
          lead_id: string; // References leads_ins_info.id
          campaign_id: string;
          is_active: boolean;
          settings: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string; // References leads_ins_info.id
          campaign_id: string;
          is_active?: boolean;
          settings?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string; // References leads_ins_info.id
          campaign_id?: string;
          is_active?: boolean;
          settings?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      // Opportunities Table
      opportunities: {
        Row: {
          id: string;
          lead_id: string; // References leads_ins_info.id
          name: string;
          stage: string;
          amount: number | null;
          probability: number | null;
          expected_close_date: string | null;
          actual_close_date: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string; // References leads_ins_info.id
          name: string;
          stage: string;
          amount?: number | null;
          probability?: number | null;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string; // References leads_ins_info.id
          name?: string;
          stage?: string;
          amount?: number | null;
          probability?: number | null;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      // AI Interactions Table (to be implemented)
      ai_interactions: {
        Row: {
          id: string;
          lead_id: string | null; // References leads_ins_info.id
          client_id: string | null; // References leads_contact_info.id
          type: string | null;
          source: string | null;
          content: string | null;
          ai_response: string | null;
          summary: string | null;
          model_used: string | null;
          temperature: number | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id?: string | null; // References leads_ins_info.id
          client_id?: string | null; // References leads_contact_info.id
          type?: string | null;
          source?: string | null;
          content?: string | null;
          ai_response?: string | null;
          summary?: string | null;
          model_used?: string | null;
          temperature?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          client_id?: string | null;
          type?: string | null;
          source?: string | null;
          content?: string | null;
          ai_response?: string | null;
          summary?: string | null;
          model_used?: string | null;
          temperature?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
      };

      // Support Tickets Table (to be implemented)
      support_tickets: {
        Row: {
          id: string;
          client_id: string; // References leads_contact_info.id
          lead_id: string | null; // References leads_ins_info.id
          created_by: string | null;
          issue_type: string | null;
          issue_description: string | null;
          resolution_summary: string | null;
          status: string | null;
          assigned_to: string | null;
          notes: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string; // References leads_contact_info.id
          lead_id?: string | null; // References leads_ins_info.id
          created_by?: string | null;
          issue_type?: string | null;
          issue_description?: string | null;
          resolution_summary?: string | null;
          status?: string | null;
          assigned_to?: string | null;
          notes?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          lead_id?: string | null;
          created_by?: string | null;
          issue_type?: string | null;
          issue_description?: string | null;
          resolution_summary?: string | null;
          status?: string | null;
          assigned_to?: string | null;
          notes?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      // Developer Notes Table
      developer_notes: {
        Row: {
          id: string;
          title: string;
          category: string;
          tags: string[] | null;
          priority: string | null;
          status: string | null;
          summary: string;
          description: string | null;
          solution: string | null;
          related_table: string | null;
          related_feature: string | null;
          related_files: string[] | null;
          technical_details: Json | null;
          decision_context: Json | null;
          implementation_notes: Json | null;
          created_by: string;
          assigned_to: string | null;
          created_at: string | null;
          updated_at: string | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          tags?: string[] | null;
          priority?: string | null;
          status?: string | null;
          summary: string;
          description?: string | null;
          solution?: string | null;
          related_table?: string | null;
          related_feature?: string | null;
          related_files?: string[] | null;
          technical_details?: Json | null;
          decision_context?: Json | null;
          implementation_notes?: Json | null;
          created_by: string;
          assigned_to?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          tags?: string[] | null;
          priority?: string | null;
          status?: string | null;
          summary?: string;
          description?: string | null;
          solution?: string | null;
          related_table?: string | null;
          related_feature?: string | null;
          related_files?: string[] | null;
          technical_details?: Json | null;
          decision_context?: Json | null;
          implementation_notes?: Json | null;
          created_by?: string;
          assigned_to?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          resolved_at?: string | null;
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
