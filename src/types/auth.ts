import type { UserRole, Gender } from './index';

// ============================================================
// Profile — extends Supabase auth.users
// ============================================================
export interface Profile {
  id: string; // matches auth.users.id
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Auth State
// ============================================================
export interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ============================================================
// Registration Payload
// ============================================================
export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
}

// ============================================================
// Login Payload
// ============================================================
export interface LoginPayload {
  email: string;
  password: string;
}
