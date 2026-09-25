import type { AppointmentStatus, ConsultationType, DayOfWeek, UserRole } from '@/types';

// ============================================================
// App Configuration
// ============================================================
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MediCare 24/7';
export const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION || 'Your trusted 24/7 clinical booking system';

// ============================================================
// Clinic Information
// ============================================================
export const CLINIC = {
  name: import.meta.env.VITE_CLINIC_NAME || 'MediCare 24/7 Clinical Center',
  phone: import.meta.env.VITE_CLINIC_PHONE || '+1-800-MEDICARE',
  email: import.meta.env.VITE_CLINIC_EMAIL || 'contact@medicare247.com',
  address: import.meta.env.VITE_CLINIC_ADDRESS || '123 Healthcare Avenue, Medical District, NY 10001',
  lat: parseFloat(import.meta.env.VITE_CLINIC_LAT || '40.7128'),
  lng: parseFloat(import.meta.env.VITE_CLINIC_LNG || '-74.0060'),
  emergencyPhone: import.meta.env.VITE_EMERGENCY_PHONE || '911',
} as const;

// ============================================================
// Routes
// ============================================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DOCTORS: '/doctors',
  DOCTOR_DETAIL: '/doctors/:id',
  BOOKING: '/booking/:doctorId',
  BOOKING_SUCCESS: '/booking/success/:appointmentId',
  EMERGENCY: '/emergency',
  NEARBY_CLINICS: '/nearby-clinics',
  CLINIC_DETAIL: '/clinics/:id',
  CONTACT: '/contact',
  // Patient
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_APPOINTMENTS: '/patient/appointments',
  PATIENT_PROFILE: '/patient/profile',
  // Doctor
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_APPOINTMENTS: '/doctor/appointments',
  DOCTOR_PATIENTS: '/doctor/patients',
  DOCTOR_AVAILABILITY: '/doctor/availability',
  DOCTOR_PROFILE_EDIT: '/doctor/profile',
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_DOCTORS: '/admin/doctors',
  ADMIN_PATIENTS: '/admin/patients',
  ADMIN_APPOINTMENTS: '/admin/appointments',
  ADMIN_SPECIALIZATIONS: '/admin/specializations',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
} as const;

// ============================================================
// Appointment Status Labels & Colors
// ============================================================
export const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  completed: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  'no-show': { label: 'No Show', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' },
};

// ============================================================
// Consultation Type Labels
// ============================================================
export const CONSULTATION_TYPE_CONFIG: Record<
  ConsultationType,
  { label: string; icon: string; description: string }
> = {
  online: { label: 'Online', icon: 'Video', description: 'Video consultation from home' },
  offline: { label: 'In-Person', icon: 'Building2', description: 'Visit the clinic for consultation' },
};

// ============================================================
// Days of Week
// ============================================================
export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
];

// ============================================================
// Role Labels
// ============================================================
export const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Administrator',
};

// ============================================================
// Default Slot Duration (minutes)
// ============================================================
export const DEFAULT_SLOT_DURATION = 30;

// ============================================================
// Pagination
// ============================================================
export const DEFAULT_PAGE_SIZE = 10;

// ============================================================
// Services offered by the clinic
// ============================================================
export const CLINIC_SERVICES = [
  {
    title: 'General Consultation',
    description: 'Comprehensive health check-ups and medical consultations for all ages.',
    icon: 'Stethoscope',
  },
  {
    title: 'Online Consultation',
    description: 'Connect with experienced doctors from the comfort of your home via video call.',
    icon: 'Video',
  },
  {
    title: 'Specialist Care',
    description: 'Access to top specialists in cardiology, neurology, orthopedics, and more.',
    icon: 'Heart',
  },
  {
    title: 'Diagnostic Services',
    description: 'State-of-the-art laboratory and imaging services for accurate diagnosis.',
    icon: 'Microscope',
  },
  {
    title: '24/7 Emergency',
    description: 'Round-the-clock emergency medical services with experienced staff.',
    icon: 'Siren',
  },
  {
    title: 'Preventive Health',
    description: 'Health screening packages and preventive care programs tailored for you.',
    icon: 'ShieldCheck',
  },
] as const;

// ============================================================
// FAQ Data
// ============================================================
export const FAQ_DATA = [
  {
    question: 'How do I book an appointment?',
    answer: 'Simply search for a doctor by name or specialization, select a convenient date and time slot, fill in your details, and confirm your booking. You will receive a confirmation with your unique appointment ID.',
  },
  {
    question: 'Can I book appointments 24/7?',
    answer: 'Yes! Our online booking system is available 24 hours a day, 7 days a week. You can browse doctors and book appointments at any time that suits you.',
  },
  {
    question: 'How do I cancel or reschedule an appointment?',
    answer: 'Log in to your patient dashboard, navigate to your upcoming appointments, and use the reschedule or cancel option. Please try to cancel or reschedule at least 24 hours in advance.',
  },
  {
    question: 'Is online consultation available?',
    answer: 'Yes, many of our doctors offer online video consultations. You can filter doctors by consultation type when searching for a doctor.',
  },
  {
    question: 'What should I do in a medical emergency?',
    answer: 'For medical emergencies, please call emergency services immediately. Our online booking system is not intended for emergency situations. Visit our Emergency section for emergency contact numbers.',
  },
  {
    question: 'How can I view my appointment history?',
    answer: 'After logging in, go to your Patient Dashboard where you can view all your upcoming, completed, and cancelled appointments along with their details.',
  },
] as const;
