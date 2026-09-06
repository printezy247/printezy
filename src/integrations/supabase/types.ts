export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_telegram_links: {
        Row: {
          linked_at: string
          telegram_id: number
          telegram_username: string | null
          user_id: string
        }
        Insert: {
          linked_at?: string
          telegram_id: number
          telegram_username?: string | null
          user_id: string
        }
        Update: {
          linked_at?: string
          telegram_id?: number
          telegram_username?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ad_clicks: {
        Row: {
          created_at: string
          fbclid: string | null
          landing_path: string | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          fbclid?: string | null
          landing_path?: string | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          fbclid?: string | null
          landing_path?: string | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          event_type: string
          id: string
          path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_type: string
          id?: string
          path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_type?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      bot_users: {
        Row: {
          chat_with_sarah: boolean
          created_at: string
          first_name: string | null
          lang: string | null
          missed_alert_sent: boolean
          session_id: string | null
          telegram_id: number
          updated_at: string
          username: string | null
        }
        Insert: {
          chat_with_sarah?: boolean
          created_at?: string
          first_name?: string | null
          lang?: string | null
          missed_alert_sent?: boolean
          session_id?: string | null
          telegram_id: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          chat_with_sarah?: boolean
          created_at?: string
          first_name?: string | null
          lang?: string | null
          missed_alert_sent?: boolean
          session_id?: string | null
          telegram_id?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      ebook_claims: {
        Row: {
          approved_at: string | null
          claimed_at: string
          full_name: string | null
          id: string
          slug: string
          status: string
          telegram_username: string | null
          user_id: string
          vantage_account: string | null
          vantage_confirmed: boolean
        }
        Insert: {
          approved_at?: string | null
          claimed_at?: string
          full_name?: string | null
          id?: string
          slug: string
          status?: string
          telegram_username?: string | null
          user_id: string
          vantage_account?: string | null
          vantage_confirmed?: boolean
        }
        Update: {
          approved_at?: string | null
          claimed_at?: string
          full_name?: string | null
          id?: string
          slug?: string
          status?: string
          telegram_username?: string | null
          user_id?: string
          vantage_account?: string | null
          vantage_confirmed?: boolean
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          activated_at: string | null
          activation_source: string | null
          amount_cents: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          portal_token: string
          session_id: string | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          telegram_id: number
          tier: string
        }
        Insert: {
          activated_at?: string | null
          activation_source?: string | null
          amount_cents?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          portal_token: string
          session_id?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          telegram_id: number
          tier: string
        }
        Update: {
          activated_at?: string | null
          activation_source?: string | null
          amount_cents?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          portal_token?: string
          session_id?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          telegram_id?: number
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "bot_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      ezyai_entitlements: {
        Row: {
          amount_cents: number
          claimed_at: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          months: number
          redeem_code: string | null
          sku: string
          status: string
          stripe_session_id: string
          telegram_id: number | null
          telegram_username: string
        }
        Insert: {
          amount_cents?: number
          claimed_at?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          months: number
          redeem_code?: string | null
          sku: string
          status?: string
          stripe_session_id: string
          telegram_id?: number | null
          telegram_username: string
        }
        Update: {
          amount_cents?: number
          claimed_at?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          months?: number
          redeem_code?: string | null
          sku?: string
          status?: string
          stripe_session_id?: string
          telegram_id?: number | null
          telegram_username?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          session_id: string | null
          source: string
          telegram_username: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          session_id?: string | null
          source: string
          telegram_username?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          session_id?: string | null
          source?: string
          telegram_username?: string | null
        }
        Relationships: []
      }
      login_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          telegram_id: number
          used_at: string | null
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          telegram_id: number
          used_at?: string | null
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          telegram_id?: number
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_codes_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "bot_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      member_sessions: {
        Row: {
          created_at: string
          expires_at: string
          last_seen_at: string
          telegram_id: number
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          last_seen_at?: string
          telegram_id: number
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          last_seen_at?: string
          telegram_id?: number
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_sessions_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "bot_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          capital_range: string | null
          created_at: string
          email: string | null
          experience_level: string | null
          full_name: string | null
          id: string
          mt5_account: string | null
          referred_by: string | null
          telegram_id: number | null
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          capital_range?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          id: string
          mt5_account?: string | null
          referred_by?: string | null
          telegram_id?: number | null
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          capital_range?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          mt5_account?: string | null
          referred_by?: string | null
          telegram_id?: number | null
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket_key: string
          count: number
          window_start: string
        }
        Insert: {
          bucket_key: string
          count?: number
          window_start?: string
        }
        Update: {
          bucket_key?: string
          count?: number
          window_start?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          created_at: string
          direction: string
          entry_price: number | null
          id: string
          min_tier: string
          note: string | null
          published_at: string
          result_pips: number | null
          status: string
          stop_price: number | null
          symbol: string
          target_price: number | null
        }
        Insert: {
          created_at?: string
          direction?: string
          entry_price?: number | null
          id?: string
          min_tier?: string
          note?: string | null
          published_at?: string
          result_pips?: number | null
          status?: string
          stop_price?: number | null
          symbol: string
          target_price?: number | null
        }
        Update: {
          created_at?: string
          direction?: string
          entry_price?: number | null
          id?: string
          min_tier?: string
          note?: string | null
          published_at?: string
          result_pips?: number | null
          status?: string
          stop_price?: number | null
          symbol?: string
          target_price?: number | null
        }
        Relationships: []
      }
      site_purchases: {
        Row: {
          amount_cents: number
          capital_range: string | null
          claim_code: string | null
          claimed_by_telegram_id: number | null
          created_at: string
          currency: string
          email: string | null
          experience_level: string | null
          full_name: string | null
          granted_at: string | null
          id: string
          mt5_account: string | null
          sku: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string
          telegram_username: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents?: number
          capital_range?: string | null
          claim_code?: string | null
          claimed_by_telegram_id?: number | null
          created_at?: string
          currency?: string
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          granted_at?: string | null
          id?: string
          mt5_account?: string | null
          sku: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id: string
          telegram_username?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          capital_range?: string | null
          claim_code?: string | null
          claimed_by_telegram_id?: number | null
          created_at?: string
          currency?: string
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          granted_at?: string | null
          id?: string
          mt5_account?: string | null
          sku?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string
          telegram_username?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          direction: string
          display_name: string | null
          id: number
          member_telegram_id: number | null
          sarah_message_id: number | null
          text: string | null
          web_session_id: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          display_name?: string | null
          id?: never
          member_telegram_id?: number | null
          sarah_message_id?: number | null
          text?: string | null
          web_session_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          display_name?: string | null
          id?: never
          member_telegram_id?: number | null
          sarah_message_id?: number | null
          text?: string | null
          web_session_id?: string | null
        }
        Relationships: []
      }
      telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          closed_at: string | null
          created_at: string
          direction: string
          entry_price: number | null
          exit_price: number | null
          id: string
          notes: string | null
          opened_at: string
          pips: number | null
          pnl: number | null
          size: number | null
          status: string
          symbol: string
          telegram_id: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          direction?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          pips?: number | null
          pnl?: number | null
          size?: number | null
          status?: string
          symbol: string
          telegram_id: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          direction?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          pips?: number | null
          pnl?: number | null
          size?: number | null
          status?: string
          symbol?: string
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trades_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "bot_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_summary: {
        Args: { p_days?: number }
        Returns: {
          event_name: string
          event_type: string
          total: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_rate_limit: {
        Args: { p_bucket_key: string; p_window_start: string }
        Returns: number
      }
      record_ad_click: {
        Args: {
          p_fbclid: string
          p_landing_path?: string
          p_session_id: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
