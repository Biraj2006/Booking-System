-- ============================================================
-- 24/7 Clinical Booking System — Doctor Portal & Management
-- Migration 004: Doctor status, department, role protection & approval RPCs
-- Safe to re-run
-- ============================================================

-- 1. Add status and department columns to doctors table
ALTER TABLE public.doctors 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Medicine';

-- 2. Index on doctor status
CREATE INDEX IF NOT EXISTS idx_doctors_status ON public.doctors(status);

-- 3. Backfill any nulls
UPDATE public.doctors SET status = 'approved' WHERE status IS NULL;
UPDATE public.doctors SET department = 'General Medicine' WHERE department IS NULL;

-- 4. Role Escalation Prevention
-- Ensures non-admin users cannot elevate their own role to 'doctor' or 'admin'
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_role_security ON public.profiles;
CREATE TRIGGER ensure_role_security
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 5. Admin Approve Doctor RPC
CREATE OR REPLACE FUNCTION public.admin_approve_doctor(doctor_row_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can approve doctors.';
  END IF;

  SELECT user_id INTO v_user_id FROM public.doctors WHERE id = doctor_row_id;

  UPDATE public.doctors
  SET status = 'approved', is_verified = true, is_active = true, updated_at = NOW()
  WHERE id = doctor_row_id;

  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'doctor', updated_at = NOW()
    WHERE id = v_user_id;

    -- Send notification to the doctor
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      v_user_id,
      'doctor_verified',
      'Doctor Account Approved',
      'Congratulations! Your doctor account has been approved by the clinic administration. You now have full access to the Doctor Portal.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin Reject Doctor RPC
CREATE OR REPLACE FUNCTION public.admin_reject_doctor(doctor_row_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can reject doctors.';
  END IF;

  SELECT user_id INTO v_user_id FROM public.doctors WHERE id = doctor_row_id;

  UPDATE public.doctors
  SET status = 'rejected', is_active = false, updated_at = NOW()
  WHERE id = doctor_row_id;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      v_user_id,
      'system',
      'Doctor Application Update',
      'Your doctor account registration was not approved. Please contact the clinic administration for further inquiries.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
