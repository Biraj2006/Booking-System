import { z } from 'zod';

// ============================================================
// Login Schema
// ============================================================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ============================================================
// Register Schema
// ============================================================
export const registerSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s-()]{7,15}$/.test(val),
      'Please enter a valid phone number'
    ),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirm_password: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ============================================================
// Forgot Password Schema
// ============================================================
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// ============================================================
// Reset Password Schema
// ============================================================
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ============================================================
// Profile Schema
// ============================================================
export const profileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s-()]{7,15}$/.test(val),
      'Please enter a valid phone number'
    ),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  address: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ============================================================
// Booking Schema
// ============================================================
export const bookingSchema = z.object({
  patient_name: z
    .string()
    .min(1, 'Patient name is required')
    .min(2, 'Name must be at least 2 characters'),
  patient_phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => /^\+?[\d\s-()]{7,15}$/.test(val),
      'Please enter a valid phone number'
    ),
  patient_email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  patient_age: z
    .number()
    .min(0, 'Age must be a positive number')
    .max(150, 'Please enter a valid age')
    .nullable()
    .optional(),
  patient_gender: z.string().optional(),
  symptoms: z
    .string()
    .max(1000, 'Symptoms description must not exceed 1000 characters')
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

// ============================================================
// Review Schema
// ============================================================
export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Please select a rating')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .max(1000, 'Review must not exceed 1000 characters')
    .optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;

// ============================================================
// Doctor Profile Schema (Admin / Doctor)
// ============================================================
export const doctorProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  phone: z.string().optional(),
  qualification: z
    .string()
    .min(1, 'Qualification is required'),
  experience_years: z
    .number()
    .min(0, 'Experience must be a positive number')
    .max(60, 'Please enter valid experience years'),
  bio: z.string().max(2000, 'Bio must not exceed 2000 characters').optional(),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  consultation_types: z
    .array(z.enum(['online', 'offline']))
    .min(1, 'Select at least one consultation type'),
  specialization_ids: z
    .array(z.string())
    .min(1, 'Select at least one specialization'),
  clinic_id: z.string().optional(),
});

export type DoctorProfileFormValues = z.infer<typeof doctorProfileSchema>;

// ============================================================
// Availability Slot Schema
// ============================================================
export const availabilitySlotSchema = z.object({
  day_of_week: z.enum([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  ]),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  slot_duration: z.number().min(10).max(120).default(30),
}).refine(
  (data) => data.start_time < data.end_time,
  { message: 'End time must be after start time', path: ['end_time'] }
);

export type AvailabilitySlotFormValues = z.infer<typeof availabilitySlotSchema>;
