import { useState, useEffect, useMemo, useCallback } from 'react';
import { getDonations, createDonation, updateDonation, deleteDonation } from '../../services/donationService';
import { getAllMembers } from '../../services/memberService';
import { getMemberContributionStatus } from '../../services/financialService';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Plus, Edit, Trash2, Search, Calendar, DollarSign, Users } from 'lucide-react';
import type { Database, PaymentMethod } from '../../types/database';

type Donation = Database['public']['Tables']['donations']['Row'] & { members?: { full_name: string } };
type DonationInsert = Database['public']['Tables']['donations']['Insert'];
type DonationUpdate = Database['public']['Tables']['donations']['Update'];
type Member = Database['public']['Tables']['members']['Row'];

export const AdminDonations = () => {
  const { showToast } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Date is called intentionally to get current year on component mount
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [yearFilter, setYearFilter] = useState<number | 'all'>(currentYear);
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState<Donation | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Date is called intentionally to get current date for default form values
  const defaultFormData = useMemo(() => ({
    amount: 0,
    donation_date: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: currentYear,
    payment_method: 'cash' as PaymentMethod,
    reference: '',
    notes: '',
    member_id: null,
  }), [currentYear]);
  const [formData, setFormData] = useState<Partial<DonationInsert>>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showContributionStatus, setShowContributionStatus] = useState(false);
  const [contributionStatus, setContributionStatus] = useState<Array<{ member_id: string; member_name: string; status: string }>>([]);
  const [loadingContributionStatus, setLoadingContributionStatus] = useState(false);

  const years = useMemo(() => Array.from({ length: 10 }, (_, i) => currentYear - i), [currentYear]);
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Date is called intentionally to get current month name
  const currentMonthName = useMemo(() => new Date(currentYear, new Date().getMonth()).toLocaleString('default', { month: 'long' }), [currentYear]);
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

  const paymentMethods: PaymentMethod[] = ['cash', 'bank_transfer', 'upi', 'cheque', 'other'];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [donationsResponse, membersResponse] = await Promise.all([
        getDonations(),
        getAllMembers(),
      ]);

      if (donationsResponse.error) {
        showToast('error', donationsResponse.error);
      } else {
        setDonations(donationsResponse.data || []);
      }

      if (membersResponse.error) {
        showToast('error', membersResponse.error);
      } else {
        setMembers(membersResponse.data || []);
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

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = 
      (donation.members?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = yearFilter === 'all' || donation.year === Number(yearFilter);
    const matchesMonth = monthFilter === 'all' || donation.month === Number(monthFilter);
    const matchesMember = memberFilter === 'all' || donation.member_id === memberFilter;

    return matchesSearch && matchesYear && matchesMonth && matchesMember;
  });

  const handleAddDonation = () => {
    setEditingDonation(null);
    setFormData({
      amount: 0,
      donation_date: new Date().toISOString().split('T')[0],
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      payment_method: 'cash',
      reference: '',
      notes: '',
      member_id: null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditDonation = (donation: Donation) => {
    setEditingDonation(donation);
    setFormData({
      amount: donation.amount,
      donation_date: donation.donation_date,
      month: donation.month,
      year: donation.year,
      payment_method: donation.payment_method,
      reference: donation.reference || '',
      notes: donation.notes || '',
      member_id: donation.member_id,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteDonation = (donation: Donation) => {
    setDonationToDelete(donation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!donationToDelete) return;

    try {
      const response = await deleteDonation(donationToDelete.id);
      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', 'Donation deleted successfully');
        await loadData();
      }
    } catch (error) {
      showToast('error', 'Failed to delete donation');
      console.error('Error deleting donation:', error);
    } finally {
      setDeleteDialogOpen(false);
      setDonationToDelete(null);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.donation_date) {
      errors.donation_date = 'Donation date is required';
    }

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      errors.month = 'Invalid month';
    }

    if (!formData.year || formData.year < 1980 || formData.year > 2100) {
      errors.year = 'Invalid year';
    }

    if (!formData.payment_method) {
      errors.payment_method = 'Payment method is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = editingDonation
        ? await updateDonation(editingDonation.id, formData as DonationUpdate)
        : await createDonation(formData as DonationInsert);

      if (response.error) {
        showToast('error', response.error);
      } else {
        showToast('success', editingDonation ? 'Donation updated successfully' : 'Donation created successfully');
        setIsModalOpen(false);
        await loadData();
      }
    } catch (error) {
      showToast('error', 'Failed to save donation');
      console.error('Error saving donation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (date: string) => {
    const dateObj = new Date(date);
    setFormData({
      ...formData,
      donation_date: date,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
    });
  };

  const handleShowContributionStatus = async () => {
    setLoadingContributionStatus(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      
      const response = await getMemberContributionStatus(currentYear, currentMonth);
      if (response.error) {
        showToast('error', response.error);
      } else {
        setContributionStatus(response.data || []);
        setShowContributionStatus(true);
      }
    } catch (error) {
      showToast('error', 'Failed to load contribution status');
      console.error('Error loading contribution status:', error);
    } finally {
      setLoadingContributionStatus(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      header: 'Member',
      accessor: (donation: Donation) => donation.members?.full_name || 'Anonymous',
    },
    {
      header: 'Amount',
      accessor: (donation: Donation) => formatCurrency(donation.amount),
    },
    {
      header: 'Date',
      accessor: (donation: Donation) => new Date(donation.donation_date).toLocaleDateString(),
    },
    {
      header: 'Month/Year',
      accessor: (donation: Donation) => {
        const monthName = months.find(m => m.value === donation.month)?.label || donation.month;
        return `${monthName} ${donation.year}`;
      },
    },
    {
      header: 'Payment Method',
      accessor: (donation: Donation) => (
        <span className="capitalize">{donation.payment_method.replace('_', ' ')}</span>
      ),
    },
    {
      header: 'Reference',
      accessor: (donation: Donation) => donation.reference || '-',
    },
    {
      header: 'Actions',
      accessor: (donation: Donation) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditDonation(donation)}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteDonation(donation)}
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
        <h1 className="text-2xl font-bold text-gray-900">Donations Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleShowContributionStatus} disabled={loadingContributionStatus}>
            <Users className="w-4 h-4 mr-2" />
            {loadingContributionStatus ? 'Loading...' : 'Member Contribution Status'}
          </Button>
          <Button onClick={handleAddDonation}>
            <Plus className="w-4 h-4 mr-2" />
            Add Donation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search donations..."
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
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Members</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.full_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Donations Table */}
      {filteredDonations.length > 0 ? (
        <Table
          columns={columns}
          data={filteredDonations}
        />
      ) : (
        <EmptyState
          message={searchTerm || yearFilter !== 'all' && yearFilter !== currentYear || monthFilter !== 'all' || memberFilter !== 'all'
            ? 'No donations match your search criteria'
            : 'No donations yet. Add your first donation to get started.'
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDonation ? 'Edit Donation' : 'Add New Donation'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="member_id" className="block text-sm font-medium text-gray-700 mb-1">
              Member
            </label>
            <select
              id="member_id"
              value={formData.member_id || ''}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            >
              <option value="">Anonymous</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <label htmlFor="donation_date" className="block text-sm font-medium text-gray-700 mb-1">
              Donation Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="donation_date"
                type="date"
                value={formData.donation_date || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                error={formErrors.donation_date}
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
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              id="payment_method"
              value={formData.payment_method || ''}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={submitting}
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Reference
            </label>
            <Input
              id="reference"
              value={formData.reference || ''}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Transaction reference"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
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
              {submitting ? 'Saving...' : editingDonation ? 'Update Donation' : 'Add Donation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Donation"
        message={`Are you sure you want to delete this donation of ${formatCurrency(donationToDelete?.amount || 0)}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Member Contribution Status Modal */}
      <Modal
        isOpen={showContributionStatus}
        onClose={() => setShowContributionStatus(false)}
        title="Member Contribution Status"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Showing contribution status for current month ({currentMonthName} {currentYear})
          </p>
          
          {contributionStatus.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contributionStatus.map((member) => (
                    <tr key={member.member_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.member_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={member.status === 'paid' ? 'success' : 'warning'}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No member contribution data available for this period" />
          )}
        </div>
      </Modal>
    </div>
  );
};
