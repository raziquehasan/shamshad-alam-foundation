import { supabase } from '../lib/supabase';
import type { Database, PublicMember } from '../types/database';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];

export interface MemberServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Validation helpers
const validateMember = (member: Partial<MemberInsert>): string | null => {
  if (!member.full_name || member.full_name.trim().length === 0) {
    return 'Full name is required';
  }
  if (!member.role || member.role.trim().length === 0) {
    return 'Role is required';
  }
  if (!member.joining_date) {
    return 'Joining date is required';
  }
  return null;
};

// Create a new member
export const createMember = async (
  member: MemberInsert
): Promise<MemberServiceResponse<Member>> => {
  try {
    const validationError = validateMember(member);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    const { data, error } = await supabase
      .from('members')
      .insert(member)
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error creating member:', error);
    return { data: null, error: 'Failed to create member', loading: false };
  }
};

// Get all active members (public-safe)
export const getActiveMembers = async (): Promise<MemberServiceResponse<PublicMember[]>> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('id, full_name, role, photo_url, joining_date, status')
      .eq('status', 'active')
      .order('full_name');

    if (error) {
      console.error('Error fetching active members:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching active members:', error);
    return { data: null, error: 'Failed to fetch members', loading: false };
  }
};

// Get all members (admin-only)
export const getAllMembers = async (): Promise<MemberServiceResponse<Member[]>> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all members:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching all members:', error);
    return { data: null, error: 'Failed to fetch members', loading: false };
  }
};

// Get member by ID
export const getMemberById = async (id: string): Promise<MemberServiceResponse<Member>> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching member:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching member:', error);
    return { data: null, error: 'Failed to fetch member', loading: false };
  }
};

// Update member
export const updateMember = async (
  id: string,
  updates: MemberUpdate
): Promise<MemberServiceResponse<Member>> => {
  try {
    const validationError = validateMember(updates);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error updating member:', error);
    return { data: null, error: 'Failed to update member', loading: false };
  }
};

// Deactivate member (soft delete)
export const deactivateMember = async (id: string): Promise<MemberServiceResponse<Member>> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating member:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error deactivating member:', error);
    return { data: null, error: 'Failed to deactivate member', loading: false };
  }
};

// Delete member (hard delete - use with caution)
export const deleteMember = async (id: string): Promise<MemberServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting member:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data: null, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error deleting member:', error);
    return { data: null, error: 'Failed to delete member', loading: false };
  }
};
