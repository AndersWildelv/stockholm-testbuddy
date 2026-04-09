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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booked_by: string
          booked_by_email: string | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          person_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          booked_by: string
          booked_by_email?: string | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          person_id: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          booked_by?: string
          booked_by_email?: string | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          person_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          created_at: string
          error_rows: number | null
          file_name: string
          id: string
          imported_by: string
          published_at: string | null
          status: string
          total_rows: number | null
          valid_rows: number | null
          validation_report: Json | null
        }
        Insert: {
          created_at?: string
          error_rows?: number | null
          file_name: string
          id?: string
          imported_by: string
          published_at?: string | null
          status?: string
          total_rows?: number | null
          valid_rows?: number | null
          validation_report?: Json | null
        }
        Update: {
          created_at?: string
          error_rows?: number | null
          file_name?: string
          id?: string
          imported_by?: string
          published_at?: string | null
          status?: string
          total_rows?: number | null
          valid_rows?: number | null
          validation_report?: Json | null
        }
        Relationships: []
      }
      persons: {
        Row: {
          additional_attributes: Json | null
          address: string | null
          birth_country: string | null
          birth_date: string | null
          city: string | null
          civil_status: string | null
          county_code: string | null
          created_at: string
          district_code: string | null
          email: string | null
          first_name: string
          gender: string | null
          hsa_id: string | null
          id: string
          is_bookable: boolean
          is_fictitious: boolean
          is_static: boolean
          last_name: string
          middle_name: string | null
          municipality: string | null
          municipality_code: string | null
          parish_code: string | null
          person_id: string
          person_type: Database["public"]["Enums"]["person_type"]
          personnummer: string | null
          phone: string | null
          pnr_type: string | null
          postal_code: string | null
          protected_identity: boolean
          region: string | null
          updated_at: string
        }
        Insert: {
          additional_attributes?: Json | null
          address?: string | null
          birth_country?: string | null
          birth_date?: string | null
          city?: string | null
          civil_status?: string | null
          county_code?: string | null
          created_at?: string
          district_code?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          hsa_id?: string | null
          id?: string
          is_bookable?: boolean
          is_fictitious?: boolean
          is_static?: boolean
          last_name: string
          middle_name?: string | null
          municipality?: string | null
          municipality_code?: string | null
          parish_code?: string | null
          person_id: string
          person_type?: Database["public"]["Enums"]["person_type"]
          personnummer?: string | null
          phone?: string | null
          pnr_type?: string | null
          postal_code?: string | null
          protected_identity?: boolean
          region?: string | null
          updated_at?: string
        }
        Update: {
          additional_attributes?: Json | null
          address?: string | null
          birth_country?: string | null
          birth_date?: string | null
          city?: string | null
          civil_status?: string | null
          county_code?: string | null
          created_at?: string
          district_code?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          hsa_id?: string | null
          id?: string
          is_bookable?: boolean
          is_fictitious?: boolean
          is_static?: boolean
          last_name?: string
          middle_name?: string | null
          municipality?: string | null
          municipality_code?: string | null
          parish_code?: string | null
          person_id?: string
          person_type?: Database["public"]["Enums"]["person_type"]
          personnummer?: string | null
          phone?: string | null
          pnr_type?: string | null
          postal_code?: string | null
          protected_identity?: boolean
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      relations: {
        Row: {
          created_at: string
          id: string
          person_id: string
          related_person_id: string
          relation_type: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          person_id: string
          related_person_id: string
          relation_type: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          person_id?: string
          related_person_id?: string
          relation_type?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relations_related_person_id_fkey"
            columns: ["related_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
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
      kp_person_relationships: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: number | null
          person_a: string | null
          person_b: string | null
          rel_typ: string | null
          relation_label: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: number | null
          person_a?: string | null
          person_b?: string | null
          rel_typ?: string | null
          relation_label?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: number | null
          person_a?: string | null
          person_b?: string | null
          rel_typ?: string | null
          relation_label?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      kp_persons: {
        Row: {
          booked_to_region_stockholm: boolean | null
          county: string | null
          created_at: string | null
          fb_address1: string | null
          fb_address2: string | null
          fb_postnr: string | null
          fb_postort: string | null
          first_name: string | null
          gender: string | null
          hsaid: string | null
          last_name: string | null
          middle_name: string | null
          municipality: string | null
          pnr: string | null
          updated_at: string | null
        }
        Insert: {
          booked_to_region_stockholm?: boolean | null
          county?: string | null
          created_at?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: string | null
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          updated_at?: string | null
        }
        Update: {
          booked_to_region_stockholm?: boolean | null
          county?: string | null
          created_at?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: string | null
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kp_v_married_couples: {
        Row: {
          person_1: string | null
          person_1_booked: boolean | null
          person_1_first_name: string | null
          person_1_hsaid: string | null
          person_1_last_name: string | null
          person_2: string | null
          person_2_booked: boolean | null
          person_2_first_name: string | null
          person_2_hsaid: string | null
          person_2_last_name: string | null
        }
        Relationships: []
      }
      kp_v_person_directory: {
        Row: {
          booked_to_region_stockholm: boolean | null
          county: string | null
          fb_address1: string | null
          fb_address2: string | null
          fb_postnr: string | null
          fb_postort: string | null
          first_name: string | null
          gender: string | null
          hsaid: string | null
          last_name: string | null
          middle_name: string | null
          municipality: string | null
          pnr: string | null
        }
        Insert: {
          booked_to_region_stockholm?: boolean | null
          county?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: string | null
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
        }
        Update: {
          booked_to_region_stockholm?: boolean | null
          county?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: string | null
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
        }
        Relationships: []
      }
      kp_v_region_stockholm_booked: {
        Row: {
          booked_to_region_stockholm: boolean | null
          county: string | null
          created_at: string | null
          fb_address1: string | null
          fb_address2: string | null
          fb_postnr: string | null
          fb_postort: string | null
          first_name: string | null
          gender: string | null
          hsaid: string | null
          last_name: string | null
          middle_name: string | null
          municipality: string | null
          pnr: string | null
          updated_at: string | null
        }
        Insert: {
          booked_to_region_stockholm?: boolean | null
          county?: string | null
          created_at?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: string | null
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          updated_at?: string | null
        }
        Update: {
          booked_to_region_stockholm?: boolean | null
          county?: string | null
          created_at?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: string | null
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "viewer"
      booking_status: "active" | "released" | "expired"
      person_type: "Personal" | "Invånare"
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
      app_role: ["admin", "viewer"],
      booking_status: ["active", "released", "expired"],
      person_type: ["Personal", "Invånare"],
    },
  },
} as const
