import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('🔍 Supabase: Initializing client with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          name: string;
          email: string;
          phone: string;
          status: string;
          budget: number;
          move_in_date: string | null;
          reveal_date: string | null;
          style_preferences: string[];
          notes: string;
          lead_source: string;
          avatar: string | null;
          address: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          organization_id?: string | null;
          name: string;
          email: string;
          phone: string;
          status?: string;
          budget?: number;
          move_in_date?: string | null;
          reveal_date?: string | null;
          style_preferences?: string[];
          notes?: string;
          lead_source?: string;
          avatar?: string | null;
          address?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name?: string;
          email?: string;
          phone?: string;
          status?: string;
          budget?: number;
          move_in_date?: string | null;
          reveal_date?: string | null;
          style_preferences?: string[];
          notes?: string;
          lead_source?: string;
          avatar?: string | null;
          address?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          organization_id: string | null;
          name: string;
          status: string;
          item: any[];
          spent: number;
          start_date: string;
          expected_completion: string;
          description: string;
          rooms: string[];
          images: string[];
          progress: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          organization_id?: string | null;
          name: string;
          status?: string;
          budget?: number;
          spent?: number;
          start_date: string;
          expected_completion: string;
          description?: string;
          rooms?: string[];
          images?: string[];
          progress?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          organization_id?: string | null;
          name?: string;
          status?: string;
          budget?: number;
          spent?: number;
          start_date?: string;
          expected_completion?: string;
          description?: string;
          rooms?: string[];
          images?: string[];
          progress?: number;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string | null;
          client_id: string | null;
          organization_id: string | null;
          title: string;
          description: string;
          status: string;
          priority: string;
          due_date: string;
          assigned_to: string | null;
          category: string;
          visible_to_client: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          client_id?: string | null;
          organization_id?: string | null;
          title: string;
          description?: string;
          status?: string;
          priority?: string;
          due_date: string;
          assigned_to?: string | null;
          category?: string;
          visible_to_client?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          client_id?: string | null;
          organization_id?: string | null;
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          due_date?: string;
          assigned_to?: string | null;
          category?: string;
          visible_to_client?: boolean;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          project_id: string | null;
          client_id: string;
          organization_id: string | null;
          is_project_message: boolean;
          sender_id: string;
          sender_name: string;
          content: string;
          timestamp: string;
          attachments: string[];
          read: boolean;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          client_id: string;
          organization_id?: string | null;
          is_project_message?: boolean;
          sender_id: string;
          sender_name: string;
          content: string;
          timestamp?: string;
          attachments?: string[];
          read?: boolean;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          client_id?: string;
          organization_id?: string | null;
          is_project_message?: boolean;
          sender_id?: string;
          sender_name?: string;
          content?: string;
          timestamp?: string;
          attachments?: string[];
          read?: boolean;
        };
      };
      contracts: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          organization_id: string | null;
          title: string;
          type: string;
          status: string;
          file_url: string;
          file_name: string;
          created_at: string;
          sent_at: string | null;
          signed_at: string | null;
          signed_by: string | null;
          value: number | null;
          description: string;
          version: number;
        };
        Insert: {
          id?: string;
          client_id: string;
          project_id?: string | null;
          organization_id?: string | null;
          title: string;
          type?: string;
          status?: string;
          file_url?: string;
          file_name?: string;
          created_at?: string;
          sent_at?: string | null;
          signed_at?: string | null;
          signed_by?: string | null;
          value?: number | null;
          description?: string;
          version?: number;
        };
        Update: {
          id?: string;
          client_id?: string;
          project_id?: string | null;
          organization_id?: string | null;
          title?: string;
          type?: string;
          status?: string;
          file_url?: string;
          file_name?: string;
          created_at?: string;
          sent_at?: string | null;
          signed_at?: string | null;
          signed_by?: string | null;
          value?: number | null;
          description?: string;
          version?: number;
        };
      };
      expenses: {
        Row: {
          id: string;
          project_id: string | null;
          client_id: string | null;
          organization_id: string | null;
          title: string;
          description: string;
          items: any[];
          total_amount: number;
          expense_date: string;
          category: string;
          receipt_image: string | null;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          client_id?: string | null;
          organization_id?: string | null;
          title: string;
          description?: string;
          items?: any[];
          total_amount: number;
          expense_date: string;
          category?: string;
          receipt_image?: string | null;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          client_id?: string | null;
          organization_id?: string | null;
          title?: string;
          description?: string;
          items?: any[];
          total_amount?: number;
          expense_date?: string;
          category?: string;
          receipt_image?: string | null;
          notes?: string;
          created_at?: string;
        };
      };
      returns: {
        Row: {
          id: string;
          project_id: string | null;
          client_id: string | null;
          organization_id: string | null;
          item: any[];
          reason: string;
          status: string;
          amount: number | null;
          return_date: string;
          processed_date: string | null;
          images: string[];
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          client_id?: string | null;
          organization_id?: string | null;
          item: any[];
          reason: string;
          status?: string;
          amount?: number | null;
          return_date: string;
          processed_date?: string | null;
          images?: string[];
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          client_id?: string | null;
          organization_id?: string | null;
          item?: any[];
          reason?: string;
          status?: string;
          amount?: number | null;
          return_date?: string;
          processed_date?: string | null;
          images?: string[];
          notes?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: string;
          avatar: string | null;
          permissions: string[];
          client_id: string | null;
          organization_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: string;
          avatar?: string | null;
          permissions?: string[];
          client_id?: string | null;
          organization_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: string;
          avatar?: string | null;
          permissions?: string[];
          client_id?: string | null;
          organization_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}