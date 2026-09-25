-- ============================================================
-- 24/7 Clinical Booking System — Row Level Security Policies
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor
-- Safe to re-run: drops existing policies before recreating
-- ============================================================

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is doctor
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get doctor_id for current user
CREATE OR REPLACE FUNCTION public.get_doctor_id()
RETURNS UUID AS $$
  SELECT id FROM public.doctors WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;

-- Everyone can read basic profile info (for doctor names, etc.)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can update any profile
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No direct insert (handled by trigger) or delete by users
CREATE POLICY "profiles_insert_trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ============================================================
-- SPECIALIZATIONS
-- ============================================================
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "specializations_select_all" ON public.specializations;
DROP POLICY IF EXISTS "specializations_insert_admin" ON public.specializations;
DROP POLICY IF EXISTS "specializations_update_admin" ON public.specializations;
DROP POLICY IF EXISTS "specializations_delete_admin" ON public.specializations;

-- Everyone can read specializations
CREATE POLICY "specializations_select_all"
  ON public.specializations FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "specializations_insert_admin"
  ON public.specializations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "specializations_update_admin"
  ON public.specializations FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "specializations_delete_admin"
  ON public.specializations FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- CLINICS
-- ============================================================
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinics_select_all" ON public.clinics;
DROP POLICY IF EXISTS "clinics_insert_admin" ON public.clinics;
DROP POLICY IF EXISTS "clinics_update_admin" ON public.clinics;
DROP POLICY IF EXISTS "clinics_delete_admin" ON public.clinics;

-- Everyone can read clinics
CREATE POLICY "clinics_select_all"
  ON public.clinics FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "clinics_insert_admin"
  ON public.clinics FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "clinics_update_admin"
  ON public.clinics FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "clinics_delete_admin"
  ON public.clinics FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- DOCTORS
-- ============================================================
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_select_public" ON public.doctors;
DROP POLICY IF EXISTS "doctors_insert_admin" ON public.doctors;
DROP POLICY IF EXISTS "doctors_update_own" ON public.doctors;
DROP POLICY IF EXISTS "doctors_update_admin" ON public.doctors;
DROP POLICY IF EXISTS "doctors_delete_admin" ON public.doctors;

-- Everyone can read active & verified doctors
CREATE POLICY "doctors_select_public"
  ON public.doctors FOR SELECT
  USING (true);

-- Admins can insert doctors
CREATE POLICY "doctors_insert_admin"
  ON public.doctors FOR INSERT
  WITH CHECK (public.is_admin());

-- Doctors can update their own record
CREATE POLICY "doctors_update_own"
  ON public.doctors FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update any doctor
CREATE POLICY "doctors_update_admin"
  ON public.doctors FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete doctors
CREATE POLICY "doctors_delete_admin"
  ON public.doctors FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- DOCTOR_SPECIALIZATIONS
-- ============================================================
ALTER TABLE public.doctor_specializations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_specs_select_all" ON public.doctor_specializations;
DROP POLICY IF EXISTS "doctor_specs_insert_admin" ON public.doctor_specializations;
DROP POLICY IF EXISTS "doctor_specs_delete_admin" ON public.doctor_specializations;
DROP POLICY IF EXISTS "doctor_specs_insert_own" ON public.doctor_specializations;
DROP POLICY IF EXISTS "doctor_specs_delete_own" ON public.doctor_specializations;

-- Everyone can read
CREATE POLICY "doctor_specs_select_all"
  ON public.doctor_specializations FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "doctor_specs_insert_admin"
  ON public.doctor_specializations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "doctor_specs_delete_admin"
  ON public.doctor_specializations FOR DELETE
  USING (public.is_admin());

-- Doctors can manage their own specializations
CREATE POLICY "doctor_specs_insert_own"
  ON public.doctor_specializations FOR INSERT
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "doctor_specs_delete_own"
  ON public.doctor_specializations FOR DELETE
  USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );


-- ============================================================
-- DOCTOR_AVAILABILITY
-- ============================================================
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability_select_all" ON public.doctor_availability;
DROP POLICY IF EXISTS "availability_insert_own" ON public.doctor_availability;
DROP POLICY IF EXISTS "availability_update_own" ON public.doctor_availability;
DROP POLICY IF EXISTS "availability_delete_own" ON public.doctor_availability;
DROP POLICY IF EXISTS "availability_all_admin" ON public.doctor_availability;

-- Everyone can read availability (needed for booking)
CREATE POLICY "availability_select_all"
  ON public.doctor_availability FOR SELECT
  USING (true);

-- Doctors can manage their own availability
CREATE POLICY "availability_insert_own"
  ON public.doctor_availability FOR INSERT
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "availability_update_own"
  ON public.doctor_availability FOR UPDATE
  USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "availability_delete_own"
  ON public.doctor_availability FOR DELETE
  USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

-- Admins can manage all availability
CREATE POLICY "availability_all_admin"
  ON public.doctor_availability FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- BLOCKED_DATES
-- ============================================================
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_dates_select_all" ON public.blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_insert_own" ON public.blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_delete_own" ON public.blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_all_admin" ON public.blocked_dates;

-- Everyone can read blocked dates (needed for booking)
CREATE POLICY "blocked_dates_select_all"
  ON public.blocked_dates FOR SELECT
  USING (true);

-- Doctors can manage their own blocked dates
CREATE POLICY "blocked_dates_insert_own"
  ON public.blocked_dates FOR INSERT
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "blocked_dates_delete_own"
  ON public.blocked_dates FOR DELETE
  USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

-- Admins can manage all blocked dates
CREATE POLICY "blocked_dates_all_admin"
  ON public.blocked_dates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- APPOINTMENTS
-- ============================================================
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select_patient" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_doctor" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_patient" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_patient" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_doctor" ON public.appointments;
DROP POLICY IF EXISTS "appointments_all_admin" ON public.appointments;

-- Patients can see their own appointments
CREATE POLICY "appointments_select_patient"
  ON public.appointments FOR SELECT
  USING (patient_id = auth.uid());

-- Doctors can see appointments assigned to them
CREATE POLICY "appointments_select_doctor"
  ON public.appointments FOR SELECT
  USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

-- Admins can see all appointments
CREATE POLICY "appointments_select_admin"
  ON public.appointments FOR SELECT
  USING (public.is_admin());

-- Authenticated patients can create appointments
CREATE POLICY "appointments_insert_patient"
  ON public.appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- Patients can update their own appointments (cancel/reschedule)
CREATE POLICY "appointments_update_patient"
  ON public.appointments FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Doctors can update their appointments (complete/no-show)
CREATE POLICY "appointments_update_doctor"
  ON public.appointments FOR UPDATE
  USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

-- Admins can manage all appointments
CREATE POLICY "appointments_all_admin"
  ON public.appointments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- REVIEWS
-- ============================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_patient" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_admin" ON public.reviews;

-- Everyone can read reviews
CREATE POLICY "reviews_select_all"
  ON public.reviews FOR SELECT
  USING (true);

-- Patients can create reviews for their own completed appointments
CREATE POLICY "reviews_insert_patient"
  ON public.reviews FOR INSERT
  WITH CHECK (
    patient_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = reviews.appointment_id
        AND appointments.patient_id = auth.uid()
        AND appointments.status = 'completed'
    )
  );

-- Patients can update their own reviews
CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Admins can delete reviews
CREATE POLICY "reviews_delete_admin"
  ON public.reviews FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- NOTIFICATIONS
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_all_admin" ON public.notifications;

-- Users can see their own notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Any authenticated user can insert notifications
CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- Admins can manage all notifications
CREATE POLICY "notifications_all_admin"
  ON public.notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- AUDIT_LOGS
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

-- Only admins can read audit logs
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- Anyone authenticated can insert audit logs
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No one can update or delete audit logs
-- (no UPDATE or DELETE policies = immutable logs)
