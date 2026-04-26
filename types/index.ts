export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          launched_at: string | null
          name: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          launched_at?: string | null
          name: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          launched_at?: string | null
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          campaign_id: string
          company_name: string | null
          company_roof_picture: string | null
          contact_function: string | null
          created_at: string
          email: string
          email_valid: boolean
          first_name: string
          general_phone: string | null
          id: string
          last_name: string | null
          lead_type: string | null
          linkedin_url: string | null
          meeting_booked: boolean
          meeting_booked_at: string | null
          nace_industry: string | null
          phone: string | null
          status: string
          surface_area: string | null
          unsubscribed_at: string | null
          unsubscribed_source: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          campaign_id: string
          company_name?: string | null
          company_roof_picture?: string | null
          contact_function?: string | null
          created_at?: string
          email: string
          email_valid?: boolean
          first_name: string
          general_phone?: string | null
          id?: string
          last_name?: string | null
          lead_type?: string | null
          linkedin_url?: string | null
          meeting_booked?: boolean
          meeting_booked_at?: string | null
          nace_industry?: string | null
          phone?: string | null
          status?: string
          surface_area?: string | null
          unsubscribed_at?: string | null
          unsubscribed_source?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          campaign_id?: string
          company_name?: string | null
          company_roof_picture?: string | null
          contact_function?: string | null
          created_at?: string
          email?: string
          email_valid?: boolean
          first_name?: string
          general_phone?: string | null
          id?: string
          last_name?: string | null
          lead_type?: string | null
          linkedin_url?: string | null
          meeting_booked?: boolean
          meeting_booked_at?: string | null
          nace_industry?: string | null
          phone?: string | null
          status?: string
          surface_area?: string | null
          unsubscribed_at?: string | null
          unsubscribed_source?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          contact_id: string
          event_type: string
          id: string
          message_id: string | null
          step_index: number
          timestamp: string
          user_agent: string | null
          url: string | null
        }
        Insert: {
          contact_id: string
          event_type: string
          id?: string
          message_id?: string | null
          step_index: number
          timestamp?: string
          user_agent?: string | null
          url?: string | null
        }
        Update: {
          contact_id?: string
          event_type?: string
          id?: string
          message_id?: string | null
          step_index?: number
          timestamp?: string
          user_agent?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      mailbox_connections: {
        Row: {
          access_token: string
          connected_at: string
          email_address: string
          id: string
          provider: string
          refresh_token: string
          status: string
          token_expires_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          email_address: string
          id?: string
          provider: string
          refresh_token: string
          status?: string
          token_expires_at: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          email_address?: string
          id?: string
          provider?: string
          refresh_token?: string
          status?: string
          token_expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          body_text: string | null
          contact_id: string
          id: string
          raw_message_id: string | null
          received_at: string
        }
        Insert: {
          body_text?: string | null
          contact_id: string
          id?: string
          raw_message_id?: string | null
          received_at?: string
        }
        Update: {
          body_text?: string | null
          contact_id?: string
          id?: string
          raw_message_id?: string | null
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tasks: {
        Row: {
          campaign_id: string
          completed_at: string | null
          contact_id: string
          created_at: string
          due_at: string
          id: string
          task_type: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          contact_id: string
          created_at?: string
          due_at: string
          id?: string
          task_type: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          due_at?: string
          id?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_sends: {
        Row: {
          contact_id: string
          id: string
          scheduled_at: string
          sent_at: string | null
          status: string
          step_index: number
          thread_id: string | null
        }
        Insert: {
          contact_id: string
          id?: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          step_index: number
          thread_id?: string | null
        }
        Update: {
          contact_id?: string
          id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          step_index?: number
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          campaign_id: string
          created_at: string
          delay_business_days: number
          id: string
          task_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          delay_business_days?: number
          id?: string
          task_type: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          delay_business_days?: number
          id?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_steps: {
        Row: {
          body_html: string | null
          campaign_id: string
          condition_open_required: boolean
          delay_business_days: number
          id: string
          step_index: number
          step_type: string
          subject: string | null
        }
        Insert: {
          body_html?: string | null
          campaign_id: string
          condition_open_required?: boolean
          delay_business_days?: number
          id?: string
          step_index: number
          step_type?: string
          subject?: string | null
        }
        Update: {
          body_html?: string | null
          campaign_id?: string
          condition_open_required?: boolean
          delay_business_days?: number
          id?: string
          step_index?: number
          step_type?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

// ── Narrow domain types ──────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type ContactStatus  = 'not_contacted' | 'sent' | 'opened' | 'replied'
export type SendStatus     = 'pending' | 'sent' | 'cancelled' | 'failed'
export type EventType      = 'sent' | 'opened' | 'opened_proxy' | 'clicked' | 'replied'
export type Provider       = 'gmail' | 'outlook'
export type MailboxStatus  = 'connected' | 'disconnected'
export type StepIndex      = number

export type Campaign          = Database['public']['Tables']['campaigns']['Row']
export type Contact           = Database['public']['Tables']['contacts']['Row']
export type MailboxConnection = Database['public']['Tables']['mailbox_connections']['Row']
export type SequenceStep      = Database['public']['Tables']['sequence_steps']['Row']
export type ScheduledSend     = Database['public']['Tables']['scheduled_sends']['Row']
export type EmailEvent        = Database['public']['Tables']['email_events']['Row']
export type Reply             = Database['public']['Tables']['replies']['Row']
export type TaskTemplate      = Database['public']['Tables']['task_templates']['Row']
export type ContactTask       = Database['public']['Tables']['contact_tasks']['Row']
export type TaskType          = 'linkedin' | 'phone'
