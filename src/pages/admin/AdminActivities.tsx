import { useState, useEffect, useCallback } from 'react';
import { getAllActivities, createActivity, updateActivity, deleteActivity, toggleActivityPublish } from '../../services/activityService';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Plus, Edit, Trash2, Search, Calendar, Upload, Eye, EyeOff, FileText } from 'lucide-react';
import type { Database, ActivityCategory } from '../../types/database';
import { supabase } from '../../lib/supabase';

type Activity = Database['public']['Tables']['activities']['Row'];
type ActivityInsert = Database['public']['Tables']['activities']['Insert'];
type ActivityUpdate = Database['public']['Tables']['activities']['Update'];

export const AdminActivities = () => {
  const { showToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<Partial<ActivityInsert>>({
    title: '',
    description: '',
    category: 'other',
    activity_date: '',
    cover_image_url: null,
    published: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categories: ActivityCategory[] = ['education', 'health', 'community', 'religious', 'other'];

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllActivities();
      if (response.error) {
        showToast('error', response.error);
      } else {
        setActivities(response.data || []);
      }
    } catch (error) {
      showToast('error', 'Failed to load activities');
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- Data fetching in useEffect is the correct pattern
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    const matchesPublished = publishedFilter === 'all' || 
      (publishedFilter === 'published' && activity.published) ||
      (publishedFilter === 'unpublished' && !activity.published);

    return matchesSearch && matchesCategory && matchesPublished;
  });

  const handleAddActivity = () => {
    setEditingActivity(null);
    setFormData({
      title: '',
      description: '',
      category: 'other',
      activity_date: new Date().toISOString().split('T')[0],
      cover_image_url: null,
      published: false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      category: activity.category,
      activity_date: activity.activity_date,
      cover_image_url: activity.cover_image_url,
      published: activity.published,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteActivity = (activity: Activity) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;

    try {
      const response = await deleteActivity(activityToDelete.id);
      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', 'Activity deleted successfully');
        await loadActivities();
      }
    } catch (error) {
      showToast('error', 'Failed to delete activity');
      console.error('Error deleting activity:', error);
    } finally {
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  const handleTogglePublish = async (activity: Activity) => {
    try {
      const response = await toggleActivityPublish(activity.id, !activity.published);
      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', `Activity ${!activity.published ? 'published' : 'unpublished'} successfully`);
        await loadActivities();
      }
    } catch (error) {
      showToast('error', 'Failed to update publish status');
      console.error('Error updating publish status:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length === 0) {
      errors.title = 'Title is required';
    }

    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = 'Description is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.activity_date) {
      errors.activity_date = 'Activity date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = editingActivity
        ? await updateActivity(editingActivity.id, formData as ActivityUpdate)
        : await createActivity(formData as ActivityInsert);

      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', editingActivity ? 'Activity updated successfully' : 'Activity created successfully');
        setIsModalOpen(false);
        await loadActivities();
      }
    } catch (error) {
      showToast('error', 'Failed to save activity');
      console.error('Error saving activity:', error);
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
      const filePath = `activity-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('activity-covers')
        .upload(filePath, file);

      if (uploadError) {
        showToast('error', 'Failed to upload image');
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('activity-covers')
        .getPublicUrl(filePath);

      setFormData({ ...formData, cover_image_url: publicUrl });
      showToast('success', 'Image uploaded successfully');
    } catch (error) {
      showToast('error', 'Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const getCategoryColor = (category: ActivityCategory) => {
    switch (category) {
      case 'education': return 'info';
      case 'health': return 'success';
      case 'community': return 'warning';
      case 'religious': return 'default';
      case 'other': return 'secondary';
      default: return 'default';
    }
  };

  const columns = [
    {
      header: 'Cover',
      accessor: (activity: Activity) => (
        activity.cover_image_url ? (
          <img
            src={activity.cover_image_url}
            alt={activity.title}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
        )
      ),
    },
    {
      header: 'Title',
      accessor: (activity: Activity) => (
        <div>
          <div className="font-medium text-gray-900">{activity.title}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">{activity.description}</div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (activity: Activity) => (
        <Badge variant={getCategoryColor(activity.category)}>
          {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessor: (activity: Activity) => new Date(activity.activity_date).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: (activity: Activity) => (
        <Badge variant={activity.published ? 'success' : 'secondary'}>
          {activity.published ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (activity: Activity) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleTogglePublish(activity)}
            title={activity.published ? 'Unpublish' : 'Publish'}
          >
            {activity.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditActivity(activity)}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteActivity(activity)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Activities Management</h1>
        <Button onClick={handleAddActivity}>
          <Plus className="w-4 h-4 mr-2" />
          Add Activity
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ActivityCategory | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
              ))}
            </select>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as 'all' | 'published' | 'unpublished')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      {filteredActivities.length > 0 ? (
        <Table
          columns={columns}
          data={filteredActivities}
        />
      ) : (
        <EmptyState
          message={searchTerm || categoryFilter !== 'all' || publishedFilter !== 'all'
            ? 'No activities match your search criteria'
            : 'No activities yet. Add your first activity to get started.'
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity ? 'Edit Activity' : 'Add New Activity'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={formErrors.title}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the activity..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ActivityCategory })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="activity_date" className="block text-sm font-medium text-gray-700 mb-1">
              Activity Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="activity_date"
                type="date"
                value={formData.activity_date || ''}
                onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                error={formErrors.activity_date}
                disabled={submitting}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image
            </label>
            <div className="space-y-2">
              {formData.cover_image_url && (
                <div className="relative">
                  <img
                    src={formData.cover_image_url}
                    alt="Cover preview"
                    className="w-full h-48 object-cover rounded"
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, cover_image_url: null })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="cover_image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage || submitting}
                  className="hidden"
                />
                <label
                  htmlFor="cover_image"
                  className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload Cover Image'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published || false}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              disabled={submitting}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
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
              {submitting ? 'Saving...' : editingActivity ? 'Update Activity' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Activity"
        message={`Are you sure you want to delete "${activityToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
