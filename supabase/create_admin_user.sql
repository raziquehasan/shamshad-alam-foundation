-- ============================================
-- ADMIN USER CREATION SCRIPT
-- ============================================
-- 
-- IMPORTANT: Before running this script, you must create the user
-- in Supabase Auth first via the Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user" 
-- 3. Enter email: admin@example.com
-- 4. Set a password
-- 5. Click "Create user"
--
-- Then run this script to assign admin role

-- Replace 'admin@example.com' with your actual admin email
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'admin@example.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Admin User',
  updated_at = NOW();

-- Verify the admin user was created
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role = 'admin';
