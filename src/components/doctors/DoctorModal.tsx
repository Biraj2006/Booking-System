import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Clock, Key } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { createDoctorAccount, updateDoctorDetails, generateTemporaryPassword } from '@/lib/doctor-service';
import type { Doctor, DoctorFormData, Specialization } from '@/types/doctor';
import type { DayOfWeek } from '@/types';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doctor: Doctor, temporaryPassword?: string) => void;
  doctorToEdit?: Doctor | null;
  specializations: Specialization[];
}

const COMMON_DEPARTMENTS = [
  'General Medicine',
  'Cardiology & Heart Center',
  'Dermatology & Skin Clinic',
  'Pediatrics & Child Health',
  'Orthopedics & Joint Clinic',
  'Neurology & Brain Sciences',
  'Emergency & Urgent Care',
  'Ophthalmology & Eye Care',
  'ENT & Audiology',
  'Psychiatry & Behavioral Health',
  'Women’s Health & Gynecology',
];

export default function DoctorModal({
  isOpen,
  onClose,
  onSuccess,
  doctorToEdit,
  specializations,
}: DoctorModalProps) {
  const isEditing = Boolean(doctorToEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [customPassword, setCustomPassword] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DoctorFormData>({
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      specialization_id: specializations[0]?.id || '',
      experience_years: 5,
      department: 'General Medicine',
      consultation_fee: 50,
      status: 'approved',
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      start_time: '09:00',
      end_time: '17:00',
      slot_duration: 30,
    },
  });

  // Reset / populate form on open or doctorToEdit change
  useEffect(() => {
    if (isOpen) {
      if (doctorToEdit) {
        reset({
          full_name: doctorToEdit.full_name || '',
          email: doctorToEdit.email || '',
          phone: doctorToEdit.phone || '',
          specialization_id: doctorToEdit.specializations?.[0]?.id || specializations[0]?.id || '',
          experience_years: doctorToEdit.experience_years || 0,
          department: doctorToEdit.department || 'General Medicine',
          consultation_fee: doctorToEdit.consultation_fee || 0,
          status: doctorToEdit.status || (doctorToEdit.is_verified ? 'approved' : 'pending'),
          working_days: [],
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: 30,
        });
      } else {
        const autoPass = generateTemporaryPassword();
        setCustomPassword(autoPass);
        reset({
          full_name: '',
          email: '',
          phone: '',
          specialization_id: specializations[0]?.id || '',
          experience_years: 5,
          department: 'General Medicine',
          consultation_fee: 50,
          status: 'approved',
          working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: 30,
          password: autoPass,
        });
        setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        setStartTime('09:00');
        setEndTime('17:00');
        setSlotDuration(30);
      }
    }
  }, [isOpen, doctorToEdit, reset, specializations]);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onSubmit = async (data: DoctorFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && doctorToEdit) {
        const { error } = await updateDoctorDetails(doctorToEdit.id, doctorToEdit.user_id, {
          full_name: data.full_name,
          phone: data.phone,
          specialization_id: data.specialization_id,
          experience_years: Number(data.experience_years),
          department: data.department,
          consultation_fee: Number(data.consultation_fee),
          status: data.status,
        });

        if (error) throw error;

        toast.success('Doctor updated successfully');
        onSuccess({
          ...doctorToEdit,
          full_name: data.full_name,
          phone: data.phone,
          experience_years: Number(data.experience_years),
          department: data.department,
          consultation_fee: Number(data.consultation_fee),
          status: data.status,
        });
        onClose();
      } else {
        // Adding new doctor
        const payload: DoctorFormData = {
          ...data,
          experience_years: Number(data.experience_years),
          consultation_fee: Number(data.consultation_fee),
          working_days: selectedDays,
          start_time: startTime,
          end_time: endTime,
          slot_duration: Number(slotDuration),
          password: customPassword || undefined,
        };

        const { doctor, temporaryPassword, error } = await createDoctorAccount(payload);
        if (error) throw error;
        if (!doctor) throw new Error('Doctor creation returned empty response');

        toast.success('Doctor added successfully!');
        onSuccess(doctor, temporaryPassword);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save doctor.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Doctor' : 'Add Doctor'}
      description={
        isEditing
          ? 'Update doctor information and clinical practice details.'
          : 'Create a new doctor account with access to the Doctor Portal.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            placeholder="Dr. Jane Smith"
            error={errors.full_name?.message}
            {...register('full_name', { required: 'Full name is required' })}
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="doctor@medicare.com"
            disabled={isEditing}
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />
        </div>

        {/* Phone & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1-555-0199"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">
              Department *
            </label>
            <input
              type="text"
              list="department-options"
              placeholder="e.g. Cardiology"
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              {...register('department', { required: 'Department is required' })}
            />
            <datalist id="department-options">
              {COMMON_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
            {errors.department && (
              <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>
            )}
          </div>
        </div>

        {/* Specialization & Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">
              Specialization *
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              {...register('specialization_id', { required: 'Specialization is required' })}
            >
              {specializations.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Years of Experience *"
            type="number"
            min={0}
            max={60}
            placeholder="5"
            error={errors.experience_years?.message}
            {...register('experience_years', {
              required: 'Experience is required',
              min: { value: 0, message: 'Must be 0 or more' },
            })}
          />
        </div>

        {/* Consultation Fee & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Consultation Fee ($) *"
            type="number"
            min={0}
            step="0.01"
            placeholder="50.00"
            error={errors.consultation_fee?.message}
            {...register('consultation_fee', {
              required: 'Consultation fee is required',
              min: { value: 0, message: 'Must be positive' },
            })}
          />

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1.5">
              Status *
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              {...register('status')}
            >
              <option value="approved">Approved (Active access to portal)</option>
              <option value="pending">Pending (Awaiting approval)</option>
              {isEditing && <option value="rejected">Rejected</option>}
            </select>
          </div>
        </div>

        {/* Initial Availability (Only on Creation) */}
        {!isEditing && (
          <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 space-y-3">
            <div className="flex items-center gap-2 text-surface-800 font-semibold text-sm">
              <Clock size={16} className="text-primary-600" />
              <span>Initial Weekly Availability Schedule</span>
            </div>

            {/* Days selection */}
            <div>
              <p className="text-xs text-surface-500 mb-2">Select Working Days:</p>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-100'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Working Hours */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-surface-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs text-surface-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs text-surface-600 mb-1">Slot Duration</label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-300 bg-white"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Initial Password on Creation */}
        {!isEditing && (
          <div className="p-3.5 bg-primary-50/50 rounded-xl border border-primary-200/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-primary-900">
                <Key size={14} className="text-primary-700" />
                <span>Initial Doctor Password</span>
              </label>
              <button
                type="button"
                onClick={() => setCustomPassword(generateTemporaryPassword())}
                className="text-xs text-primary-700 hover:text-primary-900 underline font-medium cursor-pointer"
              >
                Regenerate
              </button>
            </div>
            <input
              type="text"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              className="w-full px-3.5 py-2 font-mono text-sm rounded-lg border border-primary-300 bg-white text-surface-800"
              placeholder="Temporary password"
            />
            <p className="text-[11px] text-surface-500 mt-1">
              You will also see this password after creation to easily copy and provide to the doctor.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-surface-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Add Doctor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
