import { format, parseISO, isToday, isTomorrow, isPast, addMinutes, parse } from 'date-fns';
import type { AppointmentStatus } from '@/types';

// ============================================================
// Date Formatting
// ============================================================
export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatTime(time: string): string {
  // Converts "14:30" to "2:30 PM"
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
}

export function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} at ${formatTime(time)}`;
}

export function getRelativeDate(date: string): string {
  const d = parseISO(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return formatDate(date, 'EEE, MMM dd');
}

export function isDatePast(date: string): boolean {
  return isPast(parseISO(date));
}

// ============================================================
// Time Slot Generation
// ============================================================
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number = 30
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const baseDate = new Date('2000-01-01');
  let current = parse(startTime, 'HH:mm', baseDate);
  const end = parse(endTime, 'HH:mm', baseDate);

  while (current < end) {
    const slotEnd = addMinutes(current, durationMinutes);
    if (slotEnd <= end) {
      slots.push({
        start: format(current, 'HH:mm'),
        end: format(slotEnd, 'HH:mm'),
      });
    }
    current = slotEnd;
  }

  return slots;
}

// ============================================================
// Appointment ID Generator
// ============================================================
export function generateAppointmentId(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `APT-${date}-${random}`;
}

// ============================================================
// Class Name Helper (simplified cn utility)
// ============================================================
export function cn(...classes: (string | boolean | undefined | null | number)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================
// Status Helpers
// ============================================================
export function canCancelAppointment(status: AppointmentStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

export function canRescheduleAppointment(status: AppointmentStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

export function canCompleteAppointment(status: AppointmentStatus): boolean {
  return status === 'confirmed';
}

export function canReviewAppointment(status: AppointmentStatus): boolean {
  return status === 'completed';
}

// ============================================================
// Validation Helpers
// ============================================================
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s-()]{7,15}$/.test(phone);
}

// ============================================================
// Truncation
// ============================================================
export function truncate(str: string, length: number = 100): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

// ============================================================
// Capitalize
// ============================================================
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// Debounce
// ============================================================
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================
// Get initials from name
// ============================================================
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
