import { useState, useEffect, useCallback } from 'react';
import { getAllMembers, createMember, updateMember, deleteMember } from '../../services/memberService';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Plus, Edit, Trash2, Search, User, UserCheck, UserX, Upload, X } from 'lucide-react';
import type { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];

export const AdminMembers = () => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Partial<MemberInsert>>({
    full_name: '',
    role: '',
    photo_url: null,
    joining_date: '',
    status: 'active',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllMembers();
      if (response.error) {
        showToast('error', response.error);
      } else {
        setMembers(response.data || []);
      }
    } catch (error) {
      showToast('error', 'Failed to load members');
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- Data fetching in useEffect is the correct pattern
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddMember = () => {
    setEditingMember(null);
    setFormData({
      full_name: '',
      role: '',
      photo_url: null,
      joining_date: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      role: member.role,
      photo_url: member.photo_url,
      joining_date: member.joining_date,
      status: member.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      const response = await deleteMember(memberToDelete.id);
      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', 'Member deleted successfully');
        await loadMembers();
      }
    } catch (error) {
      showToast('error', 'Failed to delete member');
      console.error('Error deleting member:', error);
    } finally {
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.full_name || formData.full_name.trim().length === 0) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.role || formData.role.trim().length === 0) {
      errors.role = 'Role is required';
    }

    if (!formData.joining_date) {
      errors.joining_date = 'Joining date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = editingMember
        ? await updateMember(editingMember.id, formData as MemberUpdate)
        : await createMember(formData as MemberInsert);

      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', editingMember ? 'Member updated successfully' : 'Member created successfully');
        setIsModalOpen(false);
        await loadMembers();
      }
    } catch (error) {
      showToast('error', 'Failed to save member');
      console.error('Error saving member:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: Member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await updateMember(member.id, { status: newStatus });
      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', `Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        await loadMembers();
      }
    } catch (error) {
      showToast('error', 'Failed to update member status');
      console.error('Error updating member status:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `member-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, file);

      if (uploadError) {
        showToast('error', 'Failed to upload photo');
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: publicUrl });
      showToast('success', 'Photo uploaded successfully');
    } catch (error) {
      showToast('error', 'Failed to upload photo');
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: (member: Member) => (
        <div className="flex items-center space-x-3">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{member.full_name}</div>
            <div className="text-sm text-gray-500">{member.role}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (member: Member) => member.role,
    },
    {
      header: 'Joining Date',
      accessor: (member: Member) => new Date(member.joining_date).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: (member: Member) => (
        <Badge
          variant={member.status === 'active' ? 'success' : 'secondary'}
        >
          {member.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (member: Member) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleToggleStatus(member)}
            title={member.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            {member.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditMember(member)}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteMember(member)}
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
        <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>
        <Button onClick={handleAddMember}>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </div>
        </div>
      </div>

      {/* Members Table */}
      {filteredMembers.length > 0 ? (
        <Table
          columns={columns}
          data={filteredMembers}
        />
      ) : (
        <EmptyState
          message={searchTerm || statusFilter !== 'all' 
            ? 'No members match your search criteria' 
            : 'No members yet. Add your first member to get started.'}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Member' : 'Add New Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <Input
              id="full_name"
              value={formData.full_name || ''}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              error={formErrors.full_name}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <Input
              id="role"
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., President, Treasurer, Member"
              error={formErrors.role}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="joining_date" className="block text-sm font-medium text-gray-700 mb-1">
              Joining Date *
            </label>
            <Input
              id="joining_date"
              type="date"
              value={formData.joining_date || ''}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              error={formErrors.joining_date}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="photo_url" className="block text-sm font-medium text-gray-700 mb-1">
              Photo
            </label>
            <div className="space-y-2">
              {formData.photo_url && (
                <div className="relative">
                  <img
                    src={formData.photo_url}
                    alt="Photo preview"
                    className="w-24 h-24 object-cover rounded-full"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photo_url: null })}
                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="photo_upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto || submitting}
                  className="hidden"
                />
                <label
                  htmlFor="photo_upload"
                  className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                </label>
              </div>
              <Input
                placeholder="Or paste photo URL..."
                value={formData.photo_url || ''}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                disabled={submitting}
              />
            </div>
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
              {submitting ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Member"
        message={`Are you sure you want to delete ${memberToDelete?.full_name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
