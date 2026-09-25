import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Doctor, DoctorFilters, Specialization } from '@/types/doctor';

const defaultFilters: DoctorFilters = {
  search: '',
  specialization: '',
  consultation_type: '',
  availability: '',
  min_experience: null,
  max_experience: null,
  is_verified: null,
};

// Standalone fetcher so individual pages don't need to load all doctors
export async function getDoctorById(id: string): Promise<Doctor | null> {
  try {
    const { data, error: err } = await supabase
      .from('doctors')
      .select(`
        *,
        clinic:clinics(*),
        doctor_specializations(
          specialization:specializations(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (err) throw err;
    if (!data) return null;

    // Get availability
    const { data: availability } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', id)
      .eq('is_active', true)
      .order('day_of_week');

    // Get rating (use maybeSingle so 0 reviews does not throw PGRST116)
    const { data: rating } = await supabase
      .from('doctor_ratings')
      .select('*')
      .eq('doctor_id', id)
      .maybeSingle();

    const doctor: Doctor = {
      ...data,
      specializations: data.doctor_specializations
        ?.map((ds: { specialization: Specialization }) => ds.specialization)
        .filter(Boolean) || [],
      availability: availability || [],
      average_rating: rating?.average_rating || 0,
      total_reviews: rating?.total_reviews || 0,
    };

    return doctor;
  } catch (err) {
    console.error('Error fetching doctor:', err);
    return null;
  }
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [filters, setFilters] = useState<DoctorFilters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch specializations
  const fetchSpecializations = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('specializations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (err) throw err;
      setSpecializations(data || []);
    } catch (err) {
      console.error('Error fetching specializations:', err);
    }
  }, []);

  // Fetch doctors with filters
  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Base query
      let query = supabase
        .from('doctors')
        .select(`
          *,
          clinic:clinics(*),
          doctor_specializations(
            specialization:specializations(*)
          )
        `)
        .eq('is_active', true)
        .eq('is_verified', true);

      // Search filter
      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,qualification.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Experience filter
      if (filters.min_experience !== null) {
        query = query.gte('experience_years', filters.min_experience);
      }
      if (filters.max_experience !== null) {
        query = query.lte('experience_years', filters.max_experience);
      }

      // Consultation type filter
      if (filters.consultation_type) {
        query = query.contains('consultation_types', [filters.consultation_type]);
      }

      query = query.order('full_name');

      const { data, error: err } = await query;
      if (err) throw err;

      // Transform the data to flatten specializations
      let transformedDoctors: Doctor[] = (data || []).map((doc) => ({
        ...doc,
        specializations: doc.doctor_specializations
          ?.map((ds: { specialization: Specialization }) => ds.specialization)
          .filter(Boolean) || [],
      }));

      // Filter by specialization (client-side since it's a join)
      if (filters.specialization) {
        transformedDoctors = transformedDoctors.filter((doc) =>
          doc.specializations?.some((s) => s.id === filters.specialization)
        );
      }

      // Fetch ratings for each doctor
      const { data: ratings } = await supabase
        .from('doctor_ratings')
        .select('*');

      if (ratings) {
        const ratingMap = new Map(ratings.map((r) => [r.doctor_id, r]));
        transformedDoctors = transformedDoctors.map((doc) => {
          const rating = ratingMap.get(doc.id);
          return {
            ...doc,
            average_rating: rating?.average_rating || 0,
            total_reviews: rating?.total_reviews || 0,
          };
        });
      }

      setDoctors(transformedDoctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchDoctorById = useCallback(getDoctorById, []);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return {
    doctors,
    specializations,
    filters,
    setFilters,
    isLoading,
    error,
    refetch: fetchDoctors,
    fetchDoctorById,
    resetFilters: () => setFilters(defaultFilters),
  };
}
