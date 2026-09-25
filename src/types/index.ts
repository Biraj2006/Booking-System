// ============================================================
// User Roles
// ============================================================
export type UserRole = 'patient' | 'doctor' | 'admin';

// ============================================================
// Appointment Status
// ============================================================
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

// ============================================================
// Consultation Type
// ============================================================
export type ConsultationType = 'online' | 'offline';

// ============================================================
// Day of Week
// ============================================================
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ============================================================
// Gender
// ============================================================
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// ============================================================
// Notification Type
// ============================================================
export type NotificationType =
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'appointment_reminder'
  | 'appointment_completed'
  | 'review_received'
  | 'doctor_verified'
  | 'system';

export type {
  Clinic,
  ClinicOpeningStatus,
  ClinicFilters,
  UserLocation,
  GeolocationStatus,
} from './clinic';
