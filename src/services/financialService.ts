import { supabase } from '../lib/supabase';

export interface FinancialServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// ============================================
// PUBLIC-SAFE FINANCIAL FUNCTIONS
// ============================================

// Get monthly financial summary (public-safe)
export const getMonthlyFinancialSummary = async (
  year: number,
  month: number
): Promise<FinancialServiceResponse<{
  total_donations: number;
  total_expenses: number;
  balance: number;
}>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_monthly_financial_summary', {
        p_year: year,
        p_month: month
      });

    if (error) {
      console.error('Error fetching monthly financial summary:', error);
      return { data: null, error: error.message, loading: false };
    }

    // Handle single row result
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
    
    return { data: result, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching monthly financial summary:', error);
    return { data: null, error: 'Failed to fetch financial summary', loading: false };
  }
};

// Get expense category summary (public-safe)
export const getExpenseCategorySummary = async (
  year: number,
  month: number
): Promise<FinancialServiceResponse<{
  education: number;
  medical: number;
  other: number;
}>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_expense_category_summary', {
        p_year: year,
        p_month: month
      });

    if (error) {
      console.error('Error fetching expense category summary:', error);
      return { data: null, error: error.message, loading: false };
    }

    // Handle single row result
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
    
    return { data: result, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching expense category summary:', error);
    return { data: null, error: 'Failed to fetch expense category summary', loading: false };
  }
};

// Get monthly donation trend (public-safe)
export const getMonthlyDonationTrend = async (
  year: number
): Promise<FinancialServiceResponse<Array<{
  month: number;
  month_name: string;
  total_donations: number;
}>>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_monthly_donation_trend', {
        p_year: year
      });

    if (error) {
      console.error('Error fetching monthly donation trend:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching monthly donation trend:', error);
    return { data: null, error: 'Failed to fetch donation trend', loading: false };
  }
};

// Get monthly expense trend (public-safe)
export const getMonthlyExpenseTrend = async (
  year: number
): Promise<FinancialServiceResponse<Array<{
  month: number;
  month_name: string;
  total_expenses: number;
}>>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_monthly_expense_trend', {
        p_year: year
      });

    if (error) {
      console.error('Error fetching monthly expense trend:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching monthly expense trend:', error);
    return { data: null, error: 'Failed to fetch expense trend', loading: false };
  }
};

// ============================================
// ADMIN-ONLY FINANCIAL FUNCTIONS
// ============================================

// Get member contribution status (admin-only)
export const getMemberContributionStatus = async (
  year: number,
  month: number
): Promise<FinancialServiceResponse<Array<{
  member_id: string;
  member_name: string;
  status: string;
}>>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_member_contribution_status', {
        p_year: year,
        p_month: month
      });

    if (error) {
      console.error('Error fetching member contribution status:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching member contribution status:', error);
    return { data: null, error: 'Failed to fetch member contribution status', loading: false };
  }
};

// Get yearly financial report (admin-only)
export const getYearlyFinancialReport = async (
  year: number
): Promise<FinancialServiceResponse<Array<{
  month: number;
  month_name: string;
  donations: number;
  expenses: number;
  balance: number;
  education_expenses: number;
  medical_expenses: number;
  other_expenses: number;
}>>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_yearly_financial_report', {
        p_year: year
      });

    if (error) {
      console.error('Error fetching yearly financial report:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching yearly financial report:', error);
    return { data: null, error: 'Failed to fetch yearly financial report', loading: false };
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Validate year parameter
export const validateYear = (year: number): boolean => {
  return year >= 1980 && year <= 2100;
};

// Validate month parameter
export const validateMonth = (month: number): boolean => {
  return month >= 1 && month <= 12;
};

// Get current year
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

// Get current month
export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1; // getMonth() returns 0-11
};
