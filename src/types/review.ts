// ============================================================
// Review
// ============================================================
export interface Review {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  patient_avatar?: string | null;
}
