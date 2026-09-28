import { supabase } from '../lib/supabase';
import type { Database, PaymentMethod } from '../types/database';

type Donation = Database['public']['Tables']['donations']['Row'];
type DonationInsert = Database['public']['Tables']['donations']['Insert'];
type DonationUpdate = Database['public']['Tables']['donations']['Update'];

export interface DonationServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Validation helpers
const validateDonation = (donation: Partial<DonationInsert>): string | null => {
  if (!donation.amount || donation.amount <= 0) {
    return 'Amount must be greater than 0';
  }
  if (!donation.donation_date) {
    return 'Donation date is required';
  }
  if (!donation.month || donation.month < 1 || donation.month > 12) {
    return 'Month must be between 1 and 12';
  }
  if (!donation.year || donation.year < 1980 || donation.year > 2100) {
    return 'Year must be between 1980 and 2100';
  }
  if (!donation.payment_method) {
    return 'Payment method is required';
  }
  const validMethods: PaymentMethod[] = ['cash', 'bank_transfer', 'upi', 'cheque', 'other'];
  if (!validMethods.includes(donation.payment_method)) {
    return 'Invalid payment method';
  }
  return null;
};

// Create a new donation
export const createDonation = async (
  donation: DonationInsert
): Promise<DonationServiceResponse<Donation>> => {
  try {
    const validationError = validateDonation(donation);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    // Verify member exists if member_id is provided
    if (donation.member_id) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('id', donation.member_id)
        .single();

      if (memberError || !member) {
        return { data: null, error: 'Invalid member ID', loading: false };
      }
    }

    const { data, error } = await supabase
      .from('donations')
      .insert(donation)
      .select()
      .single();

    if (error) {
      console.error('Error creating donation:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error creating donation:', error);
    return { data: null, error: 'Failed to create donation', loading: false };
  }
};

// Get all donations (admin-only)
export const getDonations = async (): Promise<DonationServiceResponse<Donation[]>> => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        members (
          id,
          full_name
        )
      `)
      .order('donation_date', { ascending: false });

    if (error) {
      console.error('Error fetching donations:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching donations:', error);
    return { data: null, error: 'Failed to fetch donations', loading: false };
  }
};

// Get donation by ID (admin-only)
export const getDonationById = async (id: string): Promise<DonationServiceResponse<Donation>> => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        members (
          id,
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching donation:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching donation:', error);
    return { data: null, error: 'Failed to fetch donation', loading: false };
  }
};

// Get donations by member (admin-only)
export const getDonationsByMember = async (
  memberId: string
): Promise<DonationServiceResponse<Donation[]>> => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('member_id', memberId)
      .order('donation_date', { ascending: false });

    if (error) {
      console.error('Error fetching member donations:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching member donations:', error);
    return { data: null, error: 'Failed to fetch member donations', loading: false };
  }
};

// Get donations by month/year (admin-only)
export const getDonationsByMonth = async (
  year: number,
  month: number
): Promise<DonationServiceResponse<Donation[]>> => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        members (
          id,
          full_name
        )
      `)
      .eq('year', year)
      .eq('month', month)
      .order('donation_date', { ascending: false });

    if (error) {
      console.error('Error fetching monthly donations:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching monthly donations:', error);
    return { data: null, error: 'Failed to fetch monthly donations', loading: false };
  }
};

// Update donation
export const updateDonation = async (
  id: string,
  updates: DonationUpdate
): Promise<DonationServiceResponse<Donation>> => {
  try {
    const validationError = validateDonation(updates);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    // Verify member exists if member_id is being updated
    if (updates.member_id) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('id', updates.member_id)
        .single();

      if (memberError || !member) {
        return { data: null, error: 'Invalid member ID', loading: false };
      }
    }

    const { data, error } = await supabase
      .from('donations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating donation:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error updating donation:', error);
    return { data: null, error: 'Failed to update donation', loading: false };
  }
};

// Delete donation
export const deleteDonation = async (id: string): Promise<DonationServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('donations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting donation:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data: null, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error deleting donation:', error);
    return { data: null, error: 'Failed to delete donation', loading: false };
  }
};
