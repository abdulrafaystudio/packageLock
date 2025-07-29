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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      circuit_breaker_state: {
        Row: {
          created_at: string
          failure_count: number
          id: string
          last_failure_time: string | null
          next_retry_time: string | null
          service_name: string
          state: string
          success_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          failure_count?: number
          id?: string
          last_failure_time?: string | null
          next_retry_time?: string | null
          service_name: string
          state?: string
          success_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          failure_count?: number
          id?: string
          last_failure_time?: string | null
          next_retry_time?: string | null
          service_name?: string
          state?: string
          success_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      contacted_investors: {
        Row: {
          contact_date: string
          created_at: string
          id: string
          investor_id: string
          investor_name: string
          investor_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_date?: string
          created_at?: string
          id?: string
          investor_id: string
          investor_name: string
          investor_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_date?: string
          created_at?: string
          id?: string
          investor_id?: string
          investor_name?: string
          investor_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacted_investors_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          asking_price: number | null
          cash_flow: number | null
          company_name: string | null
          company_valuation: number | null
          created_at: string
          custom_industry: string | null
          deal_type: string
          description: string
          ebitda: number | null
          funding_target: number | null
          gross_revenue: number | null
          growth_expansions: string | null
          id: string
          industry: string
          location: string
          patents: string | null
          percentage_for_sale: number | null
          reason_for_investing: string | null
          reason_for_selling: string | null
          status: string | null
          technology_assets: string | null
          title: string
          updated_at: string
          user_id: string
          video_link: string | null
          video_links: string | null
          website: string | null
          year_founded: number
        }
        Insert: {
          asking_price?: number | null
          cash_flow?: number | null
          company_name?: string | null
          company_valuation?: number | null
          created_at?: string
          custom_industry?: string | null
          deal_type: string
          description: string
          ebitda?: number | null
          funding_target?: number | null
          gross_revenue?: number | null
          growth_expansions?: string | null
          id?: string
          industry: string
          location: string
          patents?: string | null
          percentage_for_sale?: number | null
          reason_for_investing?: string | null
          reason_for_selling?: string | null
          status?: string | null
          technology_assets?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_link?: string | null
          video_links?: string | null
          website?: string | null
          year_founded: number
        }
        Update: {
          asking_price?: number | null
          cash_flow?: number | null
          company_name?: string | null
          company_valuation?: number | null
          created_at?: string
          custom_industry?: string | null
          deal_type?: string
          description?: string
          ebitda?: number | null
          funding_target?: number | null
          gross_revenue?: number | null
          growth_expansions?: string | null
          id?: string
          industry?: string
          location?: string
          patents?: string | null
          percentage_for_sale?: number | null
          reason_for_investing?: string | null
          reason_for_selling?: string | null
          status?: string | null
          technology_assets?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_link?: string | null
          video_links?: string | null
          website?: string | null
          year_founded?: number
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          from_email: string
          id: string
          subject: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_email: string
          id?: string
          subject: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_email?: string
          id?: string
          subject?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      error_recovery_log: {
        Row: {
          created_at: string
          error_message: string | null
          exponential_backoff_seconds: number
          id: string
          max_retries: number
          metadata: Json | null
          next_retry_time: string | null
          operation_type: string
          resolved: boolean
          retry_count: number
          service_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          exponential_backoff_seconds?: number
          id?: string
          max_retries?: number
          metadata?: Json | null
          next_retry_time?: string | null
          operation_type: string
          resolved?: boolean
          retry_count?: number
          service_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          exponential_backoff_seconds?: number
          id?: string
          max_retries?: number
          metadata?: Json | null
          next_retry_time?: string | null
          operation_type?: string
          resolved?: boolean
          retry_count?: number
          service_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      incomplete_signups: {
        Row: {
          billing_frequency: string
          company_name: string | null
          created_at: string
          email: string
          expires_at: string | null
          full_name: string | null
          id: string
          ip_address: unknown | null
          package_type: Database["public"]["Enums"]["package_type"]
          password: string | null
          signup_source: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          billing_frequency: string
          company_name?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          ip_address?: unknown | null
          package_type: Database["public"]["Enums"]["package_type"]
          password?: string | null
          signup_source?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          billing_frequency?: string
          company_name?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          ip_address?: unknown | null
          package_type?: Database["public"]["Enums"]["package_type"]
          password?: string | null
          signup_source?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      investors: {
        Row: {
          contact_name: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          investor_name: string
          phone: string | null
          preferred_geographical_areas: string | null
          preferred_investment_types: string | null
          role: string | null
          sectors: string | null
          type: string | null
          updated_at: string
          verticals: string | null
          website: string | null
        }
        Insert: {
          contact_name?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          investor_name: string
          phone?: string | null
          preferred_geographical_areas?: string | null
          preferred_investment_types?: string | null
          role?: string | null
          sectors?: string | null
          type?: string | null
          updated_at?: string
          verticals?: string | null
          website?: string | null
        }
        Update: {
          contact_name?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          investor_name?: string
          phone?: string | null
          preferred_geographical_areas?: string | null
          preferred_investment_types?: string | null
          role?: string | null
          sectors?: string | null
          type?: string | null
          updated_at?: string
          verticals?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          email_verified: boolean
          full_name: string | null
          grace_period_end: string | null
          id: string
          is_active: boolean
          last_login: string | null
          package_type: Database["public"]["Enums"]["package_type"] | null
          pending_downgrade_date: string | null
          pending_downgrade_to:
            | Database["public"]["Enums"]["package_type"]
            | null
          phone: string | null
          signup_source: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status_type"]
            | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          grace_period_end?: string | null
          id: string
          is_active?: boolean
          last_login?: string | null
          package_type?: Database["public"]["Enums"]["package_type"] | null
          pending_downgrade_date?: string | null
          pending_downgrade_to?:
            | Database["public"]["Enums"]["package_type"]
            | null
          phone?: string | null
          signup_source?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status_type"]
            | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean
          full_name?: string | null
          grace_period_end?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          package_type?: Database["public"]["Enums"]["package_type"] | null
          pending_downgrade_date?: string | null
          pending_downgrade_to?:
            | Database["public"]["Enums"]["package_type"]
            | null
          phone?: string | null
          signup_source?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status_type"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      recovery_log: {
        Row: {
          action_taken: string
          created_at: string | null
          details: Json | null
          email: string
          id: string
          success: boolean
        }
        Insert: {
          action_taken: string
          created_at?: string | null
          details?: Json | null
          email: string
          id?: string
          success: boolean
        }
        Update: {
          action_taken?: string
          created_at?: string | null
          details?: Json | null
          email?: string
          id?: string
          success?: boolean
        }
        Relationships: []
      }
      signup_audit_log: {
        Row: {
          attempt_time: string | null
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          package_type: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          package_type?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          package_type?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          current_period_end: string | null
          email: string
          id: string
          proration_credits: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status_type"]
            | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          email: string
          id?: string
          proration_credits?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status_type"]
            | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          email?: string
          id?: string
          proration_credits?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status_type"]
            | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_audit: {
        Row: {
          action_type: string
          created_at: string
          error_details: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          source: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          error_details?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          source?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          error_details?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_frequency: string
          created_at: string
          id: string
          is_active: boolean | null
          monthly_price: number | null
          package_type: Database["public"]["Enums"]["package_type"]
          stripe_price_id: string
          updated_at: string
          yearly_price: number | null
        }
        Insert: {
          billing_frequency: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          monthly_price?: number | null
          package_type: Database["public"]["Enums"]["package_type"]
          stripe_price_id: string
          updated_at?: string
          yearly_price?: number | null
        }
        Update: {
          billing_frequency?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          monthly_price?: number | null
          package_type?: Database["public"]["Enums"]["package_type"]
          stripe_price_id?: string
          updated_at?: string
          yearly_price?: number | null
        }
        Relationships: []
      }
      subscription_transitions: {
        Row: {
          created_at: string
          effective_date: string
          from_billing_frequency: string | null
          from_plan: Database["public"]["Enums"]["package_type"] | null
          id: string
          proration_amount: number | null
          stripe_subscription_id: string | null
          to_billing_frequency: string | null
          to_plan: Database["public"]["Enums"]["package_type"]
          transition_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          effective_date?: string
          from_billing_frequency?: string | null
          from_plan?: Database["public"]["Enums"]["package_type"] | null
          id?: string
          proration_amount?: number | null
          stripe_subscription_id?: string | null
          to_billing_frequency?: string | null
          to_plan: Database["public"]["Enums"]["package_type"]
          transition_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          effective_date?: string
          from_billing_frequency?: string | null
          from_plan?: Database["public"]["Enums"]["package_type"] | null
          id?: string
          proration_amount?: number | null
          stripe_subscription_id?: string | null
          to_billing_frequency?: string | null
          to_plan?: Database["public"]["Enums"]["package_type"]
          transition_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_data: Json | null
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          retry_count: number | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      webhook_retry_queue: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          last_error: string | null
          max_retries: number | null
          next_retry_at: string | null
          retry_count: number | null
          status: string | null
          webhook_event_id: string
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          last_error?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          retry_count?: number | null
          status?: string | null
          webhook_event_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          last_error?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          retry_count?: number | null
          status?: string | null
          webhook_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_by_email: {
        Args: { user_email: string }
        Returns: boolean
      }
      audit_admin_action: {
        Args: {
          action_type: string
          table_name: string
          record_id: string
          details?: Json
        }
        Returns: undefined
      }
      auto_heal_missing_customer_ids: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_circuit_breaker: {
        Args: {
          p_service_name: string
          p_failure_threshold?: number
          p_timeout_seconds?: number
        }
        Returns: Json
      }
      check_user_admin_status: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      cleanup_expired_incomplete_signups: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_failed_signup: {
        Args: { user_email: string }
        Returns: boolean
      }
      complete_paid_signup: {
        Args: {
          p_email: string
          p_stripe_customer_id: string
          p_stripe_subscription_id: string
          p_subscription_tier: string
          p_full_name?: string
          p_company_name?: string
          p_password?: string
        }
        Returns: Json
      }
      create_auth_token_for_payment: {
        Args: { p_email: string; p_user_id: string }
        Returns: Json
      }
      create_incomplete_signup: {
        Args:
          | {
              p_email: string
              p_full_name: string
              p_package_type: Database["public"]["Enums"]["package_type"]
              p_billing_frequency: string
              p_company_name?: string
              p_stripe_session_id?: string
            }
          | {
              p_email: string
              p_full_name: string
              p_package_type: Database["public"]["Enums"]["package_type"]
              p_billing_frequency: string
              p_company_name?: string
              p_stripe_session_id?: string
              p_password?: string
            }
        Returns: string
      }
      create_stripe_customer_for_upgrade: {
        Args: { p_email: string; p_full_name?: string; p_company_name?: string }
        Returns: Json
      }
      enhanced_safe_save_stripe_customer_id: {
        Args: {
          p_user_id: string
          p_email: string
          p_stripe_customer_id: string
          p_subscription_tier?: string
          p_subscription_status?: Database["public"]["Enums"]["subscription_status_type"]
          p_subscription_end?: string
          p_current_period_end?: string
        }
        Returns: Json
      }
      enhancedsafesavestripecustomerid: {
        Args: {
          p_user_id: string
          p_email: string
          p_stripe_customer_id: string
          p_package_type: string
          p_subscription_status: string
          p_subscription_end: string
          p_stripe_subscription_id: string
        }
        Returns: Json
      }
      ensure_stripe_customer_id: {
        Args: { p_user_id: string; p_email: string }
        Returns: Json
      }
      get_all_users_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          full_name: string
          email: string
          company_name: string
          package_type: string
          subscription_start_date: string
          subscription_end_date: string
          is_active: boolean
          last_login: string
          created_at: string
          days_since_signup: number
        }[]
      }
      get_package_type_from_price_id: {
        Args: { p_price_id: string }
        Returns: string
      }
      get_stripe_price_id: {
        Args: {
          p_package_type: Database["public"]["Enums"]["package_type"]
          p_billing_frequency: string
        }
        Returns: string
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_signup_attempt_enhanced: {
        Args: {
          user_email: string
          package_type: string
          success: boolean
          error_message?: string
          ip_address?: string
          user_agent?: string
          metadata?: Json
        }
        Returns: undefined
      }
      log_subscription_transition: {
        Args: {
          p_user_id: string
          p_from_plan: Database["public"]["Enums"]["package_type"]
          p_to_plan: Database["public"]["Enums"]["package_type"]
          p_from_billing?: string
          p_to_billing?: string
          p_transition_type?: string
          p_proration_amount?: number
          p_stripe_subscription_id?: string
        }
        Returns: string
      }
      mark_retry_resolved: {
        Args: {
          p_service_name: string
          p_operation_type: string
          p_user_id?: string
        }
        Returns: undefined
      }
      process_due_downgrades: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_webhook_retries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reconcile_subscription_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      record_circuit_breaker_failure: {
        Args: {
          p_service_name: string
          p_failure_threshold?: number
          p_timeout_seconds?: number
        }
        Returns: undefined
      }
      record_circuit_breaker_success: {
        Args: { p_service_name: string }
        Returns: undefined
      }
      recover_missing_profiles: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      recover_missing_stripe_customer_ids: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      recover_missing_subscription_ids: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      recover_stuck_account: {
        Args: { p_email: string }
        Returns: Json
      }
      recover_stuck_paid_account: {
        Args: { p_email: string; p_force_recovery?: boolean }
        Returns: Json
      }
      remove_admin_by_email: {
        Args: { user_email: string }
        Returns: boolean
      }
      retry_failed_webhook_processing: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      safe_save_stripe_customer_id: {
        Args: {
          p_user_id: string
          p_email: string
          p_stripe_customer_id: string
          p_subscription_tier?: string
          p_subscription_status?: Database["public"]["Enums"]["subscription_status_type"]
        }
        Returns: Json
      }
      save_just_in_time_customer_id: {
        Args: { p_email: string; p_stripe_customer_id: string }
        Returns: Json
      }
      schedule_retry_with_backoff: {
        Args: {
          p_service_name: string
          p_operation_type: string
          p_error_message: string
          p_user_id?: string
          p_metadata?: Json
          p_max_retries?: number
        }
        Returns: Json
      }
      send_upgrade_notification: {
        Args: {
          p_user_id: string
          p_package_type: string
          p_subscription_status?: string
          p_subscription_end?: string
        }
        Returns: boolean
      }
      sync_profile_subscriber_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_package_type_enum: {
        Args: Record<PropertyKey, never>
        Returns: {
          enum_value: string
          is_valid: boolean
        }[]
      }
      test_profiles_table_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          success: boolean
          error_message: string
        }[]
      }
      validate_paid_subscribers_have_customer_id: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          issue: string
        }[]
      }
      validate_subscription_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          issue_type: string
          profile_data: Json
          subscriber_data: Json
          recommended_action: string
        }[]
      }
      validate_subscription_sync: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          issue_type: string
          profiles_status: string
          subscribers_status: string
          recommended_action: string
        }[]
      }
      validate_upgrade_prerequisites: {
        Args: { p_email: string }
        Returns: Json
      }
      validate_user_permissions: {
        Args: { check_user_id?: string; required_tier?: string }
        Returns: Json
      }
      verify_account_creation_complete: {
        Args: { user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      package_type:
        | "free"
        | "freepro"
        | "standard"
        | "premium"
        | "premiumpro"
        | "enterprise"
      subscription_status_type:
        | "active"
        | "pending_subscription"
        | "past_due"
        | "cancelled"
        | "pending_downgrade"
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
  public: {
    Enums: {
      package_type: [
        "free",
        "freepro",
        "standard",
        "premium",
        "premiumpro",
        "enterprise",
      ],
      subscription_status_type: [
        "active",
        "pending_subscription",
        "past_due",
        "cancelled",
        "pending_downgrade",
      ],
    },
  },
} as const
