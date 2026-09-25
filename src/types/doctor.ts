import type { ConsultationType, DayOfWeek } from './index';

// ============================================================
// Specialization
// ============================================================
export interface Specialization {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

import type { Clinic, ClinicOpeningStatus } from './clinic';
export type { Clinic, ClinicOpeningStatus };

export type DoctorStatus = 'pending' | 'approved' | 'rejected';

// ============================================================
// Doctor
// ============================================================
export interface Doctor {
  id: string;
  user_id: string; // links to profiles.id
  clinic_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  qualification: string;
  experience_years: number;
  bio: string | null;
  languages: string[];
  consultation_types: ConsultationType[];
  consultation_fee: number | null;
  is_verified: boolean;
  is_active: boolean;
  status: DoctorStatus;
  department?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  specializations?: Specialization[];
  clinic?: Clinic;
  availability?: DoctorAvailability[];
  average_rating?: number;
  total_reviews?: number;
}

export interface DoctorFormData {
  full_name: string;
  email: string;
  phone: string;
  specialization_id: string;
  experience_years: number;
  department: string;
  consultation_fee: number;
  status: DoctorStatus;
  // Initial availability configuration
  working_days: DayOfWeek[];
  start_time: string;
  end_time: string;
  slot_duration: number;
  // Initial login password for the doctor
  password?: string;
}

// ============================================================
// Doctor Availability (weekly recurring slots)
// ============================================================
export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
  slot_duration: number; // minutes (default 30)
  is_active: boolean;
  created_at: string;
}

// ============================================================
// Blocked Date (doctor unavailability)
// ============================================================
export interface BlockedDate {
  id: string;
  doctor_id: string;
  blocked_date: string; // YYYY-MM-DD
  reason: string | null;
  created_at: string;
}

// ============================================================
// Doctor Search Filters
// ============================================================
export interface DoctorFilters {
  search: string;
  specialization: string;
  consultation_type: ConsultationType | '';
  availability: 'today' | 'this_week' | 'any' | '';
  min_experience: number | null;
  max_experience: number | null;
  is_verified: boolean | null;
}
