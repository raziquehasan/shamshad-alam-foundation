import { useState, useEffect, useCallback } from 'react';
import { getBeneficiaries, createBeneficiary, updateBeneficiary, deleteBeneficiary } from '../../services/beneficiaryService';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Plus, Edit, Trash2, Search, Calendar, Heart } from 'lucide-react';
import type { Database, BeneficiaryCategory } from '../../types/database';

type Beneficiary = Database['public']['Tables']['beneficiaries']['Row'];
type BeneficiaryInsert = Database['public']['Tables']['beneficiaries']['Insert'];
type BeneficiaryUpdate = Database['public']['Tables']['beneficiaries']['Update'];

export const AdminBeneficiaries = () => {
  const { showToast } = useToast();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BeneficiaryCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [beneficiaryToDelete, setBeneficiaryToDelete] = useState<Beneficiary | null>(null);
  const [formData, setFormData] = useState<Partial<BeneficiaryInsert>>({
    category: 'other',
    support_type: '',
    amount: 0,
    support_date: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const categories: BeneficiaryCategory[] = ['education', 'medical', 'financial', 'other'];

  const loadBeneficiaries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getBeneficiaries();
      if (response.error) {
        showToast('error', response.error);
      } else {
        setBeneficiaries(response.data || []);
      }
    } catch (error) {
      showToast('error', 'Failed to load beneficiaries');
      console.error('Error loading beneficiaries:', error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- Data fetching in useEffect is the correct pattern
  useEffect(() => {
    loadBeneficiaries();
  }, [loadBeneficiaries]);

  const filteredBeneficiaries = beneficiaries.filter(beneficiary => {
    const matchesSearch = 
      beneficiary.support_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (beneficiary.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || beneficiary.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleAddBeneficiary = () => {
    setEditingBeneficiary(null);
    setFormData({
      category: 'other',
      support_type: '',
      amount: 0,
      support_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setFormData({
      category: beneficiary.category,
      support_type: beneficiary.support_type,
      amount: beneficiary.amount,
      support_date: beneficiary.support_date,
      notes: beneficiary.notes || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteBeneficiary = (beneficiary: Beneficiary) => {
    setBeneficiaryToDelete(beneficiary);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!beneficiaryToDelete) return;

    try {
      const response = await deleteBeneficiary(beneficiaryToDelete.id);
      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', 'Beneficiary record deleted successfully');
        await loadBeneficiaries();
      }
    } catch (error) {
      showToast('error', 'Failed to delete beneficiary record');
      console.error('Error deleting beneficiary:', error);
    } finally {
      setDeleteDialogOpen(false);
      setBeneficiaryToDelete(null);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.support_type || formData.support_type.trim().length === 0) {
      errors.support_type = 'Support type is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.support_date) {
      errors.support_date = 'Support date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = editingBeneficiary
        ? await updateBeneficiary(editingBeneficiary.id, formData as BeneficiaryUpdate)
        : await createBeneficiary(formData as BeneficiaryInsert);

      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', editingBeneficiary ? 'Beneficiary updated successfully' : 'Beneficiary created successfully');
        setIsModalOpen(false);
        await loadBeneficiaries();
      }
    } catch (error) {
      showToast('error', 'Failed to save beneficiary record');
      console.error('Error saving beneficiary:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: BeneficiaryCategory) => {
    switch (category) {
      case 'education': return 'info';
      case 'medical': return 'success';
      case 'financial': return 'warning';
      case 'other': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      header: 'Category',
      accessor: (beneficiary: Beneficiary) => (
        <Badge variant={getCategoryColor(beneficiary.category)}>
          {beneficiary.category.charAt(0).toUpperCase() + beneficiary.category.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Support Type',
      accessor: (beneficiary: Beneficiary) => beneficiary.support_type,
    },
    {
      header: 'Amount',
      accessor: (beneficiary: Beneficiary) => formatCurrency(beneficiary.amount),
    },
    {
      header: 'Support Date',
      accessor: (beneficiary: Beneficiary) => new Date(beneficiary.support_date).toLocaleDateString(),
    },
    {
      header: 'Notes',
      accessor: (beneficiary: Beneficiary) => beneficiary.notes || '-',
    },
    {
      header: 'Actions',
      accessor: (beneficiary: Beneficiary) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditBeneficiary(beneficiary)}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteBeneficiary(beneficiary)}
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
        <h1 className="text-2xl font-bold text-gray-900">Beneficiaries Management</h1>
        <Button onClick={handleAddBeneficiary}>
          <Plus className="w-4 h-4 mr-2" />
          Add Beneficiary
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search beneficiaries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as BeneficiaryCategory | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Beneficiaries Table */}
      {filteredBeneficiaries.length > 0 ? (
        <Table
          columns={columns}
          data={filteredBeneficiaries}
        />
      ) : (
        <EmptyState
          message={searchTerm || categoryFilter !== 'all'
            ? 'No beneficiaries match your search criteria'
            : 'No beneficiaries yet. Add your first beneficiary record to get started.'
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBeneficiary ? 'Edit Beneficiary' : 'Add New Beneficiary'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as BeneficiaryCategory })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="support_type" className="block text-sm font-medium text-gray-700 mb-1">
              Support Type *
            </label>
            <Input
              id="support_type"
              value={formData.support_type || ''}
              onChange={(e) => setFormData({ ...formData, support_type: e.target.value })}
              placeholder="e.g., School Fees, Medical Treatment"
              error={formErrors.support_type}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="amount"
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                error={formErrors.amount}
                disabled={submitting}
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label htmlFor="support_date" className="block text-sm font-medium text-gray-700 mb-1">
              Support Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="support_date"
                type="date"
                value={formData.support_date || ''}
                onChange={(e) => setFormData({ ...formData, support_date: e.target.value })}
                error={formErrors.support_date}
                disabled={submitting}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the support provided"
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
              {submitting ? 'Saving...' : editingBeneficiary ? 'Update Beneficiary' : 'Add Beneficiary'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Beneficiary Record"
        message={`Are you sure you want to delete this beneficiary record? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};