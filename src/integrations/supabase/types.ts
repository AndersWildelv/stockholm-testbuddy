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
      actor_organization: {
        Row: {
          actor_id: string | null
          created_stamp: string | null
          id: number
          last_updated_stamp: string | null
          organization_id: string | null
          pnr: string
          updated_date: string | null
        }
        Insert: {
          actor_id?: string | null
          created_stamp?: string | null
          id?: number
          last_updated_stamp?: string | null
          organization_id?: string | null
          pnr: string
          updated_date?: string | null
        }
        Update: {
          actor_id?: string | null
          created_stamp?: string | null
          id?: number
          last_updated_stamp?: string | null
          organization_id?: string | null
          pnr?: string
          updated_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actor_organization_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_persons"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "actor_organization_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_person_directory"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "actor_organization_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_region_stockholm_booked"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "actor_organization_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["pnr"]
          },
        ]
      }
      afb_relation: {
        Row: {
          afb_rel_enamn: string | null
          afb_rel_fnamn: string | null
          afb_rel_fodtid: string | null
          afb_rel_mnamn: string | null
          created_by: string | null
          created_time: string | null
          id: number
          pnr: string
          rel_avr_datum: string | null
          rel_avr_orsak: string | null
          rel_typ: string
          status: string | null
          updated_by: string | null
          updated_time: string | null
          vard_datum: string | null
          vard_slut_datum: string | null
        }
        Insert: {
          afb_rel_enamn?: string | null
          afb_rel_fnamn?: string | null
          afb_rel_fodtid?: string | null
          afb_rel_mnamn?: string | null
          created_by?: string | null
          created_time?: string | null
          id?: number
          pnr: string
          rel_avr_datum?: string | null
          rel_avr_orsak?: string | null
          rel_typ: string
          status?: string | null
          updated_by?: string | null
          updated_time?: string | null
          vard_datum?: string | null
          vard_slut_datum?: string | null
        }
        Update: {
          afb_rel_enamn?: string | null
          afb_rel_fnamn?: string | null
          afb_rel_fodtid?: string | null
          afb_rel_mnamn?: string | null
          created_by?: string | null
          created_time?: string | null
          id?: number
          pnr?: string
          rel_avr_datum?: string | null
          rel_avr_orsak?: string | null
          rel_typ?: string
          status?: string | null
          updated_by?: string | null
          updated_time?: string | null
          vard_datum?: string | null
          vard_slut_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afb_relation_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_persons"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "afb_relation_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_person_directory"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "afb_relation_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_region_stockholm_booked"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "afb_relation_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["pnr"]
          },
        ]
      }
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
      contact_info: {
        Row: {
          contact_info_id: string
          created_stamp: string | null
          last_updated_stamp: string | null
          pnr: string
        }
        Insert: {
          contact_info_id: string
          created_stamp?: string | null
          last_updated_stamp?: string | null
          pnr: string
        }
        Update: {
          contact_info_id?: string
          created_stamp?: string | null
          last_updated_stamp?: string | null
          pnr?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_info_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_persons"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "contact_info_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_person_directory"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "contact_info_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_region_stockholm_booked"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "contact_info_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["pnr"]
          },
        ]
      }
      contact_person: {
        Row: {
          actor_id: string | null
          contact_person_id: string
          contact_relationship_type: string | null
          created_stamp: string | null
          given_name: string | null
          last_updated_stamp: string | null
          main_contact_address_id: string | null
          middle_name: string | null
          organization_id: string | null
          pnr: string
          priority_order: string | null
          surname: string | null
          updated_date: string | null
        }
        Insert: {
          actor_id?: string | null
          contact_person_id: string
          contact_relationship_type?: string | null
          created_stamp?: string | null
          given_name?: string | null
          last_updated_stamp?: string | null
          main_contact_address_id?: string | null
          middle_name?: string | null
          organization_id?: string | null
          pnr: string
          priority_order?: string | null
          surname?: string | null
          updated_date?: string | null
        }
        Update: {
          actor_id?: string | null
          contact_person_id?: string
          contact_relationship_type?: string | null
          created_stamp?: string | null
          given_name?: string | null
          last_updated_stamp?: string | null
          main_contact_address_id?: string | null
          middle_name?: string | null
          organization_id?: string | null
          pnr?: string
          priority_order?: string | null
          surname?: string | null
          updated_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_person_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_persons"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "contact_person_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_person_directory"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "contact_person_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_region_stockholm_booked"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "contact_person_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["pnr"]
          },
        ]
      }
      fastighet_adress: {
        Row: {
          adress: string | null
          created_by: string | null
          created_time: string | null
          fastighet: string | null
          id: number
          lagenhet: string | null
          pnr: string
          updated_by: string | null
          updated_time: string | null
        }
        Insert: {
          adress?: string | null
          created_by?: string | null
          created_time?: string | null
          fastighet?: string | null
          id?: number
          lagenhet?: string | null
          pnr: string
          updated_by?: string | null
          updated_time?: string | null
        }
        Update: {
          adress?: string | null
          created_by?: string | null
          created_time?: string | null
          fastighet?: string | null
          id?: number
          lagenhet?: string | null
          pnr?: string
          updated_by?: string | null
          updated_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fastighet_adress_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_persons"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "fastighet_adress_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_person_directory"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "fastighet_adress_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_region_stockholm_booked"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "fastighet_adress_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["pnr"]
          },
        ]
      }
      fb_relation: {
        Row: {
          created_by: string | null
          created_time: string | null
          fb_rel_pnr: string
          id: number
          pnr: string
          rel_avr_datum: string | null
          rel_avr_orsak: string | null
          rel_typ: string
          status: string | null
          updated_by: string | null
          updated_time: string | null
          vard_datum: string | null
          vard_slut_datum: string | null
        }
        Insert: {
          created_by?: string | null
          created_time?: string | null
          fb_rel_pnr: string
          id?: number
          pnr: string
          rel_avr_datum?: string | null
          rel_avr_orsak?: string | null
          rel_typ: string
          status?: string | null
          updated_by?: string | null
          updated_time?: string | null
          vard_datum?: string | null
          vard_slut_datum?: string | null
        }
        Update: {
          created_by?: string | null
          created_time?: string | null
          fb_rel_pnr?: string
          id?: number
          pnr?: string
          rel_avr_datum?: string | null
          rel_avr_orsak?: string | null
          rel_typ?: string
          status?: string | null
          updated_by?: string | null
          updated_time?: string | null
          vard_datum?: string | null
          vard_slut_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fb_relation_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_persons"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "fb_relation_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_person_directory"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "fb_relation_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_region_stockholm_booked"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "fb_relation_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["pnr"]
          },
        ]
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
      notification_sync: {
        Row: {
          created_by: string | null
          created_time: string | null
          id: number
          modification_time: string | null
          notification_date: string | null
          notification_type: string | null
          pnr: string
          record_id: string | null
          syncronization_time: string | null
          total_record: string | null
          updated_by: string | null
          updated_time: string | null
        }
        Insert: {
          created_by?: string | null
          created_time?: string | null
          id?: number
          modification_time?: string | null
          notification_date?: string | null
          notification_type?: string | null
          pnr: string
          record_id?: string | null
          syncronization_time?: string | null
          total_record?: string | null
          updated_by?: string | null
          updated_time?: string | null
        }
        Update: {
          created_by?: string | null
          created_time?: string | null
          id?: number
          modification_time?: string | null
          notification_date?: string | null
          notification_type?: string | null
          pnr?: string
          record_id?: string | null
          syncronization_time?: string | null
          total_record?: string | null
          updated_by?: string | null
          updated_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_sync_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_persons"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "notification_sync_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_person_directory"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "notification_sync_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "kp_v_region_stockholm_booked"
            referencedColumns: ["pnr"]
          },
          {
            foreignKeyName: "notification_sync_pnr_fkey"
            columns: ["pnr"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["pnr"]
          },
        ]
      }
      person: {
        Row: {
          antraffad_dod: string | null
          avi_namn: string | null
          avr_datum: string | null
          avr_orsak: string | null
          civ: string | null
          civ_datum: string | null
          created_by: string | null
          created_time: string | null
          distriktskod: string | null
          eff_datum: string | null
          enamn: string | null
          enamn_styrkt: string | null
          fast_beteckning: string | null
          fb_avi_postnr: string | null
          fb_avi_postort: string | null
          fb_avi_utdel_adr: string | null
          fb_co_adr: string | null
          fb_datum: string | null
          fb_postnr: string | null
          fb_postort: string | null
          fb_utdel_adr1: string | null
          fb_utdel_adr2: string | null
          fiktivt_nr: string | null
          fnamn: string | null
          fnamn_styrkt: string | null
          fod_datum: string | null
          fod_fors: string | null
          fod_lan: string | null
          fod_land: string | null
          fod_ort: string | null
          fod_ort_styrkt: string | null
          fors: string | null
          hanv_pnr: string | null
          icke_terr_fors: string | null
          identity_level: string | null
          identity_level_date: string | null
          imported_at: string
          inv_datum: string | null
          kommun: string | null
          kon: string | null
          lan: string | null
          mnamn: string | null
          mnamn_styrkt: string | null
          opt_out_pappersavisering: string | null
          pnr: string
          pnr_typ: string | null
          revision: string | null
          sekr_mark: string | null
          skyddad_fb: string | null
          sp_avi_postnr: string | null
          sp_avi_postort: string | null
          sp_avi_utdel_adr: string | null
          sp_co_adr: string | null
          sp_postnr: string | null
          sp_postort: string | null
          sp_utdel_adr1: string | null
          sp_utdel_adr2: string | null
          tilltalskod: string | null
          updated_by: string | null
          updated_time: string | null
          uppehallsratt: string | null
          utl_co_adr: string | null
          utl_datum: string | null
          utl_datum_rostratt: string | null
          utl_land: string | null
          utl_utdel_adr1: string | null
          utl_utdel_adr2: string | null
          version: string | null
        }
        Insert: {
          antraffad_dod?: string | null
          avi_namn?: string | null
          avr_datum?: string | null
          avr_orsak?: string | null
          civ?: string | null
          civ_datum?: string | null
          created_by?: string | null
          created_time?: string | null
          distriktskod?: string | null
          eff_datum?: string | null
          enamn?: string | null
          enamn_styrkt?: string | null
          fast_beteckning?: string | null
          fb_avi_postnr?: string | null
          fb_avi_postort?: string | null
          fb_avi_utdel_adr?: string | null
          fb_co_adr?: string | null
          fb_datum?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          fb_utdel_adr1?: string | null
          fb_utdel_adr2?: string | null
          fiktivt_nr?: string | null
          fnamn?: string | null
          fnamn_styrkt?: string | null
          fod_datum?: string | null
          fod_fors?: string | null
          fod_lan?: string | null
          fod_land?: string | null
          fod_ort?: string | null
          fod_ort_styrkt?: string | null
          fors?: string | null
          hanv_pnr?: string | null
          icke_terr_fors?: string | null
          identity_level?: string | null
          identity_level_date?: string | null
          imported_at?: string
          inv_datum?: string | null
          kommun?: string | null
          kon?: string | null
          lan?: string | null
          mnamn?: string | null
          mnamn_styrkt?: string | null
          opt_out_pappersavisering?: string | null
          pnr: string
          pnr_typ?: string | null
          revision?: string | null
          sekr_mark?: string | null
          skyddad_fb?: string | null
          sp_avi_postnr?: string | null
          sp_avi_postort?: string | null
          sp_avi_utdel_adr?: string | null
          sp_co_adr?: string | null
          sp_postnr?: string | null
          sp_postort?: string | null
          sp_utdel_adr1?: string | null
          sp_utdel_adr2?: string | null
          tilltalskod?: string | null
          updated_by?: string | null
          updated_time?: string | null
          uppehallsratt?: string | null
          utl_co_adr?: string | null
          utl_datum?: string | null
          utl_datum_rostratt?: string | null
          utl_land?: string | null
          utl_utdel_adr1?: string | null
          utl_utdel_adr2?: string | null
          version?: string | null
        }
        Update: {
          antraffad_dod?: string | null
          avi_namn?: string | null
          avr_datum?: string | null
          avr_orsak?: string | null
          civ?: string | null
          civ_datum?: string | null
          created_by?: string | null
          created_time?: string | null
          distriktskod?: string | null
          eff_datum?: string | null
          enamn?: string | null
          enamn_styrkt?: string | null
          fast_beteckning?: string | null
          fb_avi_postnr?: string | null
          fb_avi_postort?: string | null
          fb_avi_utdel_adr?: string | null
          fb_co_adr?: string | null
          fb_datum?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          fb_utdel_adr1?: string | null
          fb_utdel_adr2?: string | null
          fiktivt_nr?: string | null
          fnamn?: string | null
          fnamn_styrkt?: string | null
          fod_datum?: string | null
          fod_fors?: string | null
          fod_lan?: string | null
          fod_land?: string | null
          fod_ort?: string | null
          fod_ort_styrkt?: string | null
          fors?: string | null
          hanv_pnr?: string | null
          icke_terr_fors?: string | null
          identity_level?: string | null
          identity_level_date?: string | null
          imported_at?: string
          inv_datum?: string | null
          kommun?: string | null
          kon?: string | null
          lan?: string | null
          mnamn?: string | null
          mnamn_styrkt?: string | null
          opt_out_pappersavisering?: string | null
          pnr?: string
          pnr_typ?: string | null
          revision?: string | null
          sekr_mark?: string | null
          skyddad_fb?: string | null
          sp_avi_postnr?: string | null
          sp_avi_postort?: string | null
          sp_avi_utdel_adr?: string | null
          sp_co_adr?: string | null
          sp_postnr?: string | null
          sp_postort?: string | null
          sp_utdel_adr1?: string | null
          sp_utdel_adr2?: string | null
          tilltalskod?: string | null
          updated_by?: string | null
          updated_time?: string | null
          uppehallsratt?: string | null
          utl_co_adr?: string | null
          utl_datum?: string | null
          utl_datum_rostratt?: string | null
          utl_land?: string | null
          utl_utdel_adr1?: string | null
          utl_utdel_adr2?: string | null
          version?: string | null
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
        Relationships: []
      }
      kp_persons: {
        Row: {
          belongs_to_region_stockholm: boolean | null
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
          protected_identity: boolean | null
          updated_at: string | null
        }
        Insert: {
          belongs_to_region_stockholm?: never
          booked_to_region_stockholm?: never
          county?: string | null
          created_at?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: never
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          protected_identity?: never
          updated_at?: string | null
        }
        Update: {
          belongs_to_region_stockholm?: never
          booked_to_region_stockholm?: never
          county?: string | null
          created_at?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: never
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          protected_identity?: never
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
          belongs_to_region_stockholm: boolean | null
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
          protected_identity: boolean | null
        }
        Insert: {
          belongs_to_region_stockholm?: never
          booked_to_region_stockholm?: never
          county?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: never
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          protected_identity?: never
        }
        Update: {
          belongs_to_region_stockholm?: never
          booked_to_region_stockholm?: never
          county?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: never
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          protected_identity?: never
        }
        Relationships: []
      }
      kp_v_region_stockholm_booked: {
        Row: {
          belongs_to_region_stockholm: boolean | null
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
          belongs_to_region_stockholm?: never
          booked_to_region_stockholm?: never
          county?: string | null
          created_at?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: never
          last_name?: string | null
          middle_name?: string | null
          municipality?: string | null
          pnr?: string | null
          updated_at?: string | null
        }
        Update: {
          belongs_to_region_stockholm?: never
          booked_to_region_stockholm?: never
          county?: string | null
          created_at?: string | null
          fb_address1?: string | null
          fb_address2?: string | null
          fb_postnr?: string | null
          fb_postort?: string | null
          first_name?: string | null
          gender?: string | null
          hsaid?: never
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
      reset_import_tables: { Args: never; Returns: undefined }
      reset_test_data: { Args: never; Returns: Json }
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
      app_role: ["admin", "viewer"],
      booking_status: ["active", "released", "expired"],
      person_type: ["Personal", "Invånare"],
    },
  },
} as const
