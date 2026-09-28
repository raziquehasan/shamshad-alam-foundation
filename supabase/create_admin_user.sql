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

-- STEP 1: First, check if the user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- STEP 2: If the above query returns a user ID, run this to assign admin role
-- Replace 'admin@example.com' with your actual admin email from step 1
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with the actual UUID from step 1
  'admin@example.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Admin User',
  updated_at = NOW();

-- STEP 3: Verify the admin user was created
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role = 'admin';
