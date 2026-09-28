import { useState, useEffect, useCallback } from 'react';
import { getAllGallery, createGalleryImage, updateGalleryImage, deleteGalleryImage } from '../../services/galleryService';
import { getAllActivities } from '../../services/activityService';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { Plus, Edit, Trash2, Search, Upload } from 'lucide-react';
import type { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';

type Gallery = Database['public']['Tables']['gallery']['Row'] & { activities?: { title: string; published: boolean } };
type GalleryInsert = Database['public']['Tables']['gallery']['Insert'];
type GalleryUpdate = Database['public']['Tables']['gallery']['Update'];
type Activity = Database['public']['Tables']['activities']['Row'];

export const AdminGallery = () => {
  const { showToast } = useToast();
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<Gallery | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<Gallery | null>(null);
  const [formData, setFormData] = useState<Partial<GalleryInsert>>({
    image_url: '',
    activity_id: null,
    caption: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [galleryResponse, activitiesResponse] = await Promise.all([
        getAllGallery(),
        getAllActivities(),
      ]);

      if (galleryResponse.error) {
        showToast('error', galleryResponse.error);
      } else {
        setGallery(galleryResponse.data || []);
      }

      if (activitiesResponse.error) {
        showToast('error', activitiesResponse.error);
      } else {
        setActivities(activitiesResponse.data || []);
      }
    } catch (error) {
      showToast('error', 'Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- Data fetching in useEffect is the correct pattern
  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredGallery = gallery.filter(item => {
    const matchesSearch = 
      (item.caption || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.activities?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActivity = activityFilter === 'all' || item.activity_id === activityFilter;

    return matchesSearch && matchesActivity;
  });

  const handleAddImage = () => {
    setEditingImage(null);
    setFormData({
      image_url: '',
      activity_id: null,
      caption: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditImage = (image: Gallery) => {
    setEditingImage(image);
    setFormData({
      image_url: image.image_url,
      activity_id: image.activity_id,
      caption: image.caption || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteImage = (image: Gallery) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    try {
      const response = await deleteGalleryImage(imageToDelete.id);
      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', 'Image deleted successfully');
        await loadData();
      }
    } catch (error) {
      showToast('error', 'Failed to delete image');
      console.error('Error deleting image:', error);
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.image_url || formData.image_url.trim().length === 0) {
      errors.image_url = 'Image URL is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = editingImage
        ? await updateGalleryImage(editingImage.id, formData as GalleryUpdate)
        : await createGalleryImage(formData as GalleryInsert);

      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', editingImage ? 'Image updated successfully' : 'Image added successfully');
        setIsModalOpen(false);
        await loadData();
      }
    } catch (error) {
      showToast('error', 'Failed to save image');
      console.error('Error saving image:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) {
        showToast('error', 'Failed to upload image');
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      showToast('success', 'Image uploaded successfully');
    } catch (error) {
      showToast('error', 'Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
        <Button onClick={handleAddImage}>
          <Plus className="w-4 h-4 mr-2" />
          Add Image
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search gallery..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Activities</option>
              {activities.map(activity => (
                <option key={activity.id} value={activity.id}>{activity.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredGallery.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGallery.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={item.image_url}
                  alt={item.caption || 'Gallery image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditImage(item)}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteImage(item)}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {item.caption && (
                  <p className="text-sm text-gray-700 mb-2">{item.caption}</p>
                )}
                {item.activities && (
                  <p className="text-xs text-gray-500">
                    Activity: {item.activities.title}
                    {!item.activities.published && (
                      <span className="ml-2 text-yellow-600">(Draft)</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          message={searchTerm || activityFilter !== 'all'
            ? 'No images match your search criteria'
            : 'No images in gallery yet. Add your first image to get started.'
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingImage ? 'Edit Image' : 'Add New Image'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
              Image *
            </label>
            <div className="space-y-2">
              {formData.image_url && (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded"
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="image_upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage || submitting}
                  className="hidden"
                />
                <label
                  htmlFor="image_upload"
                  className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                </label>
              </div>
              <Input
                placeholder="Or paste image URL..."
                value={formData.image_url || ''}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                error={formErrors.image_url}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="activity_id" className="block text-sm font-medium text-gray-700 mb-1">
              Activity (Optional)
            </label>
            <select
              id="activity_id"
              value={formData.activity_id || ''}
              onChange={(e) => setFormData({ ...formData, activity_id: e.target.value || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            >
              <option value="">No activity</option>
              {activities.map(activity => (
                <option key={activity.id} value={activity.id}>
                  {activity.title} {!activity.published && '(Draft)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <textarea
              id="caption"
              value={formData.caption || ''}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Image caption..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingImage ? 'Update Image' : 'Add Image'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};