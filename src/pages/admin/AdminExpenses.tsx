import { useState, useEffect, useMemo, useCallback } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../services/expenseService';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Plus, Edit, Trash2, Search, Calendar, FileText, Upload, Download, Eye } from 'lucide-react';
import type { Database, ExpenseCategory } from '../../types/database';
import { supabase } from '../../lib/supabase';

type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

export const AdminExpenses = () => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Date is called intentionally to get current year on component mount
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [yearFilter, setYearFilter] = useState<number | 'all'>(currentYear);
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Date is called intentionally to get current date for default form values
  const defaultFormData = useMemo(() => ({
    category: 'other' as ExpenseCategory,
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: currentYear,
    description: '',
    receipt_url: null,
  }), [currentYear]);
  const [formData, setFormData] = useState<Partial<ExpenseInsert>>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const years = useMemo(() => Array.from({ length: 10 }, (_, i) => currentYear - i), [currentYear]);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const categories: ExpenseCategory[] = ['education', 'medical', 'other'];

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getExpenses();
      if (response.error) {
        showToast('error', response.error);
      } else {
        setExpenses(response.data || []);
      }
    } catch (error) {
      showToast('error', 'Failed to load expenses');
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- Data fetching in useEffect is the correct pattern
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = yearFilter === 'all' || expense.year === Number(yearFilter);
    const matchesMonth = monthFilter === 'all' || expense.month === Number(monthFilter);
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;

    return matchesSearch && matchesYear && matchesMonth && matchesCategory;
  });

  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
      month: expense.month,
      year: expense.year,
      description: expense.description,
      receipt_url: expense.receipt_url,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      const response = await deleteExpense(expenseToDelete.id);
      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', 'Expense deleted successfully');
        await loadExpenses();
      }
    } catch (error) {
      showToast('error', 'Failed to delete expense');
      console.error('Error deleting expense:', error);
    } finally {
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.expense_date) {
      errors.expense_date = 'Expense date is required';
    }

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      errors.month = 'Invalid month';
    }

    if (!formData.year || formData.year < 1980 || formData.year > 2100) {
      errors.year = 'Invalid year';
    }

    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = 'Description is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = editingExpense
        ? await updateExpense(editingExpense.id, formData as ExpenseUpdate)
        : await createExpense(formData as ExpenseInsert);

      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', editingExpense ? 'Expense updated successfully' : 'Expense created successfully');
        setIsModalOpen(false);
        await loadExpenses();
      }
    } catch (error) {
      showToast('error', 'Failed to save expense');
      console.error('Error saving expense:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (date: string) => {
    const dateObj = new Date(date);
    setFormData({
      ...formData,
      expense_date: date,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
    });
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) {
        showToast('error', 'Failed to upload receipt');
        console.error('Upload error:', uploadError);
        return;
      }

      // Store the file path instead of public URL for security
      // We'll generate signed URLs when viewing/downloading
      setFormData({ ...formData, receipt_url: filePath });
      showToast('success', 'Receipt uploaded successfully');
    } catch (error) {
      showToast('error', 'Failed to upload receipt');
      console.error('Error uploading receipt:', error);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleViewReceipt = async (receiptPath: string) => {
    try {
      // Generate signed URL for secure viewing
      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receiptPath, 60); // 60 seconds expiry

      if (error || !data?.signedUrl) {
        showToast('error', 'Failed to generate secure URL');
        console.error('Error generating signed URL:', error);
        return;
      }

      setViewingReceipt(data.signedUrl);
      setReceiptDialogOpen(true);
    } catch (error) {
      showToast('error', 'Failed to view receipt');
      console.error('Error viewing receipt:', error);
    }
  };

  const handleDownloadReceipt = async (receiptPath: string) => {
    try {
      // Generate signed URL for secure download
      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receiptPath, 60); // 60 seconds expiry

      if (error || !data?.signedUrl) {
        showToast('error', 'Failed to generate secure URL');
        console.error('Error generating signed URL:', error);
        return;
      }

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'receipt.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('success', 'Receipt downloaded successfully');
    } catch (error) {
      showToast('error', 'Failed to download receipt');
      console.error('Error downloading receipt:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: ExpenseCategory) => {
    switch (category) {
      case 'education': return 'success';
      case 'medical': return 'info';
      case 'other': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      header: 'Category',
      accessor: (expense: Expense) => (
        <Badge variant={getCategoryColor(expense.category)}>
          {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Amount',
      accessor: (expense: Expense) => formatCurrency(expense.amount),
    },
    {
      header: 'Date',
      accessor: (expense: Expense) => new Date(expense.expense_date).toLocaleDateString(),
    },
    {
      header: 'Month/Year',
      accessor: (expense: Expense) => {
        const monthName = months.find(m => m.value === expense.month)?.label || expense.month;
        return `${monthName} ${expense.year}`;
      },
    },
    {
      header: 'Description',
      accessor: (expense: Expense) => expense.description,
    },
    {
      header: 'Receipt',
      accessor: (expense: Expense) => (
        <div className="flex items-center space-x-2">
          {expense.receipt_url && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleViewReceipt(expense.receipt_url!)}
                title="View Receipt"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadReceipt(expense.receipt_url!)}
                title="Download Receipt"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (expense: Expense) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditExpense(expense)}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteExpense(expense)}
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
        <h1 className="text-2xl font-bold text-gray-900">Expenses Management</h1>
        <Button onClick={handleAddExpense}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Months</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
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

      {/* Expenses Table */}
      {filteredExpenses.length > 0 ? (
        <Table
          columns={columns}
          data={filteredExpenses}
        />
      ) : (
        <EmptyState
          message={searchTerm || yearFilter !== 'all' && yearFilter !== currentYear || monthFilter !== 'all' || categoryFilter !== 'all'
            ? 'No expenses match your search criteria'
            : 'No expenses yet. Add your first expense to get started.'
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700 mb-1">
              Expense Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                error={formErrors.expense_date}
                disabled={submitting}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                Month *
              </label>
              <select
                id="month"
                value={formData.month || ''}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={submitting}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                id="year"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={submitting}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Expense description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-1">
              Receipt
            </label>
            <div className="space-y-2">
              {formData.receipt_url && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600 truncate">Receipt uploaded (secure storage)</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFormData({ ...formData, receipt_url: null })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="receipt"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={uploadingReceipt || submitting}
                  className="hidden"
                />
                <label
                  htmlFor="receipt"
                  className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    uploadingReceipt ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingReceipt ? 'Uploading...' : 'Upload Receipt'}</span>
                </label>
              </div>
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
              {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense of ${formatCurrency(expenseToDelete?.amount || 0)}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Receipt View Dialog */}
      <Modal
        isOpen={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        title="Receipt"
      >
        {viewingReceipt && (
          <div className="flex justify-center">
            <img
              src={viewingReceipt}
              alt="Receipt"
              className="max-w-full max-h-96 object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
