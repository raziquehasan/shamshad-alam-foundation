import { supabase } from '../lib/supabase';
import type { Database, BeneficiaryCategory } from '../types/database';

type Beneficiary = Database['public']['Tables']['beneficiaries']['Row'];
type BeneficiaryInsert = Database['public']['Tables']['beneficiaries']['Insert'];
type BeneficiaryUpdate = Database['public']['Tables']['beneficiaries']['Update'];

export interface BeneficiaryServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Valid beneficiary categories
const VALID_CATEGORIES: BeneficiaryCategory[] = ['education', 'medical', 'financial', 'other'];

// Validation helpers
const validateBeneficiary = (beneficiary: Partial<BeneficiaryInsert>): string | null => {
  if (!beneficiary.category || !VALID_CATEGORIES.includes(beneficiary.category)) {
    return 'Category must be education, medical, financial, or other';
  }
  if (!beneficiary.support_type || beneficiary.support_type.trim().length === 0) {
    return 'Support type is required';
  }
  if (!beneficiary.amount || beneficiary.amount <= 0) {
    return 'Amount must be greater than 0';
  }
  if (!beneficiary.support_date) {
    return 'Support date is required';
  }
  return null;
};

// Create a new beneficiary record
export const createBeneficiary = async (
  beneficiary: BeneficiaryInsert
): Promise<BeneficiaryServiceResponse<Beneficiary>> => {
  try {
    const validationError = validateBeneficiary(beneficiary);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    const { data, error } = await supabase
      .from('beneficiaries')
      .insert(beneficiary)
      .select()
      .single();

    if (error) {
      console.error('Error creating beneficiary:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error creating beneficiary:', error);
    return { data: null, error: 'Failed to create beneficiary record', loading: false };
  }
};

// Get all beneficiaries (admin-only)
export const getBeneficiaries = async (): Promise<BeneficiaryServiceResponse<Beneficiary[]>> => {
  try {
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .order('support_date', { ascending: false });

    if (error) {
      console.error('Error fetching beneficiaries:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching beneficiaries:', error);
    return { data: null, error: 'Failed to fetch beneficiaries', loading: false };
  }
};

// Get beneficiary by ID (admin-only)
export const getBeneficiaryById = async (id: string): Promise<BeneficiaryServiceResponse<Beneficiary>> => {
  try {
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching beneficiary:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching beneficiary:', error);
    return { data: null, error: 'Failed to fetch beneficiary', loading: false };
  }
};

// Get beneficiaries by category (admin-only)
export const getBeneficiariesByCategory = async (
  category: BeneficiaryCategory
): Promise<BeneficiaryServiceResponse<Beneficiary[]>> => {
  try {
    if (!VALID_CATEGORIES.includes(category)) {
      return { data: null, error: 'Invalid category', loading: false };
    }

    const { data, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('category', category)
      .order('support_date', { ascending: false });

    if (error) {
      console.error('Error fetching beneficiaries by category:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching beneficiaries by category:', error);
    return { data: null, error: 'Failed to fetch beneficiaries by category', loading: false };
  }
};

// Get beneficiaries by date range (admin-only)
export const getBeneficiariesByDateRange = async (
  startDate: string,
  endDate: string
): Promise<BeneficiaryServiceResponse<Beneficiary[]>> => {
  try {
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .gte('support_date', startDate)
      .lte('support_date', endDate)
      .order('support_date', { ascending: false });

    if (error) {
      console.error('Error fetching beneficiaries by date range:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching beneficiaries by date range:', error);
    return { data: null, error: 'Failed to fetch beneficiaries by date range', loading: false };
  }
};

// Update beneficiary
export const updateBeneficiary = async (
  id: string,
  updates: BeneficiaryUpdate
): Promise<BeneficiaryServiceResponse<Beneficiary>> => {
  try {
    const validationError = validateBeneficiary(updates);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    const { data, error } = await supabase
      .from('beneficiaries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating beneficiary:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error updating beneficiary:', error);
    return { data: null, error: 'Failed to update beneficiary', loading: false };
  }
};

// Delete beneficiary
export const deleteBeneficiary = async (id: string): Promise<BeneficiaryServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('beneficiaries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting beneficiary:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data: null, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error deleting beneficiary:', error);
    return { data: null, error: 'Failed to delete beneficiary', loading: false };
  }
};
