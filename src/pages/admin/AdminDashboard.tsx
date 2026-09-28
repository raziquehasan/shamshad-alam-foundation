import { useState, useEffect } from 'react';
import { getAllMembers } from '../../services/memberService';
import { getDonations } from '../../services/donationService';
import { getExpenses } from '../../services/expenseService';
import { getMonthlyDonationTrend, getMonthlyExpenseTrend, getExpenseCategorySummary, getCurrentYear, getCurrentMonth } from '../../services/financialService';
import { StatCard } from '../../components/StatCard';
import { EmptyState } from '../../components/EmptyState';
import { Users, DollarSign, FileText, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  currentMonthDonations: number;
  currentMonthExpenses: number;
  currentMonthBalance: number;
}

interface MonthlyTrendData {
  month: number;
  month_name: string;
  total_donations?: number;
  total_expenses?: number;
}

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    currentMonthDonations: 0,
    currentMonthExpenses: 0,
    currentMonthBalance: 0,
  });
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [donationTrend, setDonationTrend] = useState<any[]>([]);
  const [expenseTrend, setExpenseTrend] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [balanceTrend, setBalanceTrend] = useState<any[]>([]);

  const years = Array.from({ length: 5 }, (_, i) => getCurrentYear() - i);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const currentYear = getCurrentYear();
        const currentMonth = getCurrentMonth();

        // Load members
        const membersResponse = await getAllMembers();
        const members = membersResponse.data || [];
        
        // Load donations
        const donationsResponse = await getDonations();
        const donations = donationsResponse.data || [];
        
        // Load expenses
        const expensesResponse = await getExpenses();
        const expenses = expensesResponse.data || [];

        // Calculate current month donations
        const currentMonthDonations = donations
          .filter(d => d.year === currentYear && d.month === currentMonth)
          .reduce((sum, d) => sum + d.amount, 0);

        // Calculate current month expenses
        const currentMonthExpenses = expenses
          .filter(e => e.year === currentYear && e.month === currentMonth)
          .reduce((sum, e) => sum + e.amount, 0);

        // Calculate stats
        setStats({
          totalMembers: members.length,
          activeMembers: members.filter(m => m.status === 'active').length,
          currentMonthDonations,
          currentMonthExpenses,
          currentMonthBalance: currentMonthDonations - currentMonthExpenses,
        });

        // Load charts data
        const [donationTrendData, expenseTrendData, categoryData] = await Promise.all([
          getMonthlyDonationTrend(selectedYear),
          getMonthlyExpenseTrend(selectedYear),
          getExpenseCategorySummary(currentYear, currentMonth),
        ]);

        setDonationTrend(donationTrendData.data || []);
        setExpenseTrend(expenseTrendData.data || []);
        
        if (categoryData.data) {
          setCategoryBreakdown([
            { name: 'Education', value: categoryData.data.education || 0, color: '#3b82f6' },
            { name: 'Medical', value: categoryData.data.medical || 0, color: '#10b981' },
            { name: 'Other', value: categoryData.data.other || 0, color: '#f59e0b' },
          ]);
        }

        // Calculate balance trend
        const balanceData = [];
        for (let month = 1; month <= 12; month++) {
          const monthDonations = donationTrendData.data?.find((d: MonthlyTrendData) => d.month === month)?.total_donations || 0;
          const monthExpenses = expenseTrendData.data?.find((e: MonthlyTrendData) => e.month === month)?.total_expenses || 0;
          balanceData.push({
            month,
            month_name: new Date(selectedYear, month - 1).toLocaleString('default', { month: 'short' }),
            balance: monthDonations - monthExpenses,
          });
        }
        setBalanceTrend(balanceData);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Current Month Donations"
          value={formatCurrency(stats.currentMonthDonations)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Current Month Expenses"
          value={formatCurrency(stats.currentMonthExpenses)}
          icon={<FileText className="w-6 h-6" />}
          color="red"
        />
      </div>

      {/* Balance Card */}
      <div className="mb-8">
        <StatCard
          title="Current Month Balance"
          value={formatCurrency(stats.currentMonthBalance)}
          icon={<TrendingUp className="w-6 h-6" />}
          color={stats.currentMonthBalance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Donations Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Donations</h3>
          {donationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={donationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="total_donations" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No donation data available for this period" />
          )}
        </div>

        {/* Monthly Expenses Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenses</h3>
          {expenseTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="total_expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No expense data available for this period" />
          )}
        </div>

        {/* Expense Categories Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
          {categoryBreakdown.some(c => c.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No expense category data available" />
          )}
        </div>

        {/* Monthly Balance Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Balance</h3>
          {balanceTrend.some(b => b.balance !== 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={balanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No balance data available for this period" />
          )}
        </div>
      </div>
    </div>
  );
};
