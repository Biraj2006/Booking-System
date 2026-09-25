-- ============================================================
-- 24/7 Clinical Booking System — Migration 005
-- Nearby Clinic Finder: Schema Extension, Seed Clinics & Security
-- Run this in your Supabase SQL Editor
-- Safe to re-run
-- ============================================================

-- 1. Extend public.clinics table with finder attributes
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Greater Noida',
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Uttar Pradesh',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS opening_status TEXT DEFAULT 'open' CHECK (opening_status IN ('open', 'limited', 'closed')),
  ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT 'Mon - Sun: 24/7',
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT ARRAY['General Consultation', 'Emergency Care', 'Pharmacy', 'Diagnostic Services']::TEXT[],
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
  ADD COLUMN IF NOT EXISTS has_emergency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_24_7 BOOLEAN DEFAULT false;

-- 2. Indexes for fast location, status, and availability queries
CREATE INDEX IF NOT EXISTS idx_clinics_lat_lng ON public.clinics(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_clinics_city ON public.clinics(city);
CREATE INDEX IF NOT EXISTS idx_clinics_opening_status ON public.clinics(opening_status);
CREATE INDEX IF NOT EXISTS idx_clinics_has_emergency ON public.clinics(has_emergency);
CREATE INDEX IF NOT EXISTS idx_clinics_is_active ON public.clinics(is_active);

-- 3. Update existing default clinic record to Greater Noida / Delhi NCR
UPDATE public.clinics
SET
  name = 'MediCare 24/7 Clinical Center — Greater Noida',
  address = 'Commercial Belt, Near Pari Chowk, Greater Noida, UP 201310',
  city = 'Greater Noida',
  state = 'Uttar Pradesh',
  country = 'India',
  phone = '+91-120-555-0199',
  email = 'greaternoida@medicare247.com',
  description = 'Premier 24/7 clinical center in Greater Noida equipped with round-the-clock emergency triage, pathology lab, ICU step-down care, and experienced resident physicians.',
  latitude = 28.4744,
  longitude = 77.5040,
  opening_status = 'open',
  opening_hours = '24 Hours / 7 Days a Week',
  is_24_7 = true,
  has_emergency = true,
  image_url = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
  services = ARRAY['General Medicine', '24/7 Emergency', 'Cardiology', 'Pediatrics', 'Pharmacy', 'Diagnostic Services', 'Online Video Consultation']::TEXT[]
WHERE id = '6bf4cd91-ab33-47ea-8e95-7f21452147f3';

-- 4. Insert registered clinics across Greater Noida, Delhi & Noida
INSERT INTO public.clinics (
  id,
  name,
  address,
  city,
  state,
  country,
  phone,
  email,
  description,
  latitude,
  longitude,
  opening_status,
  opening_hours,
  is_24_7,
  has_emergency,
  image_url,
  services,
  is_active
) VALUES
  (
    'b1111111-1111-4111-8111-111111111111',
    'MediCare 24/7 Clinical Center — Greater Noida',
    'Commercial Belt, Near Pari Chowk, Greater Noida, UP 201310',
    'Greater Noida',
    'Uttar Pradesh',
    'India',
    '+91-120-555-0199',
    'greaternoida@medicare247.com',
    'Premier 24/7 clinical center in Greater Noida equipped with round-the-clock emergency triage, pathology lab, ICU step-down care, and experienced resident physicians.',
    28.4744,
    77.5040,
    'open',
    '24 Hours / 7 Days a Week',
    true,
    true,
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    ARRAY['General Medicine', '24/7 Emergency', 'Cardiology', 'Pediatrics', 'Pharmacy', 'Diagnostic Services', 'Online Video Consultation']::TEXT[],
    true
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    'Knowledge Park Urgent Care & Family Clinic',
    'Plot 12, Knowledge Park III, Greater Noida, UP 201306',
    'Greater Noida',
    'Uttar Pradesh',
    'India',
    '+91-120-555-0142',
    'kp3@medicare247.com',
    'Modern walk-in clinic near student and residential communities in Knowledge Park offering fast general consultations, blood work, and routine health checks.',
    28.4615,
    77.4925,
    'open',
    'Mon - Sun: 08:00 AM - 10:00 PM',
    false,
    false,
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    ARRAY['General Medicine', 'Pediatrics', 'Dermatology', 'Routine Checkups', 'Blood Testing']::TEXT[],
    true
  ),
  (
    'b3333333-3333-4333-8333-333333333333',
    'Delhi Central Specialty Hospital — Connaught Place',
    'Barakhamba Road, Connaught Place, New Delhi, DL 110001',
    'New Delhi',
    'Delhi',
    'India',
    '+91-11-2341-0100',
    'delhi.central@medicare247.com',
    'Flagship central hospital in Connaught Place offering tertiary multi-specialty care, cardiac cath labs, digital radiography, and trauma emergency.',
    28.6315,
    77.2215,
    'open',
    '24 Hours / 7 Days a Week',
    true,
    true,
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
    ARRAY['24/7 Emergency', 'Cardiology', 'Internal Medicine', 'Digital X-Ray', 'Pharmacy', 'Online Video Consultation']::TEXT[],
    true
  ),
  (
    'b4444444-4444-4444-8444-444444444444',
    'South Delhi Specialty Medical Center — Saket',
    'Press Enclave Road, Saket District Centre, New Delhi, DL 110017',
    'New Delhi',
    'Delhi',
    'India',
    '+91-11-2651-0200',
    'saket@medicare247.com',
    'Advanced neighborhood medical center in Saket with leading specialists in orthopedics, women’s health, pediatric medicine, and rehabilitation.',
    28.5244,
    77.2066,
    'open',
    'Mon - Sun: 08:00 AM - 11:00 PM',
    false,
    true,
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    ARRAY['Orthopedics', 'Pediatrics', 'General Medicine', 'Gynecology', 'Ultrasound']::TEXT[],
    true
  ),
  (
    'b5555555-5555-4555-8555-555555555555',
    'Noida Sector 62 City Care Clinic',
    'C-Block, Sector 62, Noida, UP 201309',
    'Noida',
    'Uttar Pradesh',
    'India',
    '+91-120-456-0300',
    'noida62@medicare247.com',
    'Convenient outpatient clinical center for professionals and residents in Noida Sector 62, offering same-day appointments and lab diagnostics.',
    28.6280,
    77.3649,
    'limited',
    'Mon - Sat: 09:00 AM - 06:00 PM',
    false,
    false,
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    ARRAY['General Consultation', 'Dermatology', 'Dental Care', 'Preventive Health']::TEXT[],
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  description = EXCLUDED.description,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  opening_status = EXCLUDED.opening_status,
  opening_hours = EXCLUDED.opening_hours,
  is_24_7 = EXCLUDED.is_24_7,
  has_emergency = EXCLUDED.has_emergency,
  image_url = EXCLUDED.image_url,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- 5. Link existing doctors in DB to Greater Noida clinic
UPDATE public.doctors
SET clinic_id = 'b1111111-1111-4111-8111-111111111111'
WHERE clinic_id IS NULL OR clinic_id = '6bf4cd91-ab33-47ea-8e95-7f21452147f3';

-- 6. Row Level Security Policies for clinics table
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinics_select_public" ON public.clinics;
CREATE POLICY "clinics_select_public"
  ON public.clinics FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "clinics_insert_admin" ON public.clinics;
CREATE POLICY "clinics_insert_admin"
  ON public.clinics FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "clinics_update_admin" ON public.clinics;
CREATE POLICY "clinics_update_admin"
  ON public.clinics FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "clinics_delete_admin" ON public.clinics;
CREATE POLICY "clinics_delete_admin"
  ON public.clinics FOR DELETE
  USING (public.is_admin());
