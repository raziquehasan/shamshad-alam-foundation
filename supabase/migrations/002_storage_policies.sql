-- Storage Setup and Policies
-- IMPORTANT: This migration assumes buckets are already created in Supabase Dashboard
-- Buckets to create manually: foundation-images, member-photos, activity-images, receipts

-- Enable RLS on storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for foundation-images (public read, admin write)

-- Public can read foundation-images
CREATE POLICY "Public can read foundation-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'foundation-images');

-- Admins can upload to foundation-images
CREATE POLICY "Admins can upload foundation-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'foundation-images' AND
    is_admin()
  );

-- Admins can delete foundation-images
CREATE POLICY "Admins can delete foundation-images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'foundation-images' AND
    is_admin()
  );

-- Storage policies for member-photos (public read for active members, admin write)

-- Public can read member-photos (linked to active members)
CREATE POLICY "Public can read member-photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-photos' AND
    EXISTS (
      SELECT 1 FROM members
      WHERE members.photo_url = storage.name
      AND members.status = 'active'
    )
  );

-- Admins can manage member-photos
CREATE POLICY "Admins can manage member-photos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'member-photos' AND
    is_admin()
  )
  WITH CHECK (
    bucket_id = 'member-photos' AND
    is_admin()
  );

-- Storage policies for activity-images (public read for published activities, admin write)

-- Public can read activity-images (linked to published activities)
CREATE POLICY "Public can read activity-images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'activity-images' AND
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.cover_image_url = storage.name
      AND activities.published = true
    )
  );

-- Admins can manage activity-images
CREATE POLICY "Admins can manage activity-images"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'activity-images' AND
    is_admin()
  )
  WITH CHECK (
    bucket_id = 'activity-images' AND
    is_admin()
  );

-- Storage policies for receipts (PRIVATE - admin only)

-- Only admins can read receipts
CREATE POLICY "Admins can read receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    is_admin()
  );

-- Only admins can upload receipts
CREATE POLICY "Admins can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND
    is_admin()
  );

-- Only admins can delete receipts
CREATE POLICY "Admins can delete receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' AND
    is_admin()
  );

-- Prevent public access to any other storage
CREATE POLICY "No public access to other storage"
  ON storage.objects FOR ALL
  USING (false)
  WITH CHECK (false);
