-- Fix Yearly Financial Report Aggregation Bug
-- This migration fixes the many-to-many multiplication bug in get_yearly_financial_report()

-- Bug Description:
-- The previous implementation LEFT JOINed donations and expenses directly to the monthly calendar,
-- then SUMmed both tables in the same query. This caused row multiplication:
-- Example: 3 donations × 4 expenses = 12 joined rows, inflating totals.

-- Fix:
-- Pre-aggregate donations by month FIRST
-- Pre-aggregate expenses by month FIRST
-- Pre-aggregate expense categories by month FIRST
-- Then join the already-aggregated results to the 12-month calendar

-- ============================================
-- AUDIT RESULTS OF OTHER RPC FUNCTIONS
-- ============================================

-- get_monthly_financial_summary(): ✅ SAFE
-- Uses CROSS JOIN with pre-aggregated subqueries - no multiplication bug

-- get_expense_category_summary(): ✅ SAFE
-- Only queries expenses table - no JOIN, no multiplication bug

-- get_monthly_donation_trend(): ✅ SAFE
-- LEFT JOIN only donations to calendar - single table join, no multiplication bug

-- get_monthly_expense_trend(): ✅ SAFE
-- LEFT JOIN only expenses to calendar - single table join, no multiplication bug

-- get_member_contribution_status(): ✅ SAFE
-- LEFT JOIN members to pre-aggregated donations - proper aggregation

-- CONCLUSION: Only get_yearly_financial_report() had the bug.

-- ============================================
-- FIXED YEARLY FINANCIAL REPORT (ADMIN-ONLY)
-- ============================================

CREATE OR REPLACE FUNCTION get_yearly_financial_report(p_year INTEGER)
RETURNS TABLE (
  month INTEGER,
  month_name TEXT,
  donations DECIMAL,
  expenses DECIMAL,
  balance DECIMAL,
  education_expenses DECIMAL,
  medical_expenses DECIMAL,
  other_expenses DECIMAL
) AS $$
BEGIN
  -- Security check: only admins can access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized access to yearly financial report';
  END IF;

  -- Validate year parameter
  IF p_year < 1980 OR p_year > 2100 THEN
    RAISE EXCEPTION 'Year must be between 1980 and 2100';
  END IF;

  RETURN QUERY
  SELECT 
    m.month_num,
    m.month_name,
    COALESCE(donations_agg.total_donations, 0) as donations,
    COALESCE(expenses_agg.total_expenses, 0) as expenses,
    COALESCE(donations_agg.total_donations, 0) - COALESCE(expenses_agg.total_expenses, 0) as balance,
    COALESCE(category_agg.education_expenses, 0) as education_expenses,
    COALESCE(category_agg.medical_expenses, 0) as medical_expenses,
    COALESCE(category_agg.other_expenses, 0) as other_expenses
  FROM (
    SELECT 1 as month_num, 'January' as month_name UNION
    SELECT 2, 'February' UNION
    SELECT 3, 'March' UNION
    SELECT 4, 'April' UNION
    SELECT 5, 'May' UNION
    SELECT 6, 'June' UNION
    SELECT 7, 'July' UNION
    SELECT 8, 'August' UNION
    SELECT 9, 'September' UNION
    SELECT 10, 'October' UNION
    SELECT 11, 'November' UNION
    SELECT 12, 'December'
  ) m
  LEFT JOIN (
    -- Pre-aggregate donations by month
    SELECT 
      month,
      SUM(amount) as total_donations
    FROM donations
    WHERE year = p_year
    GROUP BY month
  ) donations_agg ON donations_agg.month = m.month_num
  LEFT JOIN (
    -- Pre-aggregate expenses by month
    SELECT 
      month,
      SUM(amount) as total_expenses
    FROM expenses
    WHERE year = p_year
    GROUP BY month
  ) expenses_agg ON expenses_agg.month = m.month_num
  LEFT JOIN (
    -- Pre-aggregate expense categories by month
    SELECT 
      month,
      SUM(CASE WHEN category = 'education' THEN amount ELSE 0 END) as education_expenses,
      SUM(CASE WHEN category = 'medical' THEN amount ELSE 0 END) as medical_expenses,
      SUM(CASE WHEN category = 'other' THEN amount ELSE 0 END) as other_expenses
    FROM expenses
    WHERE year = p_year
    GROUP BY month
  ) category_agg ON category_agg.month = m.month_num
  ORDER BY m.month_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions (for safety)
GRANT EXECUTE ON FUNCTION get_yearly_financial_report TO authenticated;
