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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      batch_status_history: {
        Row: {
          batch_id: string
          changed_by: string
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          status: Database["public"]["Enums"]["batch_status"]
        }
        Insert: {
          batch_id: string
          changed_by: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          status: Database["public"]["Enums"]["batch_status"]
        }
        Update: {
          batch_id?: string
          changed_by?: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
        }
        Relationships: [
          {
            foreignKeyName: "batch_status_history_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          batch_number: string
          created_at: string | null
          current_location: string | null
          delivery_confirmed_at: string | null
          expiry_date: string
          id: string
          manufacturer_id: string
          manufacturing_date: string
          medicine_id: string
          notes: string | null
          pharmacist_id: string | null
          qr_code: string
          quantity: number
          status: Database["public"]["Enums"]["batch_status"]
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          current_location?: string | null
          delivery_confirmed_at?: string | null
          expiry_date: string
          id?: string
          manufacturer_id: string
          manufacturing_date: string
          medicine_id: string
          notes?: string | null
          pharmacist_id?: string | null
          qr_code: string
          quantity: number
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          current_location?: string | null
          delivery_confirmed_at?: string | null
          expiry_date?: string
          id?: string
          manufacturer_id?: string
          manufacturing_date?: string
          medicine_id?: string
          notes?: string | null
          pharmacist_id?: string | null
          qr_code?: string
          quantity?: number
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_pharmacist_id_fkey"
            columns: ["pharmacist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          created_at: string | null
          description: string | null
          dosage_form: string
          generic_name: string | null
          id: string
          manufacturer_id: string
          name: string
          strength: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dosage_form: string
          generic_name?: string | null
          id?: string
          manufacturer_id: string
          name: string
          strength: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dosage_form?: string
          generic_name?: string | null
          id?: string
          manufacturer_id?: string
          name?: string
          strength?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicines_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_email: string
          created_at: string | null
          full_name: string
          id: string
          organization_name: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          contact_email: string
          created_at?: string | null
          full_name: string
          id: string
          organization_name: string
          phone_number?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string | null
          full_name?: string
          id?: string
          organization_name?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
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
      batch_status: "created" | "in_transit" | "delivered" | "received"
      user_role: "manufacturer" | "pharmacist"
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
      batch_status: ["created", "in_transit", "delivered", "received"],
      user_role: ["manufacturer", "pharmacist"],
    },
  },
} as const
