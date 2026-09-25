import type { AppointmentStatus, ConsultationType } from './index';
import type { Doctor } from './doctor';
import type { Profile } from './auth';

// ============================================================
// Appointment
// ============================================================
export interface Appointment {
  id: string;
  appointment_id: string; // unique human-readable ID (e.g., APT-20260916-001)
  patient_id: string;
  doctor_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // HH:mm
  end_time: string;          // HH:mm
  consultation_type: ConsultationType;
  status: AppointmentStatus;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  patient_age: number | null;
  patient_gender: string | null;
  symptoms: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  doctor?: Doctor;
  patient?: Profile;
}

// ============================================================
// Time Slot (computed, not stored)
// ============================================================
export interface TimeSlot {
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  is_available: boolean;
  is_past: boolean;
}

// ============================================================
// Booking Form Data
// ============================================================
export interface BookingFormData {
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  consultation_type: ConsultationType;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  patient_age: number | null;
  patient_gender: string;
  symptoms: string;
  notes: string;
}

// ============================================================
// Appointment Filters
// ============================================================
export interface AppointmentFilters {
  status: AppointmentStatus | 'all';
  date_from: string;
  date_to: string;
  doctor_id: string;
  patient_id: string;
}
