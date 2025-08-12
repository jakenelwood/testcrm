
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          ai_analysis: Json | null
          ai_recommendations: Json | null
          campaign_id: string | null
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          minimum_effect_size: number | null
          name: string
          results: Json | null
          sample_size: number | null
          start_date: string | null
          statistical_significance: number | null
          status: string | null
          success_metric: string
          test_type: string
          traffic_split: Json | null
          updated_at: string | null
          updated_by: string | null
          variants: Json | null
          winner_variant: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_recommendations?: Json | null
          campaign_id?: string | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          minimum_effect_size?: number | null
          name: string
          results?: Json | null
          sample_size?: number | null
          start_date?: string | null
          statistical_significance?: number | null
          status?: string | null
          success_metric: string
          test_type: string
          traffic_split?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          variants?: Json | null
          winner_variant?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_recommendations?: Json | null
          campaign_id?: string | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          minimum_effect_size?: number | null
          name?: string
          results?: Json | null
          sample_size?: number | null
          start_date?: string | null
          statistical_significance?: number | null
          status?: string | null
          success_metric?: string
          test_type?: string
          traffic_split?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          variants?: Json | null
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          formatted_address: string | null
          geocode_accuracy: string | null
          geocode_date: string | null
          geocode_lat: number | null
          geocode_lng: number | null
          geocode_source: string | null
          id: string
          is_verified: boolean | null
          metadata: Json | null
          notes: string | null
          place_id: string | null
          plus_code: string | null
          state: string | null
          street: string | null
          street2: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          verification_date: string | null
          verification_source: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          formatted_address?: string | null
          geocode_accuracy?: string | null
          geocode_date?: string | null
          geocode_lat?: number | null
          geocode_lng?: number | null
          geocode_source?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          notes?: string | null
          place_id?: string | null
          plus_code?: string | null
          state?: string | null
          street?: string | null
          street2?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_date?: string | null
          verification_source?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          formatted_address?: string | null
          geocode_accuracy?: string | null
          geocode_date?: string | null
          geocode_lat?: number | null
          geocode_lng?: number | null
          geocode_source?: string | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          notes?: string | null
          place_id?: string | null
          plus_code?: string | null
          state?: string | null
          street?: string | null
          street2?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_date?: string | null
          verification_source?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_memory: {
        Row: {
          access_count: number | null
          agent_id: string | null
          confidence_score: number | null
          content: string
          conversation_id: string | null
          created_at: string | null
          embedding: string | null
          entity_id: string | null
          entity_type: string
          expires_at: string | null
          id: string
          importance_score: number | null
          is_archived: boolean | null
          last_accessed_at: string | null
          memory_type: string
          metadata: Json | null
          related_memories: string[] | null
          session_id: string | null
          summary: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          agent_id?: string | null
          confidence_score?: number | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          embedding?: string | null
          entity_id?: string | null
          entity_type: string
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          is_archived?: boolean | null
          last_accessed_at?: string | null
          memory_type: string
          metadata?: Json | null
          related_memories?: string[] | null
          session_id?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          agent_id?: string | null
          confidence_score?: number | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          embedding?: string | null
          entity_id?: string | null
          entity_type?: string
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          is_archived?: boolean | null
          last_accessed_at?: string | null
          memory_type?: string
          metadata?: Json | null
          related_memories?: string[] | null
          session_id?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_type: string | null
          average_response_time: number | null
          capabilities: Json | null
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_learning: boolean | null
          last_performance_review: string | null
          last_used_at: string | null
          max_tokens: number | null
          metadata: Json | null
          model_name: string | null
          model_provider: string | null
          name: string
          role: string
          settings: Json | null
          successful_interactions: number | null
          system_prompt: string | null
          tags: string[] | null
          temperature: number | null
          tools: Json | null
          total_interactions: number | null
          updated_at: string | null
          updated_by: string | null
          version: string | null
        }
        Insert: {
          agent_type?: string | null
          average_response_time?: number | null
          capabilities?: Json | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_learning?: boolean | null
          last_performance_review?: string | null
          last_used_at?: string | null
          max_tokens?: number | null
          metadata?: Json | null
          model_name?: string | null
          model_provider?: string | null
          name: string
          role: string
          settings?: Json | null
          successful_interactions?: number | null
          system_prompt?: string | null
          tags?: string[] | null
          temperature?: number | null
          tools?: Json | null
          total_interactions?: number | null
          updated_at?: string | null
          updated_by?: string | null
          version?: string | null
        }
        Update: {
          agent_type?: string | null
          average_response_time?: number | null
          capabilities?: Json | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_learning?: boolean | null
          last_performance_review?: string | null
          last_used_at?: string | null
          max_tokens?: number | null
          metadata?: Json | null
          model_name?: string | null
          model_provider?: string | null
          name?: string
          role?: string
          settings?: Json | null
          successful_interactions?: number | null
          system_prompt?: string | null
          tags?: string[] | null
          temperature?: number | null
          tools?: Json | null
          total_interactions?: number | null
          updated_at?: string | null
          updated_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interactions: {
        Row: {
          actions_taken: Json | null
          agent_id: string | null
          ai_response: string | null
          client_id: string | null
          completed_at: string | null
          content: string | null
          context: Json | null
          conversation_id: string | null
          created_at: string | null
          error_message: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          lead_id: string | null
          metadata: Json | null
          model_provider: string | null
          model_used: string | null
          prompt: string | null
          quality_score: number | null
          response_time_ms: number | null
          results: Json | null
          retry_count: number | null
          session_id: string | null
          source: string | null
          summary: string | null
          tags: string[] | null
          temperature: number | null
          tokens_used: number | null
          type: string | null
          user_feedback: string | null
          user_id: string | null
        }
        Insert: {
          actions_taken?: Json | null
          agent_id?: string | null
          ai_response?: string | null
          client_id?: string | null
          completed_at?: string | null
          content?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          model_provider?: string | null
          model_used?: string | null
          prompt?: string | null
          quality_score?: number | null
          response_time_ms?: number | null
          results?: Json | null
          retry_count?: number | null
          session_id?: string | null
          source?: string | null
          summary?: string | null
          tags?: string[] | null
          temperature?: number | null
          tokens_used?: number | null
          type?: string | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Update: {
          actions_taken?: Json | null
          agent_id?: string | null
          ai_response?: string | null
          client_id?: string | null
          completed_at?: string | null
          content?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          model_provider?: string | null
          model_used?: string | null
          prompt?: string | null
          quality_score?: number | null
          response_time_ms?: number | null
          results?: Json | null
          retry_count?: number | null
          session_id?: string | null
          source?: string | null
          summary?: string | null
          tags?: string[] | null
          temperature?: number | null
          tokens_used?: number | null
          type?: string | null
          user_feedback?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          ai_action_items: Json | null
          ai_follow_up_required: boolean | null
          ai_sentiment: string | null
          ai_summary: string | null
          answer_time: string | null
          client_id: string | null
          communication_id: string | null
          connection_quality: string | null
          created_at: string | null
          direction: string
          duration: number | null
          end_time: string | null
          from_number: string
          id: string
          lead_id: string | null
          metadata: Json | null
          quality_score: number | null
          recording_id: string | null
          recording_url: string | null
          result: string | null
          ringcentral_call_id: string | null
          session_id: string | null
          start_time: string | null
          status: string | null
          tags: string[] | null
          to_number: string
          transcription: string | null
          transcription_confidence: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_action_items?: Json | null
          ai_follow_up_required?: boolean | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          answer_time?: string | null
          client_id?: string | null
          communication_id?: string | null
          connection_quality?: string | null
          created_at?: string | null
          direction: string
          duration?: number | null
          end_time?: string | null
          from_number: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          quality_score?: number | null
          recording_id?: string | null
          recording_url?: string | null
          result?: string | null
          ringcentral_call_id?: string | null
          session_id?: string | null
          start_time?: string | null
          status?: string | null
          tags?: string[] | null
          to_number: string
          transcription?: string | null
          transcription_confidence?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_action_items?: Json | null
          ai_follow_up_required?: boolean | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          answer_time?: string | null
          client_id?: string | null
          communication_id?: string | null
          connection_quality?: string | null
          created_at?: string | null
          direction?: string
          duration?: number | null
          end_time?: string | null
          from_number?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          quality_score?: number | null
          recording_id?: string | null
          recording_url?: string | null
          result?: string | null
          ringcentral_call_id?: string | null
          session_id?: string | null
          start_time?: string | null
          status?: string | null
          tags?: string[] | null
          to_number?: string
          transcription?: string | null
          transcription_confidence?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_insights: Json | null
          ai_optimization_enabled: boolean | null
          ai_recommendations: Json | null
          audience_filters: Json | null
          budget: number | null
          campaign_type: string
          created_at: string | null
          created_by: string | null
          demographic_targeting: Json | null
          description: string | null
          end_date: string | null
          geographic_targeting: Json | null
          goals: Json | null
          id: string
          metadata: Json | null
          name: string
          start_date: string | null
          status: string | null
          success_metrics: Json | null
          tags: string[] | null
          target_audience: Json | null
          total_clicked: number | null
          total_converted: number | null
          total_cost: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_insights?: Json | null
          ai_optimization_enabled?: boolean | null
          ai_recommendations?: Json | null
          audience_filters?: Json | null
          budget?: number | null
          campaign_type: string
          created_at?: string | null
          created_by?: string | null
          demographic_targeting?: Json | null
          description?: string | null
          end_date?: string | null
          geographic_targeting?: Json | null
          goals?: Json | null
          id?: string
          metadata?: Json | null
          name: string
          start_date?: string | null
          status?: string | null
          success_metrics?: Json | null
          tags?: string[] | null
          target_audience?: Json | null
          total_clicked?: number | null
          total_converted?: number | null
          total_cost?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_insights?: Json | null
          ai_optimization_enabled?: boolean | null
          ai_recommendations?: Json | null
          audience_filters?: Json | null
          budget?: number | null
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          demographic_targeting?: Json | null
          description?: string | null
          end_date?: string | null
          geographic_targeting?: Json | null
          goals?: Json | null
          id?: string
          metadata?: Json | null
          name?: string
          start_date?: string | null
          status?: string | null
          success_metrics?: Json | null
          tags?: string[] | null
          target_audience?: Json | null
          total_clicked?: number | null
          total_converted?: number | null
          total_cost?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_id: string | null
          ai_insights: Json | null
          ai_lifetime_value: number | null
          ai_next_action: string | null
          ai_risk_score: number | null
          ai_summary: string | null
          annual_revenue: number | null
          business_type: string | null
          client_type: string
          converted_from_lead_id: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          drivers_license: string | null
          education_occupation: string | null
          email: string | null
          gender: string | null
          id: string
          industry: string | null
          last_contact_at: string | null
          license_state: string | null
          mailing_address_id: string | null
          marital_status: string | null
          metadata: Json | null
          name: string
          next_contact_at: string | null
          number_of_employees: number | null
          phone_number: string | null
          referred_by: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          tax_id: string | null
          updated_at: string | null
          updated_by: string | null
          year_established: string | null
        }
        Insert: {
          address_id?: string | null
          ai_insights?: Json | null
          ai_lifetime_value?: number | null
          ai_next_action?: string | null
          ai_risk_score?: number | null
          ai_summary?: string | null
          annual_revenue?: number | null
          business_type?: string | null
          client_type: string
          converted_from_lead_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          drivers_license?: string | null
          education_occupation?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          industry?: string | null
          last_contact_at?: string | null
          license_state?: string | null
          mailing_address_id?: string | null
          marital_status?: string | null
          metadata?: Json | null
          name: string
          next_contact_at?: string | null
          number_of_employees?: number | null
          phone_number?: string | null
          referred_by?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year_established?: string | null
        }
        Update: {
          address_id?: string | null
          ai_insights?: Json | null
          ai_lifetime_value?: number | null
          ai_next_action?: string | null
          ai_risk_score?: number | null
          ai_summary?: string | null
          annual_revenue?: number | null
          business_type?: string | null
          client_type?: string
          converted_from_lead_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          drivers_license?: string | null
          education_occupation?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          industry?: string | null
          last_contact_at?: string | null
          license_state?: string | null
          mailing_address_id?: string | null
          marital_status?: string | null
          metadata?: Json | null
          name?: string
          next_contact_at?: string | null
          number_of_employees?: number | null
          phone_number?: string | null
          referred_by?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          year_established?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_mailing_address_id_fkey"
            columns: ["mailing_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clients_converted_from_lead"
            columns: ["converted_from_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          ab_test_id: string | null
          ai_action_items: Json | null
          ai_entities: Json | null
          ai_follow_up_suggestions: Json | null
          ai_sentiment: string | null
          ai_summary: string | null
          attachments: string[] | null
          call_quality_score: number | null
          campaign_id: string | null
          clicked_at: string | null
          client_id: string | null
          completed_at: string | null
          content: string | null
          content_template_id: string | null
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          direction: string | null
          duration: number | null
          email_provider: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          opened_at: string | null
          outcome: string | null
          personalization_data: Json | null
          recording_url: string | null
          replied_at: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          tags: string[] | null
          targeting_data: Json | null
          tracking_pixel_url: string | null
          type: string
          unsubscribe_url: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ab_test_id?: string | null
          ai_action_items?: Json | null
          ai_entities?: Json | null
          ai_follow_up_suggestions?: Json | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          attachments?: string[] | null
          call_quality_score?: number | null
          campaign_id?: string | null
          clicked_at?: string | null
          client_id?: string | null
          completed_at?: string | null
          content?: string | null
          content_template_id?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          direction?: string | null
          duration?: number | null
          email_provider?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          outcome?: string | null
          personalization_data?: Json | null
          recording_url?: string | null
          replied_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          targeting_data?: Json | null
          tracking_pixel_url?: string | null
          type: string
          unsubscribe_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ab_test_id?: string | null
          ai_action_items?: Json | null
          ai_entities?: Json | null
          ai_follow_up_suggestions?: Json | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          attachments?: string[] | null
          call_quality_score?: number | null
          campaign_id?: string | null
          clicked_at?: string | null
          client_id?: string | null
          completed_at?: string | null
          content?: string | null
          content_template_id?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          direction?: string | null
          duration?: number | null
          email_provider?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          outcome?: string | null
          personalization_data?: Json | null
          recording_url?: string | null
          replied_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          targeting_data?: Json | null
          tracking_pixel_url?: string | null
          type?: string
          unsubscribe_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_content_template_id_fkey"
            columns: ["content_template_id"]
            isOneToOne: false
            referencedRelation: "content_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          ai_optimized: boolean | null
          ai_performance_insights: Json | null
          ai_suggestions: Json | null
          category: string | null
          content: string
          conversion_rate: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          dynamic_content: Json | null
          engagement_rate: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          performance_score: number | null
          personalization_fields: string[] | null
          subject: string | null
          tags: string[] | null
          template_type: string
          updated_at: string | null
          updated_by: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          ai_optimized?: boolean | null
          ai_performance_insights?: Json | null
          ai_suggestions?: Json | null
          category?: string | null
          content: string
          conversion_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dynamic_content?: Json | null
          engagement_rate?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          performance_score?: number | null
          personalization_fields?: string[] | null
          subject?: string | null
          tags?: string[] | null
          template_type: string
          updated_at?: string | null
          updated_by?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          ai_optimized?: boolean | null
          ai_performance_insights?: Json | null
          ai_suggestions?: Json | null
          category?: string | null
          content?: string
          conversion_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dynamic_content?: Json | null
          engagement_rate?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          performance_score?: number | null
          personalization_fields?: string[] | null
          subject?: string | null
          tags?: string[] | null
          template_type?: string
          updated_at?: string | null
          updated_by?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          action_items: Json | null
          agent_id: string | null
          average_response_time: number | null
          client_id: string | null
          completed_at: string | null
          context: Json | null
          created_at: string | null
          goals_achieved: Json | null
          id: string
          lead_id: string | null
          metadata: Json | null
          next_steps: Json | null
          purpose: string | null
          status: string | null
          summary: string | null
          title: string | null
          total_interactions: number | null
          total_tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_items?: Json | null
          agent_id?: string | null
          average_response_time?: number | null
          client_id?: string | null
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          goals_achieved?: Json | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          next_steps?: Json | null
          purpose?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          total_interactions?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_items?: Json | null
          agent_id?: string | null
          average_response_time?: number | null
          client_id?: string | null
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          goals_achieved?: Json | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          next_steps?: Json | null
          purpose?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          total_interactions?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_touchpoints: {
        Row: {
          ab_test_id: string | null
          attribution_model: string | null
          attribution_weight: number | null
          browser: string | null
          campaign: string | null
          campaign_id: string | null
          channel: string
          client_id: string | null
          communication_id: string | null
          content: string | null
          conversion_value: number | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: unknown | null
          lead_id: string | null
          medium: string | null
          metadata: Json | null
          occurred_at: string | null
          page_url: string | null
          referrer_url: string | null
          source: string | null
          touchpoint_type: string
          user_agent: string | null
        }
        Insert: {
          ab_test_id?: string | null
          attribution_model?: string | null
          attribution_weight?: number | null
          browser?: string | null
          campaign?: string | null
          campaign_id?: string | null
          channel: string
          client_id?: string | null
          communication_id?: string | null
          content?: string | null
          conversion_value?: number | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          lead_id?: string | null
          medium?: string | null
          metadata?: Json | null
          occurred_at?: string | null
          page_url?: string | null
          referrer_url?: string | null
          source?: string | null
          touchpoint_type: string
          user_agent?: string | null
        }
        Update: {
          ab_test_id?: string | null
          attribution_model?: string | null
          attribution_weight?: number | null
          browser?: string | null
          campaign?: string | null
          campaign_id?: string | null
          channel?: string
          client_id?: string | null
          communication_id?: string | null
          content?: string | null
          conversion_value?: number | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          lead_id?: string | null
          medium?: string | null
          metadata?: Json | null
          occurred_at?: string | null
          page_url?: string | null
          referrer_url?: string | null
          source?: string | null
          touchpoint_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_touchpoints_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_touchpoints_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_touchpoints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_touchpoints_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_touchpoints_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          address_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          client_id: string | null
          construction_type: string | null
          cooling_type: string | null
          coverage_limits: Json | null
          created_at: string | null
          created_by: string | null
          current_coverage: Json | null
          current_value: number | null
          deductibles: Json | null
          distance_to_coast: number | null
          distance_to_fire_station: number | null
          earthquake_risk: string | null
          flood_zone: string | null
          foundation_type: string | null
          heating_type: string | null
          id: string
          lead_id: string | null
          lot_size: number | null
          metadata: Json | null
          mortgage_balance: number | null
          notes: string | null
          property_type: string | null
          purchase_price: number | null
          roof_age: number | null
          roof_type: string | null
          safety_features: string[] | null
          security_features: string[] | null
          square_feet: number | null
          stories: number | null
          updated_at: string | null
          updated_by: string | null
          wildfire_risk: string | null
          year_built: number | null
        }
        Insert: {
          address_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          client_id?: string | null
          construction_type?: string | null
          cooling_type?: string | null
          coverage_limits?: Json | null
          created_at?: string | null
          created_by?: string | null
          current_coverage?: Json | null
          current_value?: number | null
          deductibles?: Json | null
          distance_to_coast?: number | null
          distance_to_fire_station?: number | null
          earthquake_risk?: string | null
          flood_zone?: string | null
          foundation_type?: string | null
          heating_type?: string | null
          id?: string
          lead_id?: string | null
          lot_size?: number | null
          metadata?: Json | null
          mortgage_balance?: number | null
          notes?: string | null
          property_type?: string | null
          purchase_price?: number | null
          roof_age?: number | null
          roof_type?: string | null
          safety_features?: string[] | null
          security_features?: string[] | null
          square_feet?: number | null
          stories?: number | null
          updated_at?: string | null
          updated_by?: string | null
          wildfire_risk?: string | null
          year_built?: number | null
        }
        Update: {
          address_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          client_id?: string | null
          construction_type?: string | null
          cooling_type?: string | null
          coverage_limits?: Json | null
          created_at?: string | null
          created_by?: string | null
          current_coverage?: Json | null
          current_value?: number | null
          deductibles?: Json | null
          distance_to_coast?: number | null
          distance_to_fire_station?: number | null
          earthquake_risk?: string | null
          flood_zone?: string | null
          foundation_type?: string | null
          heating_type?: string | null
          id?: string
          lead_id?: string | null
          lot_size?: number | null
          metadata?: Json | null
          mortgage_balance?: number | null
          notes?: string | null
          property_type?: string | null
          purchase_price?: number | null
          roof_age?: number | null
          roof_type?: string | null
          safety_features?: string[] | null
          security_features?: string[] | null
          square_feet?: number | null
          stories?: number | null
          updated_at?: string | null
          updated_by?: string | null
          wildfire_risk?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "homes_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_types: {
        Row: {
          ai_prompt_template: string | null
          ai_risk_factors: Json | null
          created_at: string | null
          description: string | null
          display_order: number | null
          form_schema: Json | null
          icon_name: string | null
          id: number
          is_active: boolean | null
          is_commercial: boolean | null
          is_personal: boolean | null
          name: string
          optional_fields: string[] | null
          required_fields: string[] | null
          updated_at: string | null
        }
        Insert: {
          ai_prompt_template?: string | null
          ai_risk_factors?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          form_schema?: Json | null
          icon_name?: string | null
          id?: number
          is_active?: boolean | null
          is_commercial?: boolean | null
          is_personal?: boolean | null
          name: string
          optional_fields?: string[] | null
          required_fields?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ai_prompt_template?: string | null
          ai_risk_factors?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          form_schema?: Json | null
          icon_name?: string | null
          id?: number
          is_active?: boolean | null
          is_commercial?: boolean | null
          is_personal?: boolean | null
          name?: string
          optional_fields?: string[] | null
          required_fields?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_status_history: {
        Row: {
          ai_confidence: number | null
          ai_trigger: string | null
          automated: boolean | null
          changed_at: string | null
          changed_by: string | null
          duration_in_previous_status: number | null
          from_pipeline_status_id: number | null
          from_status: string | null
          id: string
          lead_id: string
          metadata: Json | null
          notes: string | null
          reason: string | null
          to_pipeline_status_id: number | null
          to_status: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_trigger?: string | null
          automated?: boolean | null
          changed_at?: string | null
          changed_by?: string | null
          duration_in_previous_status?: number | null
          from_pipeline_status_id?: number | null
          from_status?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          notes?: string | null
          reason?: string | null
          to_pipeline_status_id?: number | null
          to_status: string
        }
        Update: {
          ai_confidence?: number | null
          ai_trigger?: string | null
          automated?: boolean | null
          changed_at?: string | null
          changed_by?: string | null
          duration_in_previous_status?: number | null
          from_pipeline_status_id?: number | null
          from_status?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          notes?: string | null
          reason?: string | null
          to_pipeline_status_id?: number | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_status_history_from_pipeline_status_id_fkey"
            columns: ["from_pipeline_status_id"]
            isOneToOne: false
            referencedRelation: "pipeline_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_status_history_to_pipeline_status_id_fkey"
            columns: ["to_pipeline_status_id"]
            isOneToOne: false
            referencedRelation: "pipeline_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_statuses: {
        Row: {
          ai_action_template: string | null
          ai_follow_up_suggestions: Json | null
          ai_next_steps: Json | null
          auto_actions: Json | null
          badge_variant: string | null
          color_hex: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: number
          is_active: boolean | null
          is_final: boolean | null
          metadata: Json | null
          notification_settings: Json | null
          updated_at: string | null
          value: string
        }
        Insert: {
          ai_action_template?: string | null
          ai_follow_up_suggestions?: Json | null
          ai_next_steps?: Json | null
          auto_actions?: Json | null
          badge_variant?: string | null
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: number
          is_active?: boolean | null
          is_final?: boolean | null
          metadata?: Json | null
          notification_settings?: Json | null
          updated_at?: string | null
          value: string
        }
        Update: {
          ai_action_template?: string | null
          ai_follow_up_suggestions?: Json | null
          ai_next_steps?: Json | null
          auto_actions?: Json | null
          badge_variant?: string | null
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: number
          is_active?: boolean | null
          is_final?: boolean | null
          metadata?: Json | null
          notification_settings?: Json | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ab_test_id: string | null
          additional_insureds: Json | null
          additional_locations: Json | null
          ai_conversion_probability: number | null
          ai_follow_up_priority: number | null
          ai_insights: Json | null
          ai_next_action: string | null
          ai_quote_recommendation: string | null
          ai_summary: string | null
          assigned_to: string | null
          attribution_data: Json | null
          auto_data: Json | null
          auto_data_version: number | null
          auto_premium: number | null
          campaign_id: string | null
          client_id: string | null
          commercial_data: Json | null
          commercial_data_version: number | null
          commercial_premium: number | null
          content_template_id: string | null
          created_at: string | null
          created_by: string | null
          current_carrier: string | null
          current_policy_expiry: string | null
          custom_fields: Json | null
          drivers: Json | null
          hibernated_at: string | null
          home_data: Json | null
          home_data_version: number | null
          home_premium: number | null
          id: string
          import_batch_id: string | null
          import_file_name: string | null
          insurance_type_id: number | null
          last_contact_at: string | null
          lead_status_id: number | null
          lead_type: string | null
          liability_data: Json | null
          liability_data_version: number | null
          lost_at: string | null
          metadata: Json | null
          next_contact_at: string | null
          notes: string | null
          pipeline_id: number | null
          pipeline_status_id: number | null
          premium: number | null
          priority: string | null
          quote_generated_at: string | null
          sold_at: string | null
          source: string | null
          specialty_data: Json | null
          specialty_data_version: number | null
          specialty_premium: number | null
          status: string | null
          status_changed_at: string | null
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
          vehicles: Json | null
        }
        Insert: {
          ab_test_id?: string | null
          additional_insureds?: Json | null
          additional_locations?: Json | null
          ai_conversion_probability?: number | null
          ai_follow_up_priority?: number | null
          ai_insights?: Json | null
          ai_next_action?: string | null
          ai_quote_recommendation?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          attribution_data?: Json | null
          auto_data?: Json | null
          auto_data_version?: number | null
          auto_premium?: number | null
          campaign_id?: string | null
          client_id?: string | null
          commercial_data?: Json | null
          commercial_data_version?: number | null
          commercial_premium?: number | null
          content_template_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_carrier?: string | null
          current_policy_expiry?: string | null
          custom_fields?: Json | null
          drivers?: Json | null
          hibernated_at?: string | null
          home_data?: Json | null
          home_data_version?: number | null
          home_premium?: number | null
          id?: string
          import_batch_id?: string | null
          import_file_name?: string | null
          insurance_type_id?: number | null
          last_contact_at?: string | null
          lead_status_id?: number | null
          lead_type?: string | null
          liability_data?: Json | null
          liability_data_version?: number | null
          lost_at?: string | null
          metadata?: Json | null
          next_contact_at?: string | null
          notes?: string | null
          pipeline_id?: number | null
          pipeline_status_id?: number | null
          premium?: number | null
          priority?: string | null
          quote_generated_at?: string | null
          sold_at?: string | null
          source?: string | null
          specialty_data?: Json | null
          specialty_data_version?: number | null
          specialty_premium?: number | null
          status?: string | null
          status_changed_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          vehicles?: Json | null
        }
        Update: {
          ab_test_id?: string | null
          additional_insureds?: Json | null
          additional_locations?: Json | null
          ai_conversion_probability?: number | null
          ai_follow_up_priority?: number | null
          ai_insights?: Json | null
          ai_next_action?: string | null
          ai_quote_recommendation?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          attribution_data?: Json | null
          auto_data?: Json | null
          auto_data_version?: number | null
          auto_premium?: number | null
          campaign_id?: string | null
          client_id?: string | null
          commercial_data?: Json | null
          commercial_data_version?: number | null
          commercial_premium?: number | null
          content_template_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_carrier?: string | null
          current_policy_expiry?: string | null
          custom_fields?: Json | null
          drivers?: Json | null
          hibernated_at?: string | null
          home_data?: Json | null
          home_data_version?: number | null
          home_premium?: number | null
          id?: string
          import_batch_id?: string | null
          import_file_name?: string | null
          insurance_type_id?: number | null
          last_contact_at?: string | null
          lead_status_id?: number | null
          lead_type?: string | null
          liability_data?: Json | null
          liability_data_version?: number | null
          lost_at?: string | null
          metadata?: Json | null
          next_contact_at?: string | null
          notes?: string | null
          pipeline_id?: number | null
          pipeline_status_id?: number | null
          premium?: number | null
          priority?: string | null
          quote_generated_at?: string | null
          sold_at?: string | null
          source?: string | null
          specialty_data?: Json | null
          specialty_data_version?: number | null
          specialty_premium?: number | null
          status?: string | null
          status_changed_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          vehicles?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_insurance_type_id_fkey"
            columns: ["insurance_type_id"]
            isOneToOne: false
            referencedRelation: "insurance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_status_id_fkey"
            columns: ["lead_status_id"]
            isOneToOne: false
            referencedRelation: "lead_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_status_id_fkey"
            columns: ["pipeline_status_id"]
            isOneToOne: false
            referencedRelation: "pipeline_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_statuses: {
        Row: {
          ai_action_template: string | null
          ai_exit_criteria: Json | null
          ai_follow_up_suggestions: Json | null
          ai_next_steps: Json | null
          auto_actions: Json | null
          badge_variant: string | null
          color_hex: string | null
          conversion_probability: number | null
          created_at: string | null
          description: string | null
          display_order: number
          escalation_rules: Json | null
          icon_name: string | null
          id: number
          is_active: boolean | null
          is_final: boolean | null
          max_duration: number | null
          metadata: Json | null
          name: string
          notification_settings: Json | null
          optional_fields: string[] | null
          pipeline_id: number | null
          required_fields: string[] | null
          stage_type: string | null
          target_duration: number | null
          updated_at: string | null
        }
        Insert: {
          ai_action_template?: string | null
          ai_exit_criteria?: Json | null
          ai_follow_up_suggestions?: Json | null
          ai_next_steps?: Json | null
          auto_actions?: Json | null
          badge_variant?: string | null
          color_hex?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          description?: string | null
          display_order: number
          escalation_rules?: Json | null
          icon_name?: string | null
          id?: number
          is_active?: boolean | null
          is_final?: boolean | null
          max_duration?: number | null
          metadata?: Json | null
          name: string
          notification_settings?: Json | null
          optional_fields?: string[] | null
          pipeline_id?: number | null
          required_fields?: string[] | null
          stage_type?: string | null
          target_duration?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_action_template?: string | null
          ai_exit_criteria?: Json | null
          ai_follow_up_suggestions?: Json | null
          ai_next_steps?: Json | null
          auto_actions?: Json | null
          badge_variant?: string | null
          color_hex?: string | null
          conversion_probability?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          escalation_rules?: Json | null
          icon_name?: string | null
          id?: number
          is_active?: boolean | null
          is_final?: boolean | null
          max_duration?: number | null
          metadata?: Json | null
          name?: string
          notification_settings?: Json | null
          optional_fields?: string[] | null
          pipeline_id?: number | null
          required_fields?: string[] | null
          stage_type?: string | null
          target_duration?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_statuses_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          ai_automation_rules: Json | null
          ai_optimization_enabled: boolean | null
          ai_scoring_model: Json | null
          average_cycle_time: number | null
          conversion_goals: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: number
          insurance_types: number[] | null
          is_active: boolean | null
          is_default: boolean | null
          lead_type: string | null
          metadata: Json | null
          name: string
          target_conversion_rate: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_automation_rules?: Json | null
          ai_optimization_enabled?: boolean | null
          ai_scoring_model?: Json | null
          average_cycle_time?: number | null
          conversion_goals?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          insurance_types?: number[] | null
          is_active?: boolean | null
          is_default?: boolean | null
          lead_type?: string | null
          metadata?: Json | null
          name: string
          target_conversion_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_automation_rules?: Json | null
          ai_optimization_enabled?: boolean | null
          ai_scoring_model?: Json | null
          average_cycle_time?: number | null
          conversion_goals?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          insurance_types?: number[] | null
          is_active?: boolean | null
          is_default?: boolean | null
          lead_type?: string | null
          metadata?: Json | null
          name?: string
          target_conversion_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          ai_pricing_factors: Json | null
          ai_recommendation: string | null
          ai_risk_assessment: Json | null
          bound_at: string | null
          carrier: string
          competitor_quotes: Json | null
          contract_term: string | null
          coverage_details: Json | null
          created_at: string | null
          created_by: string | null
          deductibles: Json | null
          down_payment_amount: number | null
          effective_date: string | null
          expiration_date: string | null
          expired_at: string | null
          id: string
          insurance_type_id: number | null
          lead_id: string
          limits: Json | null
          metadata: Json | null
          monthly_payment_amount: number | null
          notes: string | null
          paid_in_full_amount: number | null
          policy_number: string | null
          quote_date: string | null
          quote_number: string | null
          savings_amount: number | null
          savings_percentage: number | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_pricing_factors?: Json | null
          ai_recommendation?: string | null
          ai_risk_assessment?: Json | null
          bound_at?: string | null
          carrier: string
          competitor_quotes?: Json | null
          contract_term?: string | null
          coverage_details?: Json | null
          created_at?: string | null
          created_by?: string | null
          deductibles?: Json | null
          down_payment_amount?: number | null
          effective_date?: string | null
          expiration_date?: string | null
          expired_at?: string | null
          id?: string
          insurance_type_id?: number | null
          lead_id: string
          limits?: Json | null
          metadata?: Json | null
          monthly_payment_amount?: number | null
          notes?: string | null
          paid_in_full_amount?: number | null
          policy_number?: string | null
          quote_date?: string | null
          quote_number?: string | null
          savings_amount?: number | null
          savings_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_pricing_factors?: Json | null
          ai_recommendation?: string | null
          ai_risk_assessment?: Json | null
          bound_at?: string | null
          carrier?: string
          competitor_quotes?: Json | null
          contract_term?: string | null
          coverage_details?: Json | null
          created_at?: string | null
          created_by?: string | null
          deductibles?: Json | null
          down_payment_amount?: number | null
          effective_date?: string | null
          expiration_date?: string | null
          expired_at?: string | null
          id?: string
          insurance_type_id?: number | null
          lead_id?: string
          limits?: Json | null
          metadata?: Json | null
          monthly_payment_amount?: number | null
          notes?: string | null
          paid_in_full_amount?: number | null
          policy_number?: string | null
          quote_date?: string | null
          quote_number?: string | null
          savings_amount?: number | null
          savings_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_insurance_type_id_fkey"
            columns: ["insurance_type_id"]
            isOneToOne: false
            referencedRelation: "insurance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ringcentral_tokens: {
        Row: {
          access_token: string
          account_id: string | null
          api_calls_count: number | null
          created_at: string | null
          expires_at: string
          extension_id: string | null
          extension_number: string | null
          granted_permissions: Json | null
          id: string
          is_active: boolean | null
          last_api_call_at: string | null
          last_validated_at: string | null
          metadata: Json | null
          rate_limit_remaining: number | null
          rate_limit_reset_at: string | null
          refresh_token: string
          refresh_token_expires_at: string | null
          scope: string | null
          token_type: string
          updated_at: string | null
          user_id: string
          validation_error: string | null
        }
        Insert: {
          access_token: string
          account_id?: string | null
          api_calls_count?: number | null
          created_at?: string | null
          expires_at: string
          extension_id?: string | null
          extension_number?: string | null
          granted_permissions?: Json | null
          id?: string
          is_active?: boolean | null
          last_api_call_at?: string | null
          last_validated_at?: string | null
          metadata?: Json | null
          rate_limit_remaining?: number | null
          rate_limit_reset_at?: string | null
          refresh_token: string
          refresh_token_expires_at?: string | null
          scope?: string | null
          token_type?: string
          updated_at?: string | null
          user_id: string
          validation_error?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string | null
          api_calls_count?: number | null
          created_at?: string | null
          expires_at?: string
          extension_id?: string | null
          extension_number?: string | null
          granted_permissions?: Json | null
          id?: string
          is_active?: boolean | null
          last_api_call_at?: string | null
          last_validated_at?: string | null
          metadata?: Json | null
          rate_limit_remaining?: number | null
          rate_limit_reset_at?: string | null
          refresh_token?: string
          refresh_token_expires_at?: string | null
          scope?: string | null
          token_type?: string
          updated_at?: string | null
          user_id?: string
          validation_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ringcentral_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_versions: {
        Row: {
          applied_at: string | null
          description: string | null
          id: number
          version: string
        }
        Insert: {
          applied_at?: string | null
          description?: string | null
          id?: number
          version: string
        }
        Update: {
          applied_at?: string | null
          description?: string | null
          id?: number
          version?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          ai_action_items: Json | null
          ai_intent: string | null
          ai_sentiment: string | null
          ai_summary: string | null
          attachments: Json | null
          client_id: string | null
          communication_id: string | null
          conversation_id: string | null
          created_at: string | null
          delivered_at: string | null
          direction: string
          from_number: string
          id: string
          lead_id: string | null
          message_text: string
          metadata: Json | null
          ringcentral_message_id: string | null
          sent_at: string | null
          status: string | null
          tags: string[] | null
          to_number: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_action_items?: Json | null
          ai_intent?: string | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          attachments?: Json | null
          client_id?: string | null
          communication_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction: string
          from_number: string
          id?: string
          lead_id?: string | null
          message_text: string
          metadata?: Json | null
          ringcentral_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          tags?: string[] | null
          to_number: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_action_items?: Json | null
          ai_intent?: string | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          attachments?: Json | null
          client_id?: string | null
          communication_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          from_number?: string
          id?: string
          lead_id?: string | null
          message_text?: string
          metadata?: Json | null
          ringcentral_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          tags?: string[] | null
          to_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      specialty_items: {
        Row: {
          appraisal_date: string | null
          appraised_value: number | null
          appraiser_name: string | null
          brand: string | null
          category: string | null
          client_id: string | null
          coverage_limit: number | null
          coverage_type: string | null
          created_at: string | null
          created_by: string | null
          current_value: number | null
          deductible: number | null
          description: string | null
          documents: string[] | null
          id: string
          lead_id: string | null
          metadata: Json | null
          model: string | null
          name: string
          notes: string | null
          photos: string[] | null
          purchase_price: number | null
          security_measures: string[] | null
          serial_number: string | null
          storage_location: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          appraisal_date?: string | null
          appraised_value?: number | null
          appraiser_name?: string | null
          brand?: string | null
          category?: string | null
          client_id?: string | null
          coverage_limit?: number | null
          coverage_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          deductible?: number | null
          description?: string | null
          documents?: string[] | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          model?: string | null
          name: string
          notes?: string | null
          photos?: string[] | null
          purchase_price?: number | null
          security_measures?: string[] | null
          serial_number?: string | null
          storage_location?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          appraisal_date?: string | null
          appraised_value?: number | null
          appraiser_name?: string | null
          brand?: string | null
          category?: string | null
          client_id?: string | null
          coverage_limit?: number | null
          coverage_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          deductible?: number | null
          description?: string | null
          documents?: string[] | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          model?: string | null
          name?: string
          notes?: string | null
          photos?: string[] | null
          purchase_price?: number | null
          security_measures?: string[] | null
          serial_number?: string | null
          storage_location?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialty_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_items_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_phone_preferences: {
        Row: {
          auto_create_activities: boolean | null
          auto_log_calls: boolean | null
          auto_response_enabled: boolean | null
          auto_response_message: string | null
          business_hours: Json | null
          call_forwarding_enabled: boolean | null
          call_forwarding_number: string | null
          call_recording_enabled: boolean | null
          created_at: string | null
          crm_integration_enabled: boolean | null
          desktop_notifications: boolean | null
          email_notifications: boolean | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          metadata: Json | null
          out_of_office_enabled: boolean | null
          out_of_office_message: string | null
          phone_number_label: string | null
          phone_number_type: string | null
          selected_phone_number: string
          sms_notifications: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          voicemail_enabled: boolean | null
        }
        Insert: {
          auto_create_activities?: boolean | null
          auto_log_calls?: boolean | null
          auto_response_enabled?: boolean | null
          auto_response_message?: string | null
          business_hours?: Json | null
          call_forwarding_enabled?: boolean | null
          call_forwarding_number?: string | null
          call_recording_enabled?: boolean | null
          created_at?: string | null
          crm_integration_enabled?: boolean | null
          desktop_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          out_of_office_enabled?: boolean | null
          out_of_office_message?: string | null
          phone_number_label?: string | null
          phone_number_type?: string | null
          selected_phone_number: string
          sms_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          voicemail_enabled?: boolean | null
        }
        Update: {
          auto_create_activities?: boolean | null
          auto_log_calls?: boolean | null
          auto_response_enabled?: boolean | null
          auto_response_message?: string | null
          business_hours?: Json | null
          call_forwarding_enabled?: boolean | null
          call_forwarding_number?: string | null
          call_recording_enabled?: boolean | null
          created_at?: string | null
          crm_integration_enabled?: boolean | null
          desktop_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          out_of_office_enabled?: boolean | null
          out_of_office_message?: string | null
          phone_number_label?: string | null
          phone_number_type?: string | null
          selected_phone_number?: string
          sms_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          voicemail_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_phone_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_format: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          metadata: Json | null
          phone_number: string | null
          preferences: Json | null
          role: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_format?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          metadata?: Json | null
          phone_number?: string | null
          preferences?: Json | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_format?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          metadata?: Json | null
          phone_number?: string | null
          preferences?: Json | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          annual_mileage: number | null
          anti_theft_devices: string[] | null
          body_style: string | null
          client_id: string | null
          color: string | null
          coverage_limits: Json | null
          created_at: string | null
          created_by: string | null
          current_coverage: Json | null
          current_value: number | null
          deductibles: Json | null
          engine_size: string | null
          fuel_type: string | null
          garage_location: string | null
          id: string
          lead_id: string | null
          license_plate: string | null
          loan_balance: number | null
          make: string
          metadata: Json | null
          model: string
          notes: string | null
          primary_use: string | null
          purchase_price: number | null
          safety_features: string[] | null
          state: string | null
          transmission: string | null
          updated_at: string | null
          updated_by: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          annual_mileage?: number | null
          anti_theft_devices?: string[] | null
          body_style?: string | null
          client_id?: string | null
          color?: string | null
          coverage_limits?: Json | null
          created_at?: string | null
          created_by?: string | null
          current_coverage?: Json | null
          current_value?: number | null
          deductibles?: Json | null
          engine_size?: string | null
          fuel_type?: string | null
          garage_location?: string | null
          id?: string
          lead_id?: string | null
          license_plate?: string | null
          loan_balance?: number | null
          make: string
          metadata?: Json | null
          model: string
          notes?: string | null
          primary_use?: string | null
          purchase_price?: number | null
          safety_features?: string[] | null
          state?: string | null
          transmission?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          annual_mileage?: number | null
          anti_theft_devices?: string[] | null
          body_style?: string | null
          client_id?: string | null
          color?: string | null
          coverage_limits?: Json | null
          created_at?: string | null
          created_by?: string | null
          current_coverage?: Json | null
          current_value?: number | null
          deductibles?: Json | null
          engine_size?: string | null
          fuel_type?: string | null
          garage_location?: string | null
          id?: string
          lead_id?: string | null
          license_plate?: string | null
          loan_balance?: number | null
          make?: string
          metadata?: Json | null
          model?: string
          notes?: string | null
          primary_use?: string | null
          purchase_price?: number | null
          safety_features?: string[] | null
          state?: string | null
          transmission?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      address_distance_miles: {
        Args: { lat1: number; lng1: number; lat2: number; lng2: number }
        Returns: number
      }
      addresses_within_radius: {
        Args: { center_lat: number; center_lng: number; radius_miles?: number }
        Returns: {
          id: string
          formatted_address: string
          distance_miles: number
        }[]
      }
      auto_assign_lead: {
        Args: { lead_id_param: string }
        Returns: string
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      broadcast_system_notification: {
        Args: {
          message: string
          notification_type?: string
          target_roles?: string[]
        }
        Returns: undefined
      }
      business_days_between: {
        Args: { start_date: string; end_date: string }
        Returns: number
      }
      calculate_lead_score: {
        Args: { lead_id_param: string }
        Returns: number
      }
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_follow_up_task: {
        Args: {
          lead_id_param: string
          task_type: string
          due_date: string
          description?: string
        }
        Returns: string
      }
      create_org_on_signup: {
        Args: { p_name: string }
        Returns: string
      }
      create_pipeline_with_stages: {
        Args: { p_org_id: string; p_name: string; p_stage_names: string[] }
        Returns: string
      }
      current_user_has_role: {
        Args: { required_role: string }
        Returns: boolean
      }
      daily_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      extract_phone_digits: {
        Args: { phone: string }
        Returns: string
      }
      format_address: {
        Args: {
          street?: string
          street2?: string
          city?: string
          state?: string
          zip_code?: string
          country?: string
        }
        Returns: string
      }
      format_phone_number: {
        Args: { phone: string }
        Returns: string
      }
      generate_import_batch_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_default_pipeline: {
        Args: { lead_type_param?: string }
        Returns: number
      }
      get_first_pipeline_status: {
        Args: { pipeline_id_param: number }
        Returns: number
      }
      get_lead_channels: {
        Args: { lead_id_param: string }
        Returns: string[]
      }
      get_user_accessible_client_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_user_accessible_lead_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_member: {
        Args: { p_org: string }
        Returns: boolean
      }
      is_valid_email: {
        Args: { email: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      move_card: {
        Args: {
          p_card_id: string
          p_to_stage_id: string
          p_after_card_id?: string
          p_before_card_id?: string
        }
        Returns: undefined
      }
      next_business_day: {
        Args: { input_date: string; days_to_add?: number }
        Returns: string
      }
      process_expired_quotes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      repack_stage: {
        Args: { p_stage_id: string }
        Returns: undefined
      }
      search_agent_memory: {
        Args: {
          agent_id_param: string
          query_embedding: string
          entity_type_param?: string
          entity_id_param?: string
          limit_param?: number
          similarity_threshold?: number
        }
        Returns: {
          id: string
          title: string
          content: string
          similarity: number
          memory_type: string
          importance_score: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      subscribe_to_user_channels: {
        Args: { user_id_param: string }
        Returns: string[]
      }
      suggest_next_action: {
        Args: { lead_id_param: string }
        Returns: string
      }
      update_user_presence: {
        Args: { status?: string; activity?: string }
        Returns: undefined
      }
      user_can_access_client: {
        Args: { client_id_param: string }
        Returns: boolean
      }
      user_can_access_lead: {
        Args: { lead_id_param: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { user_id: string; required_role: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const
