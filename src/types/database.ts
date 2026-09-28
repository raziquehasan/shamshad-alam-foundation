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
          email: string
          full_name: string | null
          role: 'admin' | 'editor' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'editor' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'editor' | null
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          full_name: string
          role: string
          photo_url: string | null
          joining_date: string
          status: 'active' | 'inactive' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          role: string
          photo_url?: string | null
          joining_date: string
          status?: 'active' | 'inactive' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          photo_url?: string | null
          joining_date?: string
          status?: 'active' | 'inactive' | null
          created_at?: string
          updated_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          member_id: string | null
          amount: number
          donation_date: string
          month: number
          year: number
          payment_method: PaymentMethod
          reference: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id?: string | null
          amount: number
          donation_date: string
          month: number
          year: number
          payment_method: PaymentMethod
          reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string | null
          amount?: number
          donation_date?: string
          month?: number
          year?: number
          payment_method?: PaymentMethod
          reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          category: ExpenseCategory
          amount: number
          expense_date: string
          month: number
          year: number
          description: string
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: ExpenseCategory
          amount: number
          expense_date: string
          month: number
          year: number
          description: string
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: ExpenseCategory
          amount?: number
          expense_date?: string
          month?: number
          year?: number
          description?: string
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          title: string
          description: string
          category: ActivityCategory
          activity_date: string
          cover_image_url: string | null
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: ActivityCategory
          activity_date: string
          cover_image_url?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: ActivityCategory
          activity_date?: string
          cover_image_url?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      gallery: {
        Row: {
          id: string
          activity_id: string | null
          image_url: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          activity_id?: string | null
          image_url: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string | null
          image_url?: string
          caption?: string | null
          created_at?: string
        }
      }
      beneficiaries: {
        Row: {
          id: string
          category: BeneficiaryCategory
          support_type: string
          amount: number
          support_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: BeneficiaryCategory
          support_type: string
          amount: number
          support_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: BeneficiaryCategory
          support_type?: string
          amount?: number
          support_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
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

// ============================================
// RPC Function Return Types
// ============================================

export interface MonthlyFinancialSummary {
  total_donations: number;
  total_expenses: number;
  balance: number;
}

export interface ExpenseCategorySummary {
  education: number;
  medical: number;
  other: number;
}

export interface MonthlyDonationTrend {
  month: number;
  month_name: string;
  total_donations: number;
}

export interface MonthlyExpenseTrend {
  month: number;
  month_name: string;
  total_expenses: number;
}

export interface MemberContributionStatus {
  member_id: string;
  member_name: string;
  status: 'paid' | 'pending';
}

export interface YearlyFinancialReport {
  month: number;
  month_name: string;
  donations: number;
  expenses: number;
  balance: number;
  education_expenses: number;
  medical_expenses: number;
  other_expenses: number;
}

// ============================================
// Service Response Types
// ============================================

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// ============================================
// Enum Types
// ============================================

export type ExpenseCategory = 'education' | 'medical' | 'other';
export type BeneficiaryCategory = 'education' | 'medical' | 'financial' | 'other';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';
export type ActivityCategory = 'education' | 'health' | 'community' | 'religious' | 'other';
export type MemberStatus = 'active' | 'inactive';
export type UserRole = 'admin' | 'editor';

// ============================================
// Public-Safe Types
// ============================================

export interface PublicMember {
  id: string;
  full_name: string;
  role: string;
  photo_url: string | null;
  joining_date: string;
  status: MemberStatus | null;
}
