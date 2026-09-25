import type { Doctor } from './doctor';

export type ClinicOpeningStatus = 'open' | 'limited' | 'closed';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_status?: ClinicOpeningStatus;
  opening_hours?: string | null;
  services?: string[];
  image_url?: string | null;
  has_emergency?: boolean;
  is_24_7?: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Computed / joined fields
  distance_km?: number;
  doctor_count?: number;
  doctors?: Doctor[];
  has_doctor_available_now?: boolean;
  rating?: number;
  review_count?: number;
}

export interface ClinicFilters {
  search: string;
  radiusKm: number; // 2, 5, 10, 25, 50, or Infinity
  openNowOnly: boolean;
  doctorAvailableNowOnly: boolean;
  emergencyOnly: boolean;
  specialization: string;
  service: string;
  onlineConsultation: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'geolocation' | 'manual' | 'preset' | 'default';
  addressName?: string;
}

export type GeolocationStatus =
  | 'idle'
  | 'prompt'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';
