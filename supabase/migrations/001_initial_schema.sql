-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  photo_url TEXT,
  joining_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create donations table
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  donation_date DATE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  activity_date DATE NOT NULL,
  cover_image_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create gallery table
CREATE TABLE gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create beneficiaries table
CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  support_type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  support_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_donations_member_id ON donations(member_id);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_month_year ON donations(month, year);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_month_year ON expenses(month, year);
CREATE INDEX idx_activities_published ON activities(published);
CREATE INDEX idx_gallery_activity_id ON gallery(activity_id);
CREATE INDEX idx_members_status ON members(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- Create secure helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure helper function to check if user is admin or editor
CREATE OR REPLACE FUNCTION is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for profiles
-- Only authenticated users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Only authenticated users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Users cannot insert profiles (only system/triggers should create them)
CREATE POLICY "Users cannot insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (false);

-- Only admins can manage profiles
CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for members
-- Public can view active members only
CREATE POLICY "Public can view active members"
  ON members FOR SELECT
  USING (status = 'active');

-- No public INSERT on members
CREATE POLICY "No public insert on members"
  ON members FOR INSERT
  WITH CHECK (false);

-- No public UPDATE on members
CREATE POLICY "No public update on members"
  ON members FOR UPDATE
  WITH CHECK (false);

-- No public DELETE on members
CREATE POLICY "No public delete on members"
  ON members FOR DELETE
  USING (false);

-- Admins can manage all members
CREATE POLICY "Admins can manage members"
  ON members FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for donations
-- No public access to donations
CREATE POLICY "No public access to donations"
  ON donations FOR ALL
  USING (false)
  WITH CHECK (false);

-- Only admins can access donation records
CREATE POLICY "Admins can view donations"
  ON donations FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage donations"
  ON donations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for expenses
-- No public access to expenses
CREATE POLICY "No public access to expenses"
  ON expenses FOR ALL
  USING (false)
  WITH CHECK (false);

-- Only admins can access expense records
CREATE POLICY "Admins can view expenses"
  ON expenses FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage expenses"
  ON expenses FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for activities
-- Public can view published activities
CREATE POLICY "Public can view published activities"
  ON activities FOR SELECT
  USING (published = true);

-- No public INSERT on activities
CREATE POLICY "No public insert on activities"
  ON activities FOR INSERT
  WITH CHECK (false);

-- No public UPDATE on activities
CREATE POLICY "No public update on activities"
  ON activities FOR UPDATE
  WITH CHECK (false);

-- No public DELETE on activities
CREATE POLICY "No public delete on activities"
  ON activities FOR DELETE
  USING (false);

-- Admins can manage all activities
CREATE POLICY "Admins can manage activities"
  ON activities FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for gallery
-- Public can view gallery images for published activities
CREATE POLICY "Public can view gallery"
  ON gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = gallery.activity_id
      AND activities.published = true
    )
  );

-- No public INSERT on gallery
CREATE POLICY "No public insert on gallery"
  ON gallery FOR INSERT
  WITH CHECK (false);

-- No public UPDATE on gallery
CREATE POLICY "No public update on gallery"
  ON gallery FOR UPDATE
  WITH CHECK (false);

-- No public DELETE on gallery
CREATE POLICY "No public delete on gallery"
  ON gallery FOR DELETE
  USING (false);

-- Admins can manage gallery
CREATE POLICY "Admins can manage gallery"
  ON gallery FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for beneficiaries
-- No public access to beneficiaries
CREATE POLICY "No public access to beneficiaries"
  ON beneficiaries FOR ALL
  USING (false)
  WITH CHECK (false);

-- Only admins can access beneficiary records
CREATE POLICY "Admins can view beneficiaries"
  ON beneficiaries FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage beneficiaries"
  ON beneficiaries FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'editor' -- Default role for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage buckets setup
-- Note: These buckets need to be created manually in Supabase Dashboard or via Supabase CLI
-- Bucket names: foundation-images, member-photos, activity-images, receipts

-- Storage policies for foundation-images (public read, admin write)
-- Run these after creating buckets in Supabase Dashboard:

-- Public can read foundation-images
-- CREATE POLICY "Public can read foundation-images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'foundation-images');

-- Admins can upload to foundation-images
-- CREATE POLICY "Admins can upload foundation-images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'foundation-images' AND
--     is_admin()
--   );

-- Admins can delete foundation-images
-- CREATE POLICY "Admins can delete foundation-images"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'foundation-images' AND
--     is_admin()
--   );

-- Storage policies for member-photos (public read for active members, admin write)
-- Public can read member-photos (linked to active members)
-- CREATE POLICY "Public can read member-photos"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'member-photos' AND
--     EXISTS (
--       SELECT 1 FROM members
--       WHERE members.photo_url = storage.name
--       AND members.status = 'active'
--     )
--   );

-- Admins can manage member-photos
-- CREATE POLICY "Admins can manage member-photos"
--   ON storage.objects FOR ALL
--   USING (
--     bucket_id = 'member-photos' AND
--     is_admin()
--   )
--   WITH CHECK (
--     bucket_id = 'member-photos' AND
--     is_admin()
--   );

-- Storage policies for activity-images (public read for published activities, admin write)
-- Public can read activity-images (linked to published activities)
-- CREATE POLICY "Public can read activity-images"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'activity-images' AND
--     EXISTS (
--       SELECT 1 FROM activities
--       WHERE activities.cover_image_url = storage.name
--       AND activities.published = true
--     )
--   );

-- Admins can manage activity-images
-- CREATE POLICY "Admins can manage activity-images"
--   ON storage.objects FOR ALL
--   USING (
--     bucket_id = 'activity-images' AND
--     is_admin()
--   )
--   WITH CHECK (
--     bucket_id = 'activity-images' AND
--     is_admin()
--   );

-- Storage policies for receipts (PRIVATE - admin only)
-- Only admins can read receipts
-- CREATE POLICY "Admins can read receipts"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'receipts' AND
--     is_admin()
--   );

-- Only admins can upload receipts
-- CREATE POLICY "Admins can upload receipts"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'receipts' AND
--     is_admin()
--   );

-- Only admins can delete receipts
-- CREATE POLICY "Admins can delete receipts"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'receipts' AND
--     is_admin()
--   );
