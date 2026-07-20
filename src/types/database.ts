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
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          admin_id?: string | null;
          action: string;
          target_user_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          admin_id?: string | null;
          action?: string;
          target_user_id?: string | null;
          metadata?: Json | null;
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
