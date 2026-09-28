-- RPC Functions for Financial Aggregation and Backend Operations
-- These functions provide secure, aggregated data access without exposing individual records

-- ============================================
-- PUBLIC FINANCIAL SUMMARY FUNCTIONS
-- ============================================

-- Get monthly financial summary (public-safe)
CREATE OR REPLACE FUNCTION get_monthly_financial_summary(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  total_donations DECIMAL,
  total_expenses DECIMAL,
  balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(d.amount), 0) as total_donations,
    COALESCE(SUM(e.amount), 0) as total_expenses,
    COALESCE(SUM(d.amount), 0) - COALESCE(SUM(e.amount), 0) as balance
  FROM (
    SELECT COALESCE(SUM(amount), 0) as amount
    FROM donations
    WHERE year = p_year AND month = p_month
  ) d
  CROSS JOIN (
    SELECT COALESCE(SUM(amount), 0) as amount
    FROM expenses
    WHERE year = p_year AND month = p_month
  ) e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get expense category summary (public-safe)
CREATE OR REPLACE FUNCTION get_expense_category_summary(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  education DECIMAL,
  medical DECIMAL,
  other DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN category = 'education' THEN amount ELSE 0 END), 0) as education,
    COALESCE(SUM(CASE WHEN category = 'medical' THEN amount ELSE 0 END), 0) as medical,
    COALESCE(SUM(CASE WHEN category = 'other' THEN amount ELSE 0 END), 0) as other
  FROM expenses
  WHERE year = p_year AND month = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get monthly donation trend (public-safe)
CREATE OR REPLACE FUNCTION get_monthly_donation_trend(p_year INTEGER)
RETURNS TABLE (
  month INTEGER,
  month_name TEXT,
  total_donations DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.month_num,
    m.month_name,
    COALESCE(SUM(d.amount), 0) as total_donations
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
  LEFT JOIN donations d ON d.month = m.month_num AND d.year = p_year
  GROUP BY m.month_num, m.month_name
  ORDER BY m.month_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get monthly expense trend (public-safe)
CREATE OR REPLACE FUNCTION get_monthly_expense_trend(p_year INTEGER)
RETURNS TABLE (
  month INTEGER,
  month_name TEXT,
  total_expenses DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.month_num,
    m.month_name,
    COALESCE(SUM(e.amount), 0) as total_expenses
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
  LEFT JOIN expenses e ON e.month = m.month_num AND e.year = p_year
  GROUP BY m.month_num, m.month_name
  ORDER BY m.month_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADMIN-ONLY FINANCIAL REPORTS
-- ============================================

-- Get member contribution status (admin-only)
CREATE OR REPLACE FUNCTION get_member_contribution_status(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  status TEXT
) AS $$
BEGIN
  -- Security check: only admins can access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized access to member contribution status';
  END IF;

  RETURN QUERY
  SELECT 
    m.id as member_id,
    m.full_name as member_name,
    CASE 
      WHEN d.id IS NOT NULL THEN 'paid'
      ELSE 'pending'
    END as status
  FROM members m
  LEFT JOIN (
    SELECT DISTINCT member_id
    FROM donations
    WHERE year = p_year AND month = p_month
  ) d ON m.id = d.member_id
  WHERE m.status = 'active'
  ORDER BY m.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get yearly financial report (admin-only)
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

  RETURN QUERY
  SELECT 
    m.month_num,
    m.month_name,
    COALESCE(SUM(d.amount), 0) as donations,
    COALESCE(SUM(e.amount), 0) as expenses,
    COALESCE(SUM(d.amount), 0) - COALESCE(SUM(e.amount), 0) as balance,
    COALESCE(SUM(CASE WHEN e.category = 'education' THEN e.amount ELSE 0 END), 0) as education_expenses,
    COALESCE(SUM(CASE WHEN e.category = 'medical' THEN e.amount ELSE 0 END), 0) as medical_expenses,
    COALESCE(SUM(CASE WHEN e.category = 'other' THEN e.amount ELSE 0 END), 0) as other_expenses
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
  LEFT JOIN donations d ON d.month = m.month_num AND d.year = p_year
  LEFT JOIN expenses e ON e.month = m.month_num AND e.year = p_year
  GROUP BY m.month_num, m.month_name
  ORDER BY m.month_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS FOR RPC FUNCTIONS
-- ============================================

-- Grant execute permissions for public functions
GRANT EXECUTE ON FUNCTION get_monthly_financial_summary TO anon;
GRANT EXECUTE ON FUNCTION get_monthly_financial_summary TO authenticated;

GRANT EXECUTE ON FUNCTION get_expense_category_summary TO anon;
GRANT EXECUTE ON FUNCTION get_expense_category_summary TO authenticated;

GRANT EXECUTE ON FUNCTION get_monthly_donation_trend TO anon;
GRANT EXECUTE ON FUNCTION get_monthly_donation_trend TO authenticated;

GRANT EXECUTE ON FUNCTION get_monthly_expense_trend TO anon;
GRANT EXECUTE ON FUNCTION get_monthly_expense_trend TO authenticated;

-- Grant execute permissions for admin-only functions (only authenticated)
GRANT EXECUTE ON FUNCTION get_member_contribution_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_yearly_financial_report TO authenticated;
