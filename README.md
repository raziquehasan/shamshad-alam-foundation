# Shamshad Alam Foundation Website

A production-ready website for the Shamshad Alam Foundation, established in 1980 to serve the local community in memory of Shamshad Alam (1950-2020).

## Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Lucide React** - Icons
- **Recharts** - Charts and data visualization

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage
  - Row Level Security (RLS)

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Environment variables** - `.env` for sensitive data

## Project Structure

```
src/
  components/     # Reusable UI components
  pages/          # Page components
    admin/        # Admin-specific pages
  layouts/        # Layout components
  lib/            # Supabase client
  hooks/          # Custom React hooks
  services/       # API services
  types/          # TypeScript types
  utils/          # Utility functions
  assets/         # Static assets
  styles/         # Global styles

supabase/
  migrations/     # Database migrations
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd shamshad-alam-foundation
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Setup

1. Create a new project in [Supabase Dashboard](https://supabase.com/dashboard)

2. Run the database migrations:
   - Go to your Supabase project's SQL Editor
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Run the SQL script to create tables and security policies
   - Copy the contents of `supabase/migrations/002_storage_policies.sql`
   - Run the SQL script to create storage security policies

3. Set up storage buckets (in Supabase Dashboard → Storage):
   - `foundation-images` - Public images
   - `member-photos` - Member profile photos
   - `activity-images` - Activity images
   - `receipts` - Private expense receipts (NOT public)

4. Create an admin user:
   - Create a user in Supabase Auth
   - The system will automatically create a profile with default `role: 'editor'`
   - Manually update the user's role to `admin` in the `profiles` table via SQL Editor
   - Example: `UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';`

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

### Lint

Run ESLint:
```bash
npm run lint
```

## Database Schema

### Tables
- **profiles** - User profiles and roles
- **members** - Foundation members
- **donations** - Donation records
- **expenses** - Expense records
- **activities** - Foundation activities
- **gallery** - Activity gallery images
- **beneficiaries** - Beneficiary records

### Security

The database uses Row Level Security (RLS) to ensure:
- Public users can only see published content
- Public users can only see active members
- Admin users have full access to manage data
- Sensitive financial data is protected

## Features

### Public Website
- Foundation history and information
- Members directory
- Community work showcase
- Impact statistics
- Financial transparency
- Activities and news
- Photo gallery
- Donation information
- Contact form

### Admin Dashboard
- Member management
- Donation tracking
- Expense management
- Activity management
- Reports and analytics
- Financial transparency reports

## Public Routes
- `/` - Home
- `/about` - About the foundation
- `/members` - Members directory
- `/work` - Our work
- `/impact` - Impact statistics
- `/transparency` - Financial transparency
- `/activities` - Activities and news
- `/gallery` - Photo gallery
- `/donate` - Donation information
- `/contact` - Contact form

## Admin Routes
- `/admin/login` - Admin login
- `/admin` - Dashboard
- `/admin/members` - Member management
- `/admin/donations` - Donation management
- `/admin/expenses` - Expense management
- `/admin/deactivities` - Activity management
- `/admin/reports` - Reports and analytics

## Deployment

### Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Cloudflare Pages
1. Connect your GitHub repository to Cloudflare Pages
2. Add environment variables
3. Deploy

## Contributing

This is a private project for the Shamshad Alam Foundation. Please contact the foundation administrators for contribution guidelines.

## License

Copyright © 2025 Shamshad Alam Foundation. All rights reserved.
