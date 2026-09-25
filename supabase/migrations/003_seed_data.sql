-- ============================================================
-- 24/7 Clinical Booking System — Seed Data
-- Run this AFTER 001 and 002 in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Specializations
-- ============================================================
INSERT INTO public.specializations (name, description, icon) VALUES
  ('General Medicine', 'General health consultations, preventive care, and primary healthcare services.', 'Stethoscope'),
  ('Cardiology', 'Diagnosis and treatment of heart and cardiovascular system disorders.', 'Heart'),
  ('Dermatology', 'Treatment of skin, hair, and nail conditions.', 'Sparkles'),
  ('Orthopedics', 'Treatment of musculoskeletal system including bones, joints, and muscles.', 'Bone'),
  ('Pediatrics', 'Medical care for infants, children, and adolescents.', 'Baby'),
  ('Neurology', 'Diagnosis and treatment of nervous system disorders.', 'Brain'),
  ('Ophthalmology', 'Treatment of eye diseases and vision problems.', 'Eye'),
  ('ENT', 'Ear, nose, and throat specialist for related conditions.', 'Ear'),
  ('Gynecology', 'Women''s reproductive health and related conditions.', 'Heart'),
  ('Psychiatry', 'Mental health diagnosis, treatment, and counseling.', 'Brain'),
  ('Dentistry', 'Oral health care, dental treatments, and surgery.', 'Smile'),
  ('Urology', 'Urinary tract and male reproductive system treatments.', 'Activity'),
  ('Pulmonology', 'Diagnosis and treatment of respiratory system diseases.', 'Wind'),
  ('Gastroenterology', 'Digestive system disorders and treatments.', 'Activity'),
  ('Endocrinology', 'Hormonal and metabolic disorder treatments.', 'Activity')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- Default Clinic
-- ============================================================
INSERT INTO public.clinics (name, address, phone, email, description, latitude, longitude) VALUES
  (
    'MediCare 24/7 Clinical Center',
    '123 Healthcare Avenue, Medical District, NY 10001',
    '+1-800-MEDICARE',
    'contact@medicare247.com',
    'A state-of-the-art multi-specialty clinical center providing 24/7 healthcare services with experienced medical professionals and modern facilities.',
    40.7128,
    -74.0060
  )
ON CONFLICT DO NOTHING;


-- ============================================================
-- Note: Admin user should be created through Supabase Auth
-- Then update their role manually:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';
-- ============================================================
