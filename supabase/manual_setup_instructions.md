# Supabase Manual Setup Instructions

## Step 1: Create Storage Buckets Manually

Since automatic bucket creation in SQL can be complex, create buckets manually in Supabase Dashboard:

1. Go to **Storage** in Supabase Dashboard
2. Click **"New bucket"** for each bucket:

### Bucket 1: member-photos
- **Name:** `member-photos`
- **Public:** No (uncheck "Make bucket public")
- **File size limit:** 2MB (2097152 bytes)
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

### Bucket 2: receipts
- **Name:** `receipts`
- **Public:** No (uncheck "Make bucket public")
- **File size limit:** 5MB (5242880 bytes)
- **Allowed MIME types:** `image/jpeg`, `image/png`, `application/pdf`

### Bucket 3: activity-covers
- **Name:** `activity-covers`
- **Public:** No (uncheck "Make bucket public")
- **File size limit:** 5MB (5242880 bytes)
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

### Bucket 4: gallery
- **Name:** `gallery`
- **Public:** Yes (check "Make bucket public")
- **File size limit:** 10MB (10485760 bytes)
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

## Step 2: Configure Storage Policies via Dashboard

Since SQL-based policy creation is encountering issues, configure policies via Supabase Dashboard:

### For each bucket, go to **Storage** → **Bucket Name** → **Policies**:

#### activity-covers Policies:
1. **Public read policy:**
   - Name: `Public can read activity-covers`
   - Allowed operations: `SELECT`
   - Target roles: `anon`, `authenticated`
   - Policy definition: `bucket_id = 'activity-covers'`

2. **Admin manage policy:**
   - Name: `Admins can manage activity-covers`
   - Allowed operations: `ALL`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'activity-covers' AND auth.role() = 'authenticated'`

#### gallery Policies:
1. **Public read policy:**
   - Name: `Public can read gallery`
   - Allowed operations: `SELECT`
   - Target roles: `anon`, `authenticated`
   - Policy definition: `bucket_id = 'gallery'`

2. **Admin manage policy:**
   - Name: `Admins can manage gallery`
   - Allowed operations: `ALL`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'gallery' AND auth.role() = 'authenticated'`

#### member-photos Policies:
1. **Public read policy:**
   - Name: `Public can read member-photos`
   - Allowed operations: `SELECT`
   - Target roles: `anon`, `authenticated`
   - Policy definition: `bucket_id = 'member-photos'`

2. **Admin manage policy:**
   - Name: `Admins can manage member-photos`
   - Allowed operations: `ALL`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'member-photos' AND auth.role() = 'authenticated'`

#### receipts Policies (PRIVATE):
1. **Admin read policy:**
   - Name: `Admins can read receipts`
   - Allowed operations: `SELECT`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'receipts' AND auth.role() = 'authenticated'`

2. **Admin upload policy:**
   - Name: `Admins can upload receipts`
   - Allowed operations: `INSERT`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'receipts' AND auth.role() = 'authenticated'`

3. **Admin delete policy:**
   - Name: `Admins can delete receipts`
   - Allowed operations: `DELETE`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'receipts' AND auth.role() = 'authenticated'`

## Step 3: Create Admin User

### Step 3a: Create User in Supabase Auth
1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **"Add user"**
3. Enter email: `admin@example.com` (or your preferred email)
4. Set a secure password
5. Click **"Create user"**

### Step 3b: Get User ID
Run this SQL to get the user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';
```

Copy the UUID (it looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 3c: Assign Admin Role
Replace `PASTE_YOUR_UUID_HERE` with the actual UUID from step 3b:
```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'PASTE_YOUR_UUID_HERE', -- Replace with actual UUID from step 3b
  'admin@example.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Admin User',
  updated_at = NOW();
```

## Step 4: Verify Setup

Run this verification query:
```sql
-- Check buckets exist
SELECT id, name, public FROM storage.buckets;

-- Check admin user exists
SELECT id, email, full_name, role FROM profiles WHERE role = 'admin';
```

## Alternative: Simple Storage Setup

If policy configuration is too complex, you can temporarily make buckets public during development:

1. Create all buckets as **PUBLIC**
2. Set proper RLS later when moving to production
3. This allows the application to work during development

## Troubleshooting

**Error: "missing FROM-clause entry for table storage"**
- This means the storage extension is not properly configured for SQL policy creation
- Solution: Use Dashboard policy configuration instead of SQL

**Error: "invalid input syntax for type uuid"**
- This means you didn't replace the placeholder with actual UUID
- Solution: Run step 3b to get the actual UUID, then replace placeholder

**Error: "null value in column id violates not-null constraint"**
- This means the user doesn't exist in auth.users
- Solution: Create user in Supabase Auth Dashboard first, then get the ID
