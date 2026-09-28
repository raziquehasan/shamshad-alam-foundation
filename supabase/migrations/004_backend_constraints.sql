-- Additional Database Constraints and Improvements
-- This migration adds data validation constraints and improves existing functionality

-- ============================================
-- EXPENSE CATEGORY CONSTRAINT
-- ============================================

-- Create expense category enum type for better validation
CREATE TYPE expense_category AS ENUM ('education', 'medical', 'other');

-- Alter expenses table to use the enum type
ALTER TABLE expenses 
  ALTER COLUMN category TYPE expense_category 
  USING category::expense_category;

-- ============================================
-- ADDITIONAL DATA VALIDATION CONSTRAINTS
-- ============================================

-- Ensure amounts are always positive
ALTER TABLE donations 
  ADD CONSTRAINT check_donation_amount_positive 
  CHECK (amount > 0);

ALTER TABLE expenses 
  ADD CONSTRAINT check_expense_amount_positive 
  CHECK (amount > 0);

ALTER TABLE beneficiaries 
  ADD CONSTRAINT check_beneficiary_amount_positive 
  CHECK (amount > 0);

-- Ensure year is within reasonable range (1980-2100)
ALTER TABLE donations 
  ADD CONSTRAINT check_donation_year_range 
  CHECK (year >= 1980 AND year <= 2100);

ALTER TABLE expenses 
  ADD CONSTRAINT check_expense_year_range 
  CHECK (year >= 1980 AND year <= 2100);

-- ============================================
-- AUTOMATIC MONTH/YEAR CONSISTENCY
-- ============================================

-- Create function to derive month/year from date
CREATE OR REPLACE FUNCTION ensure_date_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- For donations: derive month/year from donation_date if not provided or inconsistent
  IF TG_TABLE_NAME = 'donations' THEN
    IF NEW.month IS NULL OR NEW.month != EXTRACT(MONTH FROM NEW.donation_date)::INTEGER THEN
      NEW.month = EXTRACT(MONTH FROM NEW.donation_date)::INTEGER;
    END IF;
    IF NEW.year IS NULL OR NEW.year != EXTRACT(YEAR FROM NEW.donation_date)::INTEGER THEN
      NEW.year = EXTRACT(YEAR FROM NEW.donation_date)::INTEGER;
    END IF;
  END IF;

  -- For expenses: derive month/year from expense_date if not provided or inconsistent
  IF TG_TABLE_NAME = 'expenses' THEN
    IF NEW.month IS NULL OR NEW.month != EXTRACT(MONTH FROM NEW.expense_date)::INTEGER THEN
      NEW.month = EXTRACT(MONTH FROM NEW.expense_date)::INTEGER;
    END IF;
    IF NEW.year IS NULL OR NEW.year != EXTRACT(YEAR FROM NEW.expense_date)::INTEGER THEN
      NEW.year = EXTRACT(YEAR FROM NEW.expense_date)::INTEGER;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for date consistency
CREATE TRIGGER ensure_donation_date_consistency
  BEFORE INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_date_consistency();

CREATE TRIGGER ensure_expense_date_consistency
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_date_consistency();

-- ============================================
-- MEMBER STATUS DEFAULT IMPROVEMENT
-- ============================================

-- Ensure members have proper status
ALTER TABLE members 
  ALTER COLUMN status SET DEFAULT 'active';

-- ============================================
-- ACTIVITY PUBLISHED DEFAULT
-- ============================================

-- Ensure activities have proper published default
ALTER TABLE activities 
  ALTER COLUMN published SET DEFAULT false;

-- ============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================

-- Index for expenses by category
CREATE INDEX idx_expenses_category ON expenses(category);

-- Index for beneficiaries by category
CREATE INDEX idx_beneficiaries_category ON beneficiaries(category);

-- Index for activities by date
CREATE INDEX idx_activities_date ON activities(activity_date);

-- Index for members by role
CREATE INDEX idx_members_role ON members(role);

-- ============================================
-- IMPROVED RLS POLICY FOR EDITORS
-- ============================================

-- Allow editors to manage activities (not financial data)
DROP POLICY IF EXISTS "Admins can manage activities" ON activities;

CREATE POLICY "Admins can manage activities"
  ON activities FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Editors can manage activities"
  ON activities FOR ALL
  USING (is_admin_or_editor())
  WITH CHECK (is_admin_or_editor());

-- Allow editors to manage gallery (not financial data)
DROP POLICY IF EXISTS "Admins can manage gallery" ON gallery;

CREATE POLICY "Admins can manage gallery"
  ON gallery FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Editors can manage gallery"
  ON gallery FOR ALL
  USING (is_admin_or_editor())
  WITH CHECK (is_admin_or_editor());

-- ============================================
-- BENEFICIARY CATEGORY VALIDATION
-- ============================================

-- Create beneficiary category enum type
CREATE TYPE beneficiary_category AS ENUM ('education', 'medical', 'financial', 'other');

-- Alter beneficiaries table to use the enum type
ALTER TABLE beneficiaries 
  ALTER COLUMN category TYPE beneficiary_category 
  USING category::beneficiary_category;

-- ============================================
-- DONATION PAYMENT METHOD VALIDATION
-- ============================================

-- Create payment method enum type
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'upi', 'cheque', 'other');

-- Alter donations table to use the enum type
ALTER TABLE donations 
  ALTER COLUMN payment_method TYPE payment_method 
  USING payment_method::payment_method;

-- ============================================
-- ACTIVITY CATEGORY VALIDATION
-- ============================================

-- Create activity category enum type
CREATE TYPE activity_category AS ENUM ('education', 'health', 'community', 'religious', 'other');

-- Alter activities table to use the enum type
ALTER TABLE activities 
  ALTER COLUMN category TYPE activity_category 
  USING category::activity_category;
