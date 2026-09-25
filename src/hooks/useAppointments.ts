import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentFilters } from '@/types/appointment';
import type { AppointmentStatus } from '@/types';

export function useAppointments(userId?: string, role?: 'patient' | 'doctor') {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (filters?: Partial<AppointmentFilters>) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(
            id, full_name, photo_url, qualification, email, phone,
            clinic:clinics(name, address)
          ),
          patient:profiles!appointments_patient_id_fkey(
            id, full_name, email, phone, avatar_url
          )
        `);

      // Role-based filter
      if (role === 'patient') {
        query = query.eq('patient_id', userId);
      } else if (role === 'doctor') {
        // Get doctor record ID for this user
        const { data: docData } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();
        if (docData) {
          query = query.eq('doctor_id', docData.id);
        }
      }

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('appointment_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('appointment_date', filters.date_to);
      }

      query = query.order('appointment_date', { ascending: true })
                    .order('start_time', { ascending: true });

      const { data, error: err } = await query;
      if (err) throw err;
      setAppointments((data as Appointment[]) || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, role]);

  // Cancel appointment
  const cancelAppointment = async (
    appointmentId: string,
    reason: string,
    cancelledBy: string
  ): Promise<{ error: Error | null }> => {
    try {
      const { error: err } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled' as AppointmentStatus,
          cancellation_reason: reason,
          cancelled_by: cancelledBy,
        })
        .eq('id', appointmentId);
      if (err) throw err;

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: 'cancelled', cancellation_reason: reason } : a
        )
      );
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Update appointment status (doctor: complete, no-show)
  const updateStatus = async (
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<{ error: Error | null }> => {
    try {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error: err } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId);
      if (err) throw err;

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, ...updates } as Appointment : a))
      );
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
    cancelAppointment,
    updateStatus,
  };
}
