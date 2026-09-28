import { useState, useEffect } from 'react';
import { 
  getMonthlyFinancialSummary,
  getYearlyFinancialReport, 
  getMonthlyDonationTrend, 
  getMonthlyExpenseTrend, 
  getExpenseCategorySummary,
  getMemberContributionStatus,
  getCurrentYear,
  getCurrentMonth
} from '../../services/financialService';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Calendar, TrendingUp, FileText, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export const AdminReports = () => {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  
  // Monthly data
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [monthlyCategoryBreakdown, setMonthlyCategoryBreakdown] = useState<any[]>([]);
  
  // Yearly data
  const [yearlyReport, setYearlyReport] = useState<any[]>([]);
  const [yearlyDonationTrend, setYearlyDonationTrend] = useState<any[]>([]);
  const [yearlyExpenseTrend, setYearlyExpenseTrend] = useState<any[]>([]);
  
  // Member contribution status
  const [memberContributionStatus, setMemberContributionStatus] = useState<any[]>([]);

  const years = Array.from({ length: 10 }, (_, i) => getCurrentYear() - i);
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

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        if (reportType === 'monthly') {
          const [summaryData, categoryData, memberData] = await Promise.all([
            getMonthlyFinancialSummary(selectedYear, selectedMonth),
            getExpenseCategorySummary(selectedYear, selectedMonth),
            getMemberContributionStatus(selectedYear, selectedMonth),
          ]);

          setMonthlySummary(summaryData.data);
          
          if (categoryData.data) {
            setMonthlyCategoryBreakdown([
              { name: 'Education', value: categoryData.data.education || 0, color: '#3b82f6' },
              { name: 'Medical', value: categoryData.data.medical || 0, color: '#10b981' },
              { name: 'Other', value: categoryData.data.other || 0, color: '#f59e0b' },
            ]);
          }
          
          setMemberContributionStatus(memberData.data || []);
        } else {
          const [yearlyData, donationTrendData, expenseTrendData] = await Promise.all([
            getYearlyFinancialReport(selectedYear),
            getMonthlyDonationTrend(selectedYear),
            getMonthlyExpenseTrend(selectedYear),
          ]);

          setYearlyReport(yearlyData.data || []);
          setYearlyDonationTrend(donationTrendData.data || []);
          setYearlyExpenseTrend(expenseTrendData.data || []);
        }
      } catch (error) {
        console.error('Error loading report data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [selectedYear, selectedMonth, reportType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
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
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {reportType === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <Button
              variant={reportType === 'monthly' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setReportType('monthly')}
            >
              Monthly Report
            </Button>
            <Button
              variant={reportType === 'yearly' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setReportType('yearly')}
            >
              Yearly Report
            </Button>
          </div>
        </div>
      </div>

      {reportType === 'monthly' ? (
        <div className="space-y-6">
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Donations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {monthlySummary ? formatCurrency(monthlySummary.total_donations) : '₹0'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {monthlySummary ? formatCurrency(monthlySummary.total_expenses) : '₹0'}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Balance</p>
                  <p className={`text-2xl font-bold ${monthlySummary?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlySummary ? formatCurrency(monthlySummary.balance) : '₹0'}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full ${monthlySummary?.balance >= 0 ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${monthlySummary?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlySummary?.balance >= 0 ? '+' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Category Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Category Breakdown</h3>
            {monthlyCategoryBreakdown.some(c => c.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={monthlyCategoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {monthlyCategoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No expense data available for this period" />
            )}
          </div>

          {/* Member Contribution Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Contribution Status</h3>
            {memberContributionStatus.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {memberContributionStatus.map((member) => (
                      <tr key={member.member_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.member_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
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
        </div>
      ) : (
        <div className="space-y-6">
          {/* Yearly Summary Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Financial Report - {selectedYear}</h3>
            {yearlyReport.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donations</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medical</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {yearlyReport.map((row) => (
                      <tr key={row.month}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.month_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.donations)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.expenses)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(row.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.education_expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.medical_expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.other_expenses)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No yearly data available for this period" />
            )}
          </div>

          {/* Yearly Donation Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Donation Trend</h3>
            {yearlyDonationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyDonationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month_name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="total_donations" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No donation trend data available" />
            )}
          </div>

          {/* Yearly Expense Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expense Trend</h3>
            {yearlyExpenseTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyExpenseTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month_name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="total_expenses" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No expense trend data available" />
            )}
          </div>

          {/* Yearly Balance Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Balance Trend</h3>
            {yearlyReport.length > 0 && yearlyReport.some(r => r.balance !== 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yearlyReport}>
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
              <EmptyState message="No balance data available" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
