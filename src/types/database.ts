export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          member_id: string;
          role: 'member' | 'admin';
          pending: boolean;
          bio: string;
          avatar_url: string | null;
          qr_token_hash: string;
          created_at: string;
          last_login: string | null;
          failed_login_attempts: number;
          locked_until: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          member_id: string;
          role?: 'member' | 'admin';
          pending?: boolean;
          bio?: string;
          avatar_url?: string | null;
          qr_token_hash: string;
          created_at?: string;
          last_login?: string | null;
          failed_login_attempts?: number;
          locked_until?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          member_id?: string;
          role?: 'member' | 'admin';
          pending?: boolean;
          bio?: string;
          avatar_url?: string | null;
          qr_token_hash?: string;
          created_at?: string;
          last_login?: string | null;
          failed_login_attempts?: number;
          locked_until?: string | null;
        };
      };
      attendance: {
        Row: {
          id: number;
          user_id: string;
          attended_on: string;
          scanned_by: string | null;
          scanned_at: string;
        };
        Insert: {
          user_id: string;
          attended_on?: string;
          scanned_by?: string | null;
          scanned_at?: string;
        };
        Update: {
          user_id?: string;
          attended_on?: string;
          scanned_by?: string | null;
          scanned_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: number;
          admin_id: string | null;
          action: string;
          target_user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          admin_id?: string | null;
          action: string;
          target_user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          admin_id?: string | null;
          action?: string;
          target_user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      member_ids: {
        Row: {
          id: string;
          code: string;
          member_id: string;
          status: 'unused' | 'used' | 'revoked' | 'reserved';
          created_by: string | null;
          created_at: string;
          used_by: string | null;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          member_id: string;
          status?: 'unused' | 'used' | 'revoked' | 'reserved';
          created_by?: string | null;
          created_at?: string;
          used_by?: string | null;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          member_id?: string;
          status?: 'unused' | 'used' | 'revoked' | 'reserved';
          created_by?: string | null;
          created_at?: string;
          used_by?: string | null;
          used_at?: string | null;
        };
      };
      login_otps: {
        Row: {
          id: string;
          user_id: string;
          code_hash: string;
          expires_at: string;
          attempts: number;
          max_attempts: number;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_hash: string;
          expires_at: string;
          attempts?: number;
          max_attempts?: number;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code_hash?: string;
          expires_at?: string;
          attempts?: number;
          max_attempts?: number;
          used?: boolean;
          created_at?: string;
        };
      };
      password_resets: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_hash: string;
          expires_at: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_hash?: string;
          expires_at?: string;
          used?: boolean;
          created_at?: string;
        };
      };
      otp_verified_sessions: {
        Row: {
          id: string;
          user_id: string;
          otp_id: string;
          verified_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          otp_id: string;
          verified_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          otp_id?: string;
          verified_at?: string;
          expires_at?: string;
        };
      };
      contact_requests: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          message: string;
          status: 'open' | 'replied' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          message: string;
          status?: 'open' | 'replied' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          message?: string;
          status?: 'open' | 'replied' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_replies: {
        Row: {
          id: string;
          request_id: string;
          admin_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          admin_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          admin_id?: string;
          message?: string;
          created_at?: string;
        };
      };
      competitions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          location: string | null;
          date_from: string | null;
          date_to: string | null;
          status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          result: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          location?: string | null;
          date_from?: string | null;
          date_to?: string | null;
          status?: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          result?: string | null;
          url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          location?: string | null;
          date_from?: string | null;
          date_to?: string | null;
          status?: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          result?: string | null;
          url?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          end_time: string | null;
          location: string | null;
          type: 'meeting' | 'build_session' | 'competition' | 'social' | 'other';
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          type?: 'meeting' | 'build_session' | 'competition' | 'social' | 'other';
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          type?: 'meeting' | 'build_session' | 'competition' | 'social' | 'other';
          created_by?: string | null;
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          pinned: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          name: string;
          category: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
        };
      };
      member_skills: {
        Row: {
          user_id: string;
          skill_id: string;
          proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        };
        Insert: {
          user_id: string;
          skill_id: string;
          proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        };
        Update: {
          user_id?: string;
          skill_id?: string;
          proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        };
      };
      documents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          file_name: string;
          file_url: string;
          file_size: number | null;
          mime_type: string | null;
          uploaded_by: string | null;
          category: 'general' | 'budget' | 'technical' | 'competition' | 'meeting_notes';
          visible_to: 'members' | 'admin';
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          file_name: string;
          file_url: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          category?: 'general' | 'budget' | 'technical' | 'competition' | 'meeting_notes';
          visible_to?: 'members' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          file_name?: string;
          file_url?: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          category?: 'general' | 'budget' | 'technical' | 'competition' | 'meeting_notes';
          visible_to?: 'members' | 'admin';
          created_at?: string;
        };
      };
      team_roles: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      signup_requests: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role_name: string;
          member_id: string;
          invite_code_id: string | null;
          status: 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          role_name: string;
          member_id: string;
          invite_code_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role_name?: string;
          member_id?: string;
          invite_code_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
