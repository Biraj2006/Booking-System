import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Doctor, DoctorFormData } from '@/types/doctor';

/**
 * Generate a secure, user-friendly initial password for new doctor accounts
 */
export function generateTemporaryPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';

  let password = '';
  for (let i = 0; i < 6; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  for (let i = 0; i < 2; i++) {
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  }
  return password;
}

/**
 * Create an isolated Supabase client without session persistence.
 * This guarantees the Admin's current session in localStorage is NEVER touched.
 */
function getIsolatedAuthClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Admin: Add a new doctor
 */
export async function createDoctorAccount(formData: DoctorFormData): Promise<{
  doctor: Doctor | null;
  temporaryPassword?: string;
  error: Error | null;
}> {
  try {
    const email = formData.email.trim().toLowerCase();
    const temporaryPassword = formData.password || generateTemporaryPassword();

    // 1. Check if doctor already exists in doctors table
    const { data: existingDoc } = await supabase
      .from('doctors')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingDoc) {
      throw new Error(`A doctor with email "${email}" already exists.`);
    }

    // 2. Check if a profile already exists for this email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;

      // Update their role to doctor
      const { error: roleErr } = await supabase
        .from('profiles')
        .update({
          role: 'doctor',
          full_name: formData.full_name,
          phone: formData.phone || undefined,
        })
        .eq('id', userId);

      if (roleErr) throw roleErr;
    } else {
      // 3. Create auth user using isolated client
      const isolatedClient = getIsolatedAuthClient();
      const { data: authData, error: authError } = await isolatedClient.auth.signUp({
        email,
        password: temporaryPassword,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'doctor',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create authentication user.');

      userId = authData.user.id;

      // Wait a short moment for the DB trigger to create the profile row
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Ensure profile role is explicitly 'doctor'
      await supabase
        .from('profiles')
        .update({
          role: 'doctor',
          full_name: formData.full_name,
          phone: formData.phone || undefined,
        })
        .eq('id', userId);
    }

    // 4. Get default clinic id if available
    const { data: clinicData } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .maybeSingle();

    // 5. Insert record into doctors table
    const isApproved = formData.status === 'approved';
    const { data: newDoctor, error: doctorErr } = await supabase
      .from('doctors')
      .insert({
        user_id: userId,
        full_name: formData.full_name,
        email,
        phone: formData.phone || null,
        qualification: 'Medical Doctor', // Default for DB constraint
        experience_years: formData.experience_years || 0,
        department: formData.department || 'General Medicine',
        consultation_fee: formData.consultation_fee || 0,
        status: formData.status,
        is_verified: isApproved,
        is_active: true,
        clinic_id: clinicData?.id || null,
      })
      .select('*, clinic:clinics(*)')
      .single();

    if (doctorErr) throw doctorErr;

    // 6. Link specialization
    if (formData.specialization_id && newDoctor) {
      await supabase
        .from('doctor_specializations')
        .insert({
          doctor_id: newDoctor.id,
          specialization_id: formData.specialization_id,
        })
        .select();
    }

    // 7. Insert initial recurring availability slots
    if (formData.working_days && formData.working_days.length > 0 && newDoctor) {
      const slots = formData.working_days.map((day) => ({
        doctor_id: newDoctor.id,
        day_of_week: day,
        start_time: formData.start_time || '09:00',
        end_time: formData.end_time || '17:00',
        slot_duration: formData.slot_duration || 30,
        is_active: true,
      }));

      await supabase.from('doctor_availability').insert(slots);
    }

    // 8. Send welcome notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: isApproved ? 'doctor_verified' : 'system',
      title: isApproved ? 'Doctor Account Created' : 'Doctor Registration Pending',
      message: isApproved
        ? 'Your doctor account is active. You can log in and manage your schedule in the Doctor Portal.'
        : 'Your doctor registration is pending review by the clinic administrator.',
    });

    return {
      doctor: newDoctor as Doctor,
      temporaryPassword,
      error: null,
    };
  } catch (err: unknown) {
    console.error('Error creating doctor account:', err);
    let errMsg = err instanceof Error ? err.message : 'Failed to create doctor';
    if (errMsg.toLowerCase().includes('confirmation email')) {
      errMsg = 'Supabase Email Rate Limit: Please turn OFF "Confirm email" in Supabase Dashboard (Authentication > Providers > Email) so doctors are registered instantly without email verification.';
    }
    return {
      doctor: null,
      error: new Error(errMsg),
    };
  }
}

/**
 * Admin: Update an existing doctor
 */
export async function updateDoctorDetails(
  doctorId: string,
  userId: string,
  updates: Partial<DoctorFormData>
): Promise<{ error: Error | null }> {
  try {
    const isApproved = updates.status === 'approved';

    // 1. Update doctors table
    const doctorUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.full_name !== undefined) doctorUpdates.full_name = updates.full_name;
    if (updates.phone !== undefined) doctorUpdates.phone = updates.phone;
    if (updates.experience_years !== undefined) doctorUpdates.experience_years = updates.experience_years;
    if (updates.department !== undefined) doctorUpdates.department = updates.department;
    if (updates.consultation_fee !== undefined) doctorUpdates.consultation_fee = updates.consultation_fee;
    if (updates.status !== undefined) {
      doctorUpdates.status = updates.status;
      if (isApproved) {
        doctorUpdates.is_verified = true;
      }
    }

    const { error: docErr } = await supabase
      .from('doctors')
      .update(doctorUpdates)
      .eq('id', doctorId);

    if (docErr) throw docErr;

    // 2. Update user profile
    if (userId) {
      const profileUpdates: Record<string, unknown> = {};
      if (updates.full_name) profileUpdates.full_name = updates.full_name;
      if (updates.phone) profileUpdates.phone = updates.phone;
      if (isApproved) profileUpdates.role = 'doctor';

      if (Object.keys(profileUpdates).length > 0) {
        await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);
      }
    }

    // 3. Update specialization if changed
    if (updates.specialization_id) {
      // Remove old specializations
      await supabase
        .from('doctor_specializations')
        .delete()
        .eq('doctor_id', doctorId);

      // Insert new specialization
      await supabase
        .from('doctor_specializations')
        .insert({
          doctor_id: doctorId,
          specialization_id: updates.specialization_id,
        });
    }

    return { error: null };
  } catch (err: unknown) {
    console.error('Error updating doctor details:', err);
    return {
      error: err instanceof Error ? err : new Error('Failed to update doctor'),
    };
  }
}

/**
 * Admin: Approve a pending doctor
 */
export async function approveDoctor(doctorId: string): Promise<{ error: Error | null }> {
  try {
    // Try RPC first (defined in migration 004)
    const { error: rpcErr } = await supabase.rpc('admin_approve_doctor', {
      doctor_row_id: doctorId,
    });

    if (rpcErr) {
      // Fallback to direct client update if RPC isn't applied yet
      const { data: doc } = await supabase
        .from('doctors')
        .select('user_id')
        .eq('id', doctorId)
        .single();

      await supabase
        .from('doctors')
        .update({ status: 'approved', is_verified: true, is_active: true })
        .eq('id', doctorId);

      if (doc?.user_id) {
        await supabase
          .from('profiles')
          .update({ role: 'doctor' })
          .eq('id', doc.user_id);

        await supabase.from('notifications').insert({
          user_id: doc.user_id,
          type: 'doctor_verified',
          title: 'Doctor Account Approved',
          message: 'Your doctor account has been approved. You now have access to the Doctor Portal.',
        });
      }
    }

    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to approve doctor') };
  }
}

/**
 * Admin: Reject a doctor application
 */
export async function rejectDoctor(doctorId: string): Promise<{ error: Error | null }> {
  try {
    const { error: rpcErr } = await supabase.rpc('admin_reject_doctor', {
      doctor_row_id: doctorId,
    });

    if (rpcErr) {
      await supabase
        .from('doctors')
        .update({ status: 'rejected', is_active: false })
        .eq('id', doctorId);
    }

    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to reject doctor') };
  }
}

/**
 * Admin: Toggle Active / Inactive
 */
export async function toggleDoctorActive(doctorId: string, isActive: boolean): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('doctors')
      .update({ is_active: !isActive })
      .eq('id', doctorId);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to toggle doctor active status') };
  }
}
