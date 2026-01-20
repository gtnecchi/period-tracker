export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          role: 'owner' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          role?: 'owner' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          role?: 'owner' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      cycles: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string | null
          cycle_length: number | null
          flow_level: 'light' | 'medium' | 'heavy' | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_date: string
          end_date?: string | null
          cycle_length?: number | null
          flow_level?: 'light' | 'medium' | 'heavy' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_date?: string
          end_date?: string | null
          cycle_length?: number | null
          flow_level?: 'light' | 'medium' | 'heavy' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      partnerships: {
        Row: {
          id: string
          owner_id: string
          viewer_id: string | null
          invite_token: string | null
          status: 'pending' | 'accepted' | 'revoked'
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          viewer_id?: string | null
          invite_token?: string | null
          status?: 'pending' | 'accepted' | 'revoked'
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          viewer_id?: string | null
          invite_token?: string | null
          status?: 'pending' | 'accepted' | 'revoked'
          created_at?: string
          accepted_at?: string | null
        }
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
  }
}

// 便利な型エイリアス
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Cycle = Database['public']['Tables']['cycles']['Row']
export type Partnership = Database['public']['Tables']['partnerships']['Row']

export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type InsertCycle = Database['public']['Tables']['cycles']['Insert']
export type InsertPartnership = Database['public']['Tables']['partnerships']['Insert']

export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type UpdateCycle = Database['public']['Tables']['cycles']['Update']
export type UpdatePartnership = Database['public']['Tables']['partnerships']['Update']