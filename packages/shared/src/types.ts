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
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
      }
      documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_number: string | null
          document_type: string
          file_url: string | null
          id: string
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_number?: string | null
          document_type: string
          file_url?: string | null
          id?: string
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_number?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          status?: string | null
          title?: string
        }
      }
      meeting_participants: {
        Row: {
          meeting_id: string
          user_id: string
        }
        Insert: {
          meeting_id: string
          user_id: string
        }
        Update: {
          meeting_id?: string
          user_id?: string
        }
      }
      meetings: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          room: string
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          room: string
          start_time: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          room?: string
          start_time?: string
          title?: string
        }
      }
      news: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          title?: string
        }
      }
      payslips: {
        Row: {
          allowances: number | null
          base_salary: number | null
          created_at: string | null
          deductions: number | null
          id: string
          is_published: boolean | null
          month: number
          net_salary: number | null
          user_id: string
          year: number
        }
        Insert: {
          allowances?: number | null
          base_salary?: number | null
          created_at?: string | null
          deductions?: number | null
          id?: string
          is_published?: boolean | null
          month: number
          net_salary?: number | null
          user_id: string
          year: number
        }
        Update: {
          allowances?: number | null
          base_salary?: number | null
          created_at?: string | null
          deductions?: number | null
          id?: string
          is_published?: boolean | null
          month?: number
          net_salary?: number | null
          user_id?: string
          year?: number
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department_id: string | null
          full_name: string
          id: string
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department_id?: string | null
          full_name: string
          id: string
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department_id?: string | null
          full_name?: string
          id?: string
          role?: string | null
        }
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          title: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title?: string
        }
      }
      vehicle_requests: {
        Row: {
          approver_id: string | null
          created_at: string | null
          departure_time: string
          destination: string
          id: string
          reason: string | null
          return_time: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          approver_id?: string | null
          created_at?: string | null
          departure_time: string
          destination: string
          id?: string
          reason?: string | null
          return_time?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          approver_id?: string | null
          created_at?: string | null
          departure_time?: string
          destination?: string
          id?: string
          reason?: string | null
          return_time?: string | null
          status?: string | null
          user_id?: string | null
        }
      }
    }
  }
}
