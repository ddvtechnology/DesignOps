import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          date?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone: string
          notes: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string
          notes?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          client_id: string
          title: string
          description: string
          value: number
          status: 'in_progress' | 'completed' | 'cancelled'
          deadline: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          title: string
          description: string
          value: number
          status: 'in_progress' | 'completed' | 'cancelled'
          deadline: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          title?: string
          description?: string
          value?: number
          status?: 'in_progress' | 'completed' | 'cancelled'
          deadline?: string
          created_at?: string
        }
      }
      scheduled_transactions: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          scheduled_date: string
          status: 'scheduled' | 'paid' | 'overdue'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          scheduled_date: string
          status: 'scheduled' | 'paid' | 'overdue'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          scheduled_date?: string
          status?: 'scheduled' | 'paid' | 'overdue'
          created_at?: string
        }
      }
    }
  }
}