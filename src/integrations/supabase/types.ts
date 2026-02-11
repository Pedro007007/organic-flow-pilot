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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent_description: string | null
          agent_name: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          items_processed: number | null
          result: Json | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          agent_description?: string | null
          agent_name: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_processed?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agent_description?: string | null
          agent_name?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_processed?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_citations: {
        Row: {
          checked_at: string
          cited: boolean
          engine: string
          id: string
          snippet: string | null
          url: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          cited?: boolean
          engine: string
          id?: string
          snippet?: string | null
          url: string
          user_id: string
        }
        Update: {
          checked_at?: string
          cited?: boolean
          engine?: string
          id?: string
          snippet?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      competitor_scans: {
        Row: {
          created_at: string
          domain: string
          id: string
          keywords_found: Json | null
          meta_patterns: Json | null
          scan_results: Json | null
          schema_types: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          keywords_found?: Json | null
          meta_patterns?: Json | null
          scan_results?: Json | null
          schema_types?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          keywords_found?: Json | null
          meta_patterns?: Json | null
          scan_results?: Json | null
          schema_types?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          author: string
          clicks: number | null
          created_at: string
          draft_content: string | null
          id: string
          impressions: number | null
          keyword: string
          meta_description: string | null
          position: number | null
          schema_types: string[] | null
          seo_title: string | null
          slug: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          author?: string
          clicks?: number | null
          created_at?: string
          draft_content?: string | null
          id?: string
          impressions?: number | null
          keyword: string
          meta_description?: string | null
          position?: number | null
          schema_types?: string[] | null
          seo_title?: string | null
          slug?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          author?: string
          clicks?: number | null
          created_at?: string
          draft_content?: string | null
          id?: string
          impressions?: number | null
          keyword?: string
          meta_description?: string | null
          position?: number | null
          schema_types?: string[] | null
          seo_title?: string | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gsc_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          created_at: string
          id: string
          refresh_token: string
          site_url: string | null
          token_expires_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          refresh_token: string
          site_url?: string | null
          token_expires_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          refresh_token?: string
          site_url?: string | null
          token_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      keywords: {
        Row: {
          clicks: number
          content_type: string
          created_at: string
          ctr: number
          id: string
          impressions: number
          keyword: string
          notes: string | null
          opportunity: string
          position: number
          search_intent: string
          supporting_keywords: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clicks?: number
          content_type?: string
          created_at?: string
          ctr?: number
          id?: string
          impressions?: number
          keyword: string
          notes?: string | null
          opportunity?: string
          position?: number
          search_intent?: string
          supporting_keywords?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clicks?: number
          content_type?: string
          created_at?: string
          ctr?: number
          id?: string
          impressions?: number
          keyword?: string
          notes?: string | null
          opportunity?: string
          position?: number
          search_intent?: string
          supporting_keywords?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_snapshots: {
        Row: {
          change: number
          change_label: string
          created_at: string
          id: string
          label: string
          page_url: string | null
          snapshot_date: string
          user_id: string
          value: string
        }
        Insert: {
          change?: number
          change_label?: string
          created_at?: string
          id?: string
          label: string
          page_url?: string | null
          snapshot_date?: string
          user_id: string
          value: string
        }
        Update: {
          change?: number
          change_label?: string
          created_at?: string
          id?: string
          label?: string
          page_url?: string | null
          snapshot_date?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rankings: {
        Row: {
          ai_cited: boolean
          ai_engine: string | null
          created_at: string
          id: string
          keyword: string
          position: number | null
          previous_position: number | null
          snapshot_date: string
          url: string
          user_id: string
        }
        Insert: {
          ai_cited?: boolean
          ai_engine?: string | null
          created_at?: string
          id?: string
          keyword: string
          position?: number | null
          previous_position?: number | null
          snapshot_date?: string
          url: string
          user_id: string
        }
        Update: {
          ai_cited?: boolean
          ai_engine?: string | null
          created_at?: string
          id?: string
          keyword?: string
          position?: number | null
          previous_position?: number | null
          snapshot_date?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_checklists: {
        Row: {
          auto_verified: boolean
          category: string
          content_item_id: string | null
          created_at: string
          description: string | null
          id: string
          item_label: string
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          auto_verified?: boolean
          category: string
          content_item_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_label: string
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          auto_verified?: boolean
          category?: string
          content_item_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_label?: string
          status?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_checklists_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_fulfilment: {
        Row: {
          category: string
          checked_at: string
          content_item_id: string
          criterion: string
          details: string | null
          id: string
          passed: boolean
          user_id: string
        }
        Insert: {
          category: string
          checked_at?: string
          content_item_id: string
          criterion: string
          details?: string | null
          id?: string
          passed?: boolean
          user_id: string
        }
        Update: {
          category?: string
          checked_at?: string
          content_item_id?: string
          criterion?: string
          details?: string | null
          id?: string
          passed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_fulfilment_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: []
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
      user_settings: {
        Row: {
          agent_schedule: Json | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          agent_schedule?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          agent_schedule?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "viewer"
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
      app_role: ["admin", "operator", "viewer"],
    },
  },
} as const
