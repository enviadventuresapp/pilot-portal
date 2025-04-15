export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      aircraft: {
        Row: {
          created_at: string | null
          id: string
          make: string | null
          model: string | null
          registration: string | null
          tail_number: string | null
          type: string
          updated_at: string | null
          year: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          make?: string | null
          model?: string | null
          registration?: string | null
          tail_number?: string | null
          type: string
          updated_at?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          make?: string | null
          model?: string | null
          registration?: string | null
          tail_number?: string | null
          type?: string
          updated_at?: string | null
          year?: string | null
        }
        Relationships: []
      }
      flights: {
        Row: {
          aircraft_id: string | null
          arrival_location: string | null
          arrival_time: string | null
          category: string | null
          created_at: string | null
          date: string | null
          departure_location: string | null
          departure_time: string | null
          flight_time: unknown | null
          flight_type: string | null
          fuel_added: string | null
          hobbs_time: string | null
          id: string
          notes: string | null
          oil_added: string | null
          passenger_count: string | null
          pilot_id: string | null
          route: string | null
          squawks: string | null
          tach_end: string | null
          tach_start: string | null
          updated_at: string | null
        }
        Insert: {
          aircraft_id?: string | null
          arrival_location?: string | null
          arrival_time?: string | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          departure_location?: string | null
          departure_time?: string | null
          flight_time?: unknown | null
          flight_type?: string | null
          fuel_added?: string | null
          hobbs_time?: string | null
          id?: string
          notes?: string | null
          oil_added?: string | null
          passenger_count?: string | null
          pilot_id?: string | null
          route?: string | null
          squawks?: string | null
          tach_end?: string | null
          tach_start?: string | null
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string | null
          arrival_location?: string | null
          arrival_time?: string | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          departure_location?: string | null
          departure_time?: string | null
          flight_time?: unknown | null
          flight_type?: string | null
          fuel_added?: string | null
          hobbs_time?: string | null
          id?: string
          notes?: string | null
          oil_added?: string | null
          passenger_count?: string | null
          pilot_id?: string | null
          route?: string | null
          squawks?: string | null
          tach_end?: string | null
          tach_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flights_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flights_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: false
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          aircraft_id: string | null
          created_at: string | null
          date_performed: string | null
          description: string | null
          id: string
          items: Json | null
          last_fifty_hour: string | null
          last_hundred_hour: string | null
          maintenance_type: string
          next_due_date: string | null
          updated_at: string | null
        }
        Insert: {
          aircraft_id?: string | null
          created_at?: string | null
          date_performed?: string | null
          description?: string | null
          id?: string
          items?: Json | null
          last_fifty_hour?: string | null
          last_hundred_hour?: string | null
          maintenance_type: string
          next_due_date?: string | null
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string | null
          created_at?: string | null
          date_performed?: string | null
          description?: string | null
          id?: string
          items?: Json | null
          last_fifty_hour?: string | null
          last_hundred_hour?: string | null
          maintenance_type?: string
          next_due_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          interval: number
          last_done: number | null
          maintenance_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          interval: number
          last_done?: number | null
          maintenance_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          interval?: number
          last_done?: number | null
          maintenance_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pilots: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean | null
          is_hidden: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          is_hidden?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          is_hidden?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          pilot_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean | null
          pilot_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          pilot_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      RLS: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      route_target_times: {
        Row: {
          aircraft_id: string | null
          created_at: string
          id: string
          month: number | null
          pilot_id: string | null
          route: string
          target_time: number
          updated_at: string
          year: number | null
        }
        Insert: {
          aircraft_id?: string | null
          created_at?: string
          id?: string
          month?: number | null
          pilot_id?: string | null
          route: string
          target_time: number
          updated_at?: string
          year?: number | null
        }
        Update: {
          aircraft_id?: string | null
          created_at?: string
          id?: string
          month?: number | null
          pilot_id?: string | null
          route?: string
          target_time?: number
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      safety_reports: {
        Row: {
          actions: string | null
          admin_review: Json | null
          aircraft_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          location: string | null
          report_content: string
          report_date: string
          reported_by: string
          reporter_id: string
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          actions?: string | null
          admin_review?: Json | null
          aircraft_id?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          location?: string | null
          report_content?: string
          report_date: string
          reported_by?: string
          reporter_id: string
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          actions?: string | null
          admin_review?: Json | null
          aircraft_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          report_content?: string
          report_date?: string
          reported_by?: string
          reporter_id?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rpc_functions_exist: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_user_admin_status: {
        Args: { p_user_id: string; p_email: string }
        Returns: boolean
      }
      create_flight: {
        Args: { p_flight_data: Json }
        Returns: Json[]
      }
      create_pilot_safely: {
        Args: { pilot_name: string; pilot_email: string; pilot_user_id: string }
        Returns: string
      }
      delete_flight: {
        Args: { p_flight_id: string }
        Returns: boolean
      }
      fix_admin_access: {
        Args: { p_email: string; p_user_id: string }
        Returns: boolean
      }
      get_all_aircraft: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_all_flights: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_all_pilots: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_flight_by_id: {
        Args: { p_flight_id: string }
        Returns: Json[]
      }
      get_flights_by_aircraft: {
        Args: { p_aircraft_id: string }
        Returns: Json[]
      }
      get_most_recent_flight: {
        Args: { p_aircraft_id: string }
        Returns: Json[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      setup_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_flight: {
        Args: { p_flight_id: string; p_flight_data: Json }
        Returns: Json[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
