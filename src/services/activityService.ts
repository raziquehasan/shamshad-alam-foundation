import { supabase } from '../lib/supabase';
import type { Database, ActivityCategory } from '../types/database';

type Activity = Database['public']['Tables']['activities']['Row'];
type ActivityInsert = Database['public']['Tables']['activities']['Insert'];
type ActivityUpdate = Database['public']['Tables']['activities']['Update'];

export interface ActivityServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Valid activity categories
const VALID_CATEGORIES: ActivityCategory[] = ['education', 'health', 'community', 'religious', 'other'];

// Validation helpers
const validateActivity = (activity: Partial<ActivityInsert>): string | null => {
  if (!activity.title || activity.title.trim().length === 0) {
    return 'Title is required';
  }
  if (!activity.description || activity.description.trim().length === 0) {
    return 'Description is required';
  }
  if (!activity.category || !VALID_CATEGORIES.includes(activity.category)) {
    return 'Category must be education, health, community, religious, or other';
  }
  if (!activity.activity_date) {
    return 'Activity date is required';
  }
  return null;
};

// Create a new activity
export const createActivity = async (
  activity: ActivityInsert
): Promise<ActivityServiceResponse<Activity>> => {
  try {
    const validationError = validateActivity(activity);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error creating activity:', error);
    return { data: null, error: 'Failed to create activity', loading: false };
  }
};

// Get all published activities (public-safe)
export const getPublishedActivities = async (): Promise<ActivityServiceResponse<Activity[]>> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('published', true)
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('Error fetching published activities:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching published activities:', error);
    return { data: null, error: 'Failed to fetch activities', loading: false };
  }
};

// Get all activities (admin/editor-only)
export const getAllActivities = async (): Promise<ActivityServiceResponse<Activity[]>> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('Error fetching all activities:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching all activities:', error);
    return { data: null, error: 'Failed to fetch activities', loading: false };
  }
};

// Get activity by ID (public-safe if published)
export const getActivityById = async (id: string): Promise<ActivityServiceResponse<Activity>> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching activity:', error);
      return { data: null, error: error.message, loading: false };
    }

    // For public users, only return published activities
    // This check should be enforced by RLS, but we add a client-side check
    if (data && !data.published) {
      return { data: null, error: 'Activity not found', loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching activity:', error);
    return { data: null, error: 'Failed to fetch activity', loading: false };
  }
};

// Get activities by category (public-safe for published)
export const getActivitiesByCategory = async (
  category: ActivityCategory
): Promise<ActivityServiceResponse<Activity[]>> => {
  try {
    if (!VALID_CATEGORIES.includes(category)) {
      return { data: null, error: 'Invalid category', loading: false };
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('category', category)
      .eq('published', true)
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('Error fetching activities by category:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching activities by category:', error);
    return { data: null, error: 'Failed to fetch activities by category', loading: false };
  }
};

// Update activity
export const updateActivity = async (
  id: string,
  updates: ActivityUpdate
): Promise<ActivityServiceResponse<Activity>> => {
  try {
    const validationError = validateActivity(updates);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error updating activity:', error);
    return { data: null, error: 'Failed to update activity', loading: false };
  }
};

// Publish/unpublish activity
export const toggleActivityPublish = async (
  id: string,
  published: boolean
): Promise<ActivityServiceResponse<Activity>> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update({ published })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling activity publish status:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error toggling activity publish status:', error);
    return { data: null, error: 'Failed to toggle activity publish status', loading: false };
  }
};

// Delete activity
export const deleteActivity = async (id: string): Promise<ActivityServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data: null, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error deleting activity:', error);
    return { data: null, error: 'Failed to delete activity', loading: false };
  }
};
