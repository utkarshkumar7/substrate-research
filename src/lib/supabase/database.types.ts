// AUTO-GENERATED — do not edit manually. Run scripts/gen-supabase-types.sh to regenerate.
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
      journal_entries: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          symbol: string | null
          direction: string | null
          status: string
          entry_price: number | null
          exit_price: number | null
          shares: number | null
          thesis: string
          outcome_notes: string | null
          tags: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          symbol?: string | null
          direction?: string | null
          status?: string
          entry_price?: number | null
          exit_price?: number | null
          shares?: number | null
          thesis: string
          outcome_notes?: string | null
          tags?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          symbol?: string | null
          direction?: string | null
          status?: string
          entry_price?: number | null
          exit_price?: number | null
          shares?: number | null
          thesis?: string
          outcome_notes?: string | null
          tags?: string[]
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          cost_basis: number | null
          notes: string | null
          shares: number
          symbol: string
          updated_at: string
        }
        Insert: {
          cost_basis?: number | null
          notes?: string | null
          shares: number
          symbol: string
          updated_at?: string
        }
        Update: {
          cost_basis?: number | null
          notes?: string | null
          shares?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: true
            referencedRelation: "tickers"
            referencedColumns: ["symbol"]
          },
        ]
      }
      insights: {
        Row: {
          body: string
          cost_usd: number | null
          created_at: string
          id: string
          input_tokens: number | null
          kind: string
          metadata: Json | null
          model: string | null
          output_tokens: number | null
          related_layers: string[]
          related_symbols: string[]
          title: string
        }
        Insert: {
          body: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          kind: string
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          related_layers?: string[]
          related_symbols?: string[]
          title: string
        }
        Update: {
          body?: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          kind?: string
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          related_layers?: string[]
          related_symbols?: string[]
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          close: number
          high: number | null
          low: number | null
          open: number | null
          symbol: string
          trade_date: string
          volume: number | null
        }
        Insert: {
          close: number
          high?: number | null
          low?: number | null
          open?: number | null
          symbol: string
          trade_date: string
          volume?: number | null
        }
        Update: {
          close?: number
          high?: number | null
          low?: number | null
          open?: number | null
          symbol?: string
          trade_date?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_symbol_fkey"
            columns: ["symbol"]
            isOneToOne: false
            referencedRelation: "tickers"
            referencedColumns: ["symbol"]
          },
        ]
      }
      refresh_log: {
        Row: {
          duration_s: number | null
          failed_symbols: string[]
          id: string
          n_failed: number
          n_tickers: number
          notes: string | null
          run_at: string
          success: boolean
        }
        Insert: {
          duration_s?: number | null
          failed_symbols?: string[]
          id?: string
          n_failed?: number
          n_tickers: number
          notes?: string | null
          run_at?: string
          success: boolean
        }
        Update: {
          duration_s?: number | null
          failed_symbols?: string[]
          id?: string
          n_failed?: number
          n_tickers?: number
          notes?: string | null
          run_at?: string
          success?: boolean
        }
        Relationships: []
      }
      tickers: {
        Row: {
          is_etf: boolean
          last_error: string | null
          last_synced_at: string | null
          layer: string
          name: string
          needs_verification: boolean
          notes: string | null
          subcategory: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          is_etf?: boolean
          last_error?: string | null
          last_synced_at?: string | null
          layer: string
          name: string
          needs_verification?: boolean
          notes?: string | null
          subcategory?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          is_etf?: boolean
          last_error?: string | null
          last_synced_at?: string | null
          layer?: string
          name?: string
          needs_verification?: boolean
          notes?: string | null
          subcategory?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
