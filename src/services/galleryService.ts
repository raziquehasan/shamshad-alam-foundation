import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Gallery = Database['public']['Tables']['gallery']['Row'];
type GalleryInsert = Database['public']['Tables']['gallery']['Insert'];
type GalleryUpdate = Database['public']['Tables']['gallery']['Update'];

export interface GalleryServiceResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Validation helpers
const validateGallery = (gallery: Partial<GalleryInsert>): string | null => {
  if (!gallery.image_url || gallery.image_url.trim().length === 0) {
    return 'Image URL is required';
  }
  return null;
};

// Create a new gallery image
export const createGalleryImage = async (
  gallery: GalleryInsert
): Promise<GalleryServiceResponse<Gallery>> => {
  try {
    const validationError = validateGallery(gallery);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    // Verify activity exists if activity_id is provided
    if (gallery.activity_id) {
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .select('id')
        .eq('id', gallery.activity_id)
        .single();

      if (activityError || !activity) {
        return { data: null, error: 'Invalid activity ID', loading: false };
      }
    }

    const { data, error } = await supabase
      .from('gallery')
      .insert(gallery)
      .select()
      .single();

    if (error) {
      console.error('Error creating gallery image:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error creating gallery image:', error);
    return { data: null, error: 'Failed to create gallery image', loading: false };
  }
};

// Get public gallery (images from published activities only)
export const getPublicGallery = async (): Promise<GalleryServiceResponse<Gallery[]>> => {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select(`
        *,
        activities (
          id,
          title,
          published
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public gallery:', error);
      return { data: null, error: error.message, loading: false };
    }

    // Filter to only show images from published activities
    // This filtering is handled by RLS, but we add client-side filtering as well
    const publicImages = data?.filter(item => 
      item.activities && item.activities.published
    ) || [];

    return { data: publicImages, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching public gallery:', error);
    return { data: null, error: 'Failed to fetch gallery', loading: false };
  }
};

// Get gallery by activity (public-safe for published activities)
export const getGalleryByActivity = async (
  activityId: string
): Promise<GalleryServiceResponse<Gallery[]>> => {
  try {
    // First check if the activity is published
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, published')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return { data: null, error: 'Activity not found', loading: false };
    }

    // For public users, only allow gallery access for published activities
    if (!activity.published) {
      return { data: null, error: 'Activity not found', loading: false };
    }

    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery by activity:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching gallery by activity:', error);
    return { data: null, error: 'Failed to fetch gallery by activity', loading: false };
  }
};

// Get all gallery images (admin/editor-only)
export const getAllGallery = async (): Promise<GalleryServiceResponse<Gallery[]>> => {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select(`
        *,
        activities (
          id,
          title,
          published
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all gallery images:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching all gallery images:', error);
    return { data: null, error: 'Failed to fetch gallery images', loading: false };
  }
};

// Get gallery image by ID
export const getGalleryImageById = async (id: string): Promise<GalleryServiceResponse<Gallery>> => {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select(`
        *,
        activities (
          id,
          title,
          published
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching gallery image:', error);
      return { data: null, error: error.message, loading: false };
    }

    // For public users, only return images from published activities
    if (data && data.activities && !data.activities.published) {
      return { data: null, error: 'Image not found', loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error fetching gallery image:', error);
    return { data: null, error: 'Failed to fetch gallery image', loading: false };
  }
};

// Update gallery image
export const updateGalleryImage = async (
  id: string,
  updates: GalleryUpdate
): Promise<GalleryServiceResponse<Gallery>> => {
  try {
    const validationError = validateGallery(updates);
    if (validationError) {
      return { data: null, error: validationError, loading: false };
    }

    // Verify activity exists if activity_id is being updated
    if (updates.activity_id) {
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .select('id')
        .eq('id', updates.activity_id)
        .single();

      if (activityError || !activity) {
        return { data: null, error: 'Invalid activity ID', loading: false };
      }
    }

    const { data, error } = await supabase
      .from('gallery')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating gallery image:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error updating gallery image:', error);
    return { data: null, error: 'Failed to update gallery image', loading: false };
  }
};

// Delete gallery image
export const deleteGalleryImage = async (id: string): Promise<GalleryServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting gallery image:', error);
      return { data: null, error: error.message, loading: false };
    }

    return { data: null, error: null, loading: false };
  } catch (error) {
    console.error('Unexpected error deleting gallery image:', error);
    return { data: null, error: 'Failed to delete gallery image', loading: false };
  }
};
