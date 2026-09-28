-- Stage 4 Storage Policies Update
-- This migration adds storage policies for the new Stage 4 storage architecture
-- 
-- CONTEXT:
-- - Migrations 001-005 were already applied to the database
-- - Original architecture used: foundation-images, member-photos, activity-images, receipts
-- - Stage 4 code uses: member-photos, receipts, activity-covers, gallery
-- - This migration safely adds the new buckets and policies without breaking existing data
--
-- STORAGE ARCHITECTURE MIGRATION:
-- - activity-images (old) → activity-covers (new) - Stage 4 code uses activity-covers
-- - gallery (new) - Added for Stage 4 gallery functionality
-- - member-photos, receipts (existing) - No changes needed
--
-- IMPORTANT: The old activity-images bucket is left untouched to preserve any existing data
-- The code now uses activity-covers, but activity-images data remains accessible if needed

-- ============================================
-- CREATE NEW STORAGE BUCKETS (IF NOT EXISTS)
-- ============================================

-- Create activity-covers bucket for activity cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('activity-covers', 'activity-covers', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create gallery bucket for gallery images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Ensure member-photos bucket exists (should exist from migration 002)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('member-photos', 'member-photos', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Ensure receipts bucket exists (should exist from migration 002)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('receipts', 'receipts', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR ACTIVITY-COVERS
-- ============================================

-- Public can read activity-covers (linked to published activities)
CREATE POLICY IF NOT EXISTS "Public can read activity-covers"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'activity-covers' AND
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.cover_image_url = storage.name
      AND activities.published = true
    )
  );

-- Admins can manage activity-covers
CREATE POLICY IF NOT EXISTS "Admins can manage activity-covers"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'activity-covers' AND
    is_admin()
  )
  WITH CHECK (
    bucket_id = 'activity-covers' AND
    is_admin()
  );

-- ============================================
-- STORAGE POLICIES FOR GALLERY
-- ============================================

-- Public can read gallery images
CREATE POLICY IF NOT EXISTS "Public can read gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

-- Admins can manage gallery
CREATE POLICY IF NOT EXISTS "Admins can manage gallery"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'gallery' AND
    is_admin()
  )
  WITH CHECK (
    bucket_id = 'gallery' AND
    is_admin()
  );

-- ============================================
-- ENSURE EXISTING POLICIES ARE IN PLACE
-- ============================================

-- These policies should exist from migration 002, but we ensure they're present
-- This provides idempotency and ensures the final state is correct

-- Member-photos policies
CREATE POLICY IF NOT EXISTS "Public can read member-photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-photos' AND
    EXISTS (
      SELECT 1 FROM members
      WHERE members.photo_url = storage.name
      AND members.status = 'active'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage member-photos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'member-photos' AND
    is_admin()
  )
  WITH CHECK (
    bucket_id = 'member-photos' AND
    is_admin()
  );

-- Receipts policies (PRIVATE - admin only)
CREATE POLICY IF NOT EXISTS "Admins can read receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    is_admin()
  );

CREATE POLICY IF NOT EXISTS "Admins can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND
    is_admin()
  );

CREATE POLICY IF NOT EXISTS "Admins can delete receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' AND
    is_admin()
  );

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- 
-- This migration completes the storage architecture for Stage 4:
-- 
-- BUCKETS (4 total):
-- 1. member-photos - Member profile photos (public read for active members, admin write)
-- 2. receipts - Expense receipts (PRIVATE - admin only, signed URLs)
-- 3. activity-covers - Activity cover images (public read for published activities, admin write)
-- 4. gallery - Gallery images (public read, admin write)
--
-- DEPRECATED BUT PRESERVED:
-- - activity-images - Old bucket, left untouched to preserve existing data
-- - foundation-images - Old bucket, left untouched if it exists
--
-- SECURITY VERIFICATION:
-- - Receipts remain private (bucket public: false, admin-only policies)
-- - Member photos public only for active members
-- - Activity covers public only for published activities
-- - Gallery is public (as intended for public website)
-- - All write operations require admin role
--
-- MIGRATION ORDER:
-- 001_initial_schema.sql
-- 002_storage_policies.sql (original, restored)
-- 003_backend_rpc_functions.sql
-- 004_backend_constraints.sql
-- 005_fix_yearly_financial_report.sql
-- 006_stage4_storage_policies.sql (this migration)
