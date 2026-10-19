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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          credits: number
          event_id: string
          id: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          credits: number
          event_id: string
          id?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          credits?: number
          event_id?: string
          id?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_awards: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          credits: number
          event_id: string | null
          id: string
          organiser_id: string
          place: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          credits?: number
          event_id?: string | null
          id?: string
          organiser_id: string
          place: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          credits?: number
          event_id?: string | null
          id?: string
          organiser_id?: string
          place?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_awards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_awards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_organisers: {
        Row: {
          assigned_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_organisers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_organisers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_qr: {
        Row: {
          active: boolean
          event_id: string
          token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          event_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          event_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_qr_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          secret_code: string
          ticket_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          secret_code?: string
          ticket_token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          secret_code?: string
          ticket_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          abbr: string | null
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          credits: number
          description: string
          ends_at: string | null
          id: string
          poc: string | null
          round2_ends_at: string | null
          round2_starts_at: string | null
          starts_at: string
          timing_note: string | null
          title: string
          venue: string
        }
        Insert: {
          abbr?: string | null
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          credits?: number
          description?: string
          ends_at?: string | null
          id?: string
          poc?: string | null
          round2_ends_at?: string | null
          round2_starts_at?: string | null
          starts_at: string
          timing_note?: string | null
          title: string
          venue: string
        }
        Update: {
          abbr?: string | null
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          credits?: number
          description?: string
          ends_at?: string | null
          id?: string
          poc?: string | null
          round2_ends_at?: string | null
          round2_starts_at?: string | null
          starts_at?: string
          timing_note?: string | null
          title?: string
          venue?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          contact_email: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          locked_event_id: string | null
          phone: string | null
          roll_number: string
          student_code: string
          year: string | null
        }
        Insert: {
          account_type?: string
          contact_email?: string | null
          created_at?: string
          department?: string | null
          full_name: string
          id: string
          locked_event_id?: string | null
          phone?: string | null
          roll_number: string
          student_code?: string
          year?: string | null
        }
        Update: {
          account_type?: string
          contact_email?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          locked_event_id?: string | null
          phone?: string | null
          roll_number?: string
          student_code?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_locked_event_id_fkey"
            columns: ["locked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_participants: {
        Row: {
          answers: Json | null
          prize: string | null
          rank: number | null
          score: number | null
          session_id: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          prize?: string | null
          rank?: number | null
          score?: number | null
          session_id: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          prize?: string | null
          rank?: number | null
          score?: number | null
          session_id?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          id: string
          options: Json
          position: number
          question: string
        }
        Insert: {
          correct_index: number
          id?: string
          options: Json
          position: number
          question: string
        }
        Update: {
          correct_index?: number
          id?: string
          options?: Json
          position?: number
          question?: string
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          id: string
          status: string
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          id?: string
          status?: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          event_id: string
          team_id: string
          user_id: string
        }
        Insert: {
          event_id: string
          team_id: string
          user_id: string
        }
        Update: {
          event_id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          seq: number
          team_code: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          seq: number
          team_code: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          seq?: number
          team_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      can_manage_event: { Args: { _event_id: string }; Returns: boolean }
      check_registration_ticket: {
        Args: { _token: string }
        Returns: {
          event_title: string
          full_name: string
          registered_at: string
          roll_number: string
        }[]
      }
      claim_event_credit: { Args: { _token: string }; Returns: Json }
      event_export: {
        Args: { _event_id: string }
        Returns: {
          credits: number
          department: string
          full_name: string
          present: boolean
          registered_at: string
          roll_number: string
          student_code: string
          team_code: string
        }[]
      }
      event_export_v2: {
        Args: { _event_id: string }
        Returns: {
          contact_email: string
          department: string
          full_name: string
          phone: string
          roll_number: string
          team_code: string
          year: string
        }[]
      }
      event_roster: {
        Args: { _event_id: string; _page?: number; _search?: string }
        Returns: {
          credits: number
          department: string
          full_name: string
          locked_elsewhere: string
          locked_here: boolean
          present: boolean
          registered_at: string
          registration_id: string
          roll_number: string
          secret_code: string
          total_count: number
          user_id: string
        }[]
      }
      finalize_quiz: { Args: { _session_id: string }; Returns: undefined }
      get_leaderboard: {
        Args: never
        Returns: {
          department: string
          events_count: number
          full_name: string
          non_tech: number
          roll_number: string
          tech: number
          total: number
          user_id: string
        }[]
      }
      get_participation_leaderboard: {
        Args: { _category?: string; _page?: number }
        Returns: {
          department: string
          events_count: number
          full_name: string
          non_tech: number
          rank: number
          roll_number: string
          tech: number
          total: number
          total_count: number
          user_id: string
        }[]
      }
      get_quiz_results: {
        Args: { _session_id: string }
        Returns: {
          full_name: string
          prize: string
          rank: number
          roll_number: string
          score: number
          submitted_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_event_organiser: { Args: never; Returns: boolean }
      mark_attendance_by_code: {
        Args: { _code: string; _event_id: string }
        Returns: Json
      }
      record_event_winner: {
        Args: {
          _credits: number
          _event_id: string
          _place: number
          _user_id: string
        }
        Returns: {
          amount: number
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          credits: number
          event_id: string | null
          id: string
          organiser_id: string
          place: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "event_awards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_for_event: {
        Args: { _event_id: string }
        Returns: {
          created_at: string
          event_id: string
          id: string
          secret_code: string
          ticket_token: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "event_registrations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_team: {
        Args: { _codes: string[]; _event_id: string }
        Returns: Json
      }
      registration_workbook: { Args: never; Returns: Json }
      release_student: {
        Args: { _event_id: string; _user_id: string }
        Returns: Json
      }
      remove_event_winner: { Args: { _award_id: string }; Returns: undefined }
      submit_quiz: {
        Args: { _answers: Json; _session_id: string }
        Returns: Json
      }
      verify_event_attendance: {
        Args: { _registration_id: string; _secret_code: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      event_category: "tech" | "non_tech"
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
      event_category: ["tech", "non_tech"],
    },
  },
} as const
