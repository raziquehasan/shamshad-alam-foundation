import { supabase } from '../lib/supabase';
import type { Database, ExpenseCategory } from '../types/database';

type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

export interface ExpenseServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Valid expense categories
const VALID_CATEGORIES: ExpenseCategory[] = ['education', 'medical', 'other'];

// Validation helpers
const validateExpense = (expense: Partial<ExpenseInsert>): string | null => {
  if (!expense.amount || expense.amount <= 0) {
    return 'Amount must be greater than 0';
  }
  if (!expense.category || !VALID_CATEGORIES.includes(expense.category)) {
    return 'Category must be education, medical, or other';
  }
  if (!expense.expense_date) {
    return 'Expense date is required';
  }
  if (!expense.month || expense.month < 1 || expense.month > 12) {
    return 'Month must be between 1 and 12';
  }
  if (!expense.year || expense.year < 1980 || expense.year > 2100) {
    return 'Year must be between 1980 and 2100';
  }
  if (!expense.description || expense.description.trim().length === 0) {
    return 'Description is required';
  }
  return null;
};

// Create a new expense
export const createExpense = async (
  expense: ExpenseInsert
): Promise<ExpenseServiceResponse<Expense>> => {
  try {
    const validationError = validateExpense(expense);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error creating expense:', error);
    return { data: null, error: 'Failed to create expense', loading: false };
  }
};

// Get all expenses (admin-only)
export const getExpenses = async (): Promise<ExpenseServiceResponse<Expense[]>> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching expenses:', error);
    return { data: null, error: 'Failed to fetch expenses', loading: false };
  }
};

// Get expense by ID (admin-only)
export const getExpenseById = async (id: string): Promise<ExpenseServiceResponse<Expense>> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching expense:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching expense:', error);
    return { data: null, error: 'Failed to fetch expense', loading: false };
  }
};

// Get expenses by category (admin-only)
export const getExpensesByCategory = async (
  category: ExpenseCategory
): Promise<ExpenseServiceResponse<Expense[]>> => {
  try {
    if (!VALID_CATEGORIES.includes(category)) {
      return { data: null, error: 'Invalid category', loading: false };
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('category', category)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses by category:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching expenses by category:', error);
    return { data: null, error: 'Failed to fetch expenses by category', loading: false };
  }
};

// Get expenses by month/year (admin-only)
export const getExpensesByMonth = async (
  year: number,
  month: number
): Promise<ExpenseServiceResponse<Expense[]>> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching monthly expenses:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching monthly expenses:', error);
    return { data: null, error: 'Failed to fetch monthly expenses', loading: false };
  }
};

// Update expense
export const updateExpense = async (
  id: string,
  updates: ExpenseUpdate
): Promise<ExpenseServiceResponse<Expense>> => {
  try {
    const validationError = validateExpense(updates);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error updating expense:', error);
    return { data: null, error: 'Failed to update expense', loading: false };
  }
};

// Delete expense
export const deleteExpense = async (id: string): Promise<ExpenseServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data: null, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error deleting expense:', error);
    return { data: null, error: 'Failed to delete expense', loading: false };
  }
};
