# Security Testing Documentation

## Security Model Overview

The Shamshad Alam Foundation backend implements a comprehensive security model using Supabase's Row Level Security (RLS) and custom PostgreSQL functions.

### Role-Based Access Control

**Admin Role:**
- Full access to all tables
- Can manage members, donations, expenses, beneficiaries, activities, gallery
- Can access admin-only RPC functions
- Can upload to all storage buckets

**Editor Role:**
- Can manage activities and gallery
- Cannot access financial records (donations, expenses, beneficiaries)
- Cannot access admin-only RPC functions
- Can upload to activity-images and member-photos

**Public/Anonymous:**
- Can read active members (limited fields)
- Can read published activities
- Can read gallery images from published activities
- Can call public-safe financial RPC functions
- Cannot access any financial or beneficiary data

## Security Tests to Perform

### 1. Anonymous User Tests

```typescript
// Test: Anonymous user cannot read donations
const result = await supabase.from('donations').select('*');
// Expected: Error - RLS blocks access

// Test: Anonymous user cannot read expenses
const result = await supabase.from('expenses').select('*');
// Expected: Error - RLS blocks access

// Test: Anonymous user cannot read beneficiaries
const result = await supabase.from('beneficiaries').select('*');
// Expected: Error - RLS blocks access

// Test: Anonymous user can read active members
const result = await supabase.from('members').select('id, full_name, role, photo_url, joining_date, status').eq('status', 'active');
// Expected: Success - returns active members only

// Test: Anonymous user can read published activities
const result = await supabase.from('activities').select('*').eq('published', true);
// Expected: Success - returns published activities only

// Test: Anonymous user cannot call admin RPC
const result = await supabase.rpc('get_member_contribution_status', { p_year: 2024, p_month: 1 });
// Expected: Error - function checks is_admin()

// Test: Anonymous user can call public RPC
const result = await supabase.rpc('get_monthly_financial_summary', { p_year: 2024, p_month: 1 });
// Expected: Success - returns aggregated data only
```

### 2. Editor User Tests

```typescript
// Test: Editor cannot access donations
const result = await supabase.from('donations').select('*');
// Expected: Error - RLS blocks access

// Test: Editor cannot access expenses
const result = await supabase.from('expenses').select('*');
// Expected: Error - RLS blocks access

// Test: Editor cannot access beneficiaries
const result = await supabase.from('beneficiaries').select('*');
// Expected: Error - RLS blocks access

// Test: Editor can manage activities
const result = await supabase.from('activities').insert({ title: 'Test', description: 'Test', category: 'education', activity_date: '2024-01-01' });
// Expected: Success - editor has permission

// Test: Editor can manage gallery
const result = await supabase.from('gallery').insert({ image_url: 'test.jpg' });
// Expected: Success - editor has permission

// Test: Editor cannot call admin RPC
const result = await supabase.rpc('get_member_contribution_status', { p_year: 2024, p_month: 1 });
// Expected: Error - function checks is_admin()
```

### 3. Admin User Tests

```typescript
// Test: Admin can access donations
const result = await supabase.from('donations').select('*');
// Expected: Success - admin has full access

// Test: Admin can access expenses
const result = await supabase.from('expenses').select('*');
// Expected: Success - admin has full access

// Test: Admin can access beneficiaries
const result = await supabase.from('beneficiaries').select('*');
// Expected: Success - admin has full access

// Test: Admin can call admin RPC
const result = await supabase.rpc('get_member_contribution_status', { p_year: 2024, p_month: 1 });
// Expected: Success - admin has permission

// Test: Admin can manage all tables
const result = await supabase.from('members').insert({ full_name: 'Test', role: 'member', joining_date: '2024-01-01' });
// Expected: Success - admin has full access
```

### 4. Data Validation Tests

```typescript
// Test: Amount must be positive
const result = await supabase.from('donations').insert({ amount: -100, donation_date: '2024-01-01', month: 1, year: 2024, payment_method: 'cash' });
// Expected: Error - constraint violation

// Test: Month must be 1-12
const result = await supabase.from('donations').insert({ amount: 100, donation_date: '2024-01-01', month: 13, year: 2024, payment_method: 'cash' });
// Expected: Error - constraint violation

// Test: Year must be reasonable
const result = await supabase.from('donations').insert({ amount: 100, donation_date: '2024-01-01', month: 1, year: 1800, payment_method: 'cash' });
// Expected: Error - constraint violation

// Test: Category must be valid
const result = await supabase.from('expenses').insert({ category: 'invalid', amount: 100, expense_date: '2024-01-01', month: 1, year: 2024, description: 'Test' });
// Expected: Error - enum constraint violation
```

### 5. Storage Security Tests

```typescript
// Test: Anonymous user cannot upload to receipts
const result = await supabase.storage.from('receipts').upload('test.jpg', file);
// Expected: Error - RLS blocks access

// Test: Anonymous user cannot read from receipts
const result = await supabase.storage.from('receipts').getPublicUrl('test.jpg');
// Expected: Error - RLS blocks access

// Test: Admin can upload to receipts
const result = await supabase.storage.from('receipts').upload('test.jpg', file);
// Expected: Success - admin has permission

// Test: Anonymous user can read from foundation-images
const result = await supabase.storage.from('foundation-images').getPublicUrl('logo.png');
// Expected: Success - public read allowed
```

### 6. RPC Function Security Tests

```typescript
// Test: Public RPC returns only aggregates
const result = await supabase.rpc('get_monthly_financial_summary', { p_year: 2024, p_month: 1 });
// Expected: Returns { total_donations, total_expenses, balance } - no individual records

// Test: Admin RPC checks authorization
const result = await supabase.rpc('get_member_contribution_status', { p_year: 2024, p_month: 1 });
// Expected: Error for non-admin users, success for admin

// Test: Category summary returns only aggregates
const result = await supabase.rpc('get_expense_category_summary', { p_year: 2024, p_month: 1 });
// Expected: Returns { education, medical, other } - no individual records
```

## Security Checklist

- [ ] Anonymous users cannot access donations table
- [ ] Anonymous users cannot access expenses table
- [ ] Anonymous users cannot access beneficiaries table
- [ ] Anonymous users cannot access receipt storage
- [ ] Anonymous users cannot call admin RPC functions
- [ ] Anonymous users can read active members
- [ ] Anonymous users can read published activities
- [ ] Anonymous users can read public gallery
- [ ] Anonymous users can call public financial RPCs
- [ ] Editors cannot access financial tables
- [ ] Editors cannot access beneficiary data
- [ ] Editors cannot access receipt storage
- [ ] Editors cannot call admin RPC functions
- [ ] Editors can manage activities
- [ ] Editors can manage gallery
- [ ] Admins can access all tables
- [ ] Admins can call all RPC functions
- [ ] Admins can access all storage buckets
- [ ] Data validation constraints work correctly
- [ ] Amount > 0 constraints enforced
- [ ] Month 1-12 constraints enforced
- [ ] Year range constraints enforced
- [ ] Category enum constraints enforced
- [ ] Payment method enum constraints enforced
- [ ] Activity category enum constraints enforced
- [ ] Date consistency triggers work correctly
- [ ] Updated_at triggers work correctly
- [ ] Public RPC functions return only aggregates
- [ ] No individual records exposed through public APIs

## How to Run Security Tests

1. **Set up test users:**
   - Create an admin user in Supabase Auth
   - Create an editor user in Supabase Auth
   - Ensure both have proper profiles with correct roles

2. **Test with different authentication states:**
   - Test without authentication (anonymous)
   - Test with editor authentication
   - Test with admin authentication

3. **Use Supabase client with proper auth:**
   ```typescript
   // For anonymous testing
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
   
   // For authenticated testing
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'test@example.com',
     password: 'password'
   });
   ```

4. **Document results:**
   - Record which tests pass/fail
   - Note any security vulnerabilities found
   - Report RLS policy violations

## Common Security Issues to Watch For

1. **RLS Policy Violations:**
   - Policies not applied correctly
   - Policies too permissive
   - Policies missing on sensitive tables

2. **RPC Function Vulnerabilities:**
   - Functions missing authorization checks
   - Functions returning individual records instead of aggregates
   - Functions exposing sensitive data

3. **Storage Policy Issues:**
   - Private storage made public
   - Missing RLS on storage buckets
   - Overly permissive upload policies

4. **Data Validation Gaps:**
   - Missing database constraints
   - Client-side validation only
   - SQL injection vulnerabilities

5. **Authentication Issues:**
   - Profile creation triggers not working
   - Role assignment issues
   - Session management problems
