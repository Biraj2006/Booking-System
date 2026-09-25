# MediCare 24/7 — Clinical Booking System

A production-grade clinical booking platform built with **React + Vite + TypeScript + Tailwind CSS v4**, powered by **Supabase** (PostgreSQL, Auth, Row Level Security). Supports three user roles (Patient, Doctor, Admin), 24/7 appointment booking, doctor management, reviews, real-time notifications, and an emergency section.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Security | Row Level Security (RLS) |
| Maps | Leaflet + React Leaflet |
| Notifications | Sonner (toast) + Supabase Realtime (in-app) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| State | React Context + custom hooks |
| Date/Time | date-fns |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Configure environment:**

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. **Set up the database:**

Run the SQL migration files in your Supabase SQL Editor **in order**:

1. `supabase/migrations/001_initial_schema.sql` — Creates all tables, indexes, triggers
2. `supabase/migrations/002_rls_policies.sql` — Enables Row Level Security
3. `supabase/migrations/003_seed_data.sql` — Seeds specializations and default clinic

4. **Enable Realtime (optional but recommended):**

In your Supabase Dashboard → Database → Replication, enable realtime for the `notifications` table to get live notification updates.

5. **Start the dev server:**

```bash
npm run dev
```

## Features

### For Patients
- Browse & search doctors by name, specialization, experience, and consultation type
- View doctor profiles with availability schedules and reviews
- Book appointments with a 5-step wizard (date → time → type → details → confirm)
- Double-booking prevention at the database level
- Cancel appointments with reason
- Leave star ratings and reviews for completed appointments
- Real-time in-app notifications

### For Doctors
- Dashboard with today's appointments overview
- View upcoming and completed appointments
- Mark appointments as completed or no-show
- Manage weekly availability (add/remove time slots)
- Block specific dates

### For Admins
- System-wide statistics dashboard
- Manage doctors (view, search)
- Manage patients (view, search)
- Manage appointments (view, filter by status)
- Manage specializations (CRUD)

### General
- 24/7 availability indicator
- Emergency section with contact information
- Responsive design (mobile, tablet, desktop)
- Accessible (ARIA labels, keyboard navigation, focus management)
- Error boundaries for graceful error handling
- Loading and empty states throughout

## Project Structure

```
src/
├── components/
│   ├── auth/             # ProtectedRoute
│   ├── common/           # Button, Input, Card, Modal, Badge, Spinner, etc.
│   ├── doctors/          # DoctorCard, DoctorFilters
│   ├── layout/           # Navbar, Footer, Sidebar, MainLayout, DashboardLayout
│   └── notifications/    # NotificationBell, NotificationList, NotificationItem
├── contexts/             # AuthContext, NotificationContext
├── hooks/                # useDoctors, useAppointments
├── lib/                  # supabase client, constants, utils, validators
├── pages/                # All route pages
├── types/                # TypeScript type definitions
├── App.tsx               # Root component + routing
├── main.tsx              # Entry point
└── index.css             # Tailwind imports + design tokens
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |

## Database Schema

The system uses 11 tables:

- `profiles` — Extended user data (linked to Supabase Auth)
- `doctors` — Doctor profiles, qualifications, experience
- `specializations` — Medical specializations
- `doctor_specializations` — Many-to-many: doctors ↔ specializations
- `clinics` — Clinic/department information
- `doctor_availability` — Weekly recurring time slots
- `blocked_dates` — Dates a doctor is unavailable
- `appointments` — All appointment records
- `reviews` — Patient reviews for completed appointments
- `notifications` — In-app notification records
- `audit_logs` — System activity tracking

## License

Private — All rights reserved.
