import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Video,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, isBefore, parse, isToday as isTodayFn } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getDoctorById } from '@/hooks/useDoctors';
import { getClinicById } from '@/lib/clinic-service';
import { getDirectionsUrl } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import { bookingSchema, type BookingFormValues } from '@/lib/validators';
import { formatTime, generateAppointmentId, generateTimeSlots, getInitials } from '@/lib/utils';

import type { Doctor, DoctorAvailability } from '@/types/doctor';
import type { Clinic } from '@/types/clinic';
import type { ConsultationType, DayOfWeek } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Spinner from '@/components/common/Spinner';
import { cn } from '@/lib/utils';

type BookingStep = 'date' | 'time' | 'type' | 'details' | 'confirm';

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'date', label: 'Select Date' },
  { key: 'time', label: 'Select Time' },
  { key: 'type', label: 'Consultation' },
  { key: 'details', label: 'Your Details' },
  { key: 'confirm', label: 'Confirm' },
];

export default function BookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>('offline');
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string; available: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patient_name: user?.full_name || '',
      patient_email: user?.email || '',
      patient_phone: user?.phone || '',
      patient_age: null,
      patient_gender: '',
      symptoms: '',
      notes: '',
    },
  });

  // Pre-fill form from user profile
  useEffect(() => {
    if (user) {
      setValue('patient_name', user.full_name);
      setValue('patient_email', user.email);
      if (user.phone) setValue('patient_phone', user.phone);
    }
  }, [user, setValue]);

  // Load doctor & clinic
  useEffect(() => {
    async function load() {
      if (!doctorId) return;
      setIsLoadingDoctor(true);
      let doc = await getDoctorById(doctorId);

      const clinicId = new URLSearchParams(window.location.search).get('clinicId');
      if (clinicId) {
        const cl = await getClinicById(clinicId);
        setClinic(cl);
        if (!doc && cl && cl.doctors && cl.doctors.length > 0) {
          doc = cl.doctors.find((d) => d.id === doctorId) || cl.doctors[0];
        }
      }

      // If doctor has no availability schedules in database, provide standard working hours
      if (doc && (!doc.availability || doc.availability.length === 0)) {
        doc.availability = [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ].map((day) => ({
          id: `default-${day}-${doc.id}`,
          doctor_id: doc.id,
          day_of_week: day as DayOfWeek,
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: 30,
          is_active: true,
          created_at: new Date().toISOString(),
        }));
      }

      setDoctor(doc);

      // Get blocked dates
      const { data: blocked } = await supabase
        .from('blocked_dates')
        .select('blocked_date')
        .eq('doctor_id', doctorId)
        .gte('blocked_date', format(new Date(), 'yyyy-MM-dd'));

      if (blocked) {
        setBlockedDates(blocked.map((b) => b.blocked_date));
      }

      setIsLoadingDoctor(false);
    }
    load();
  }, [doctorId]);

  // Generate dates for next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'EEEE').toLowerCase() as DayOfWeek;

    // Check if doctor works this day
    const hasAvailability = doctor?.availability?.some(
      (a) => a.day_of_week === dayName && a.is_active
    );

    const isBlocked = blockedDates.includes(dateStr);

    return {
      date: dateStr,
      dayLabel: format(date, 'EEE'),
      dateLabel: format(date, 'MMM dd'),
      dayName,
      isAvailable: !!hasAvailability && !isBlocked,
      isToday: isTodayFn(date),
    };
  });

  // Load time slots for selected date
  useEffect(() => {
    async function loadSlots() {
      if (!selectedDate || !doctor?.availability) return;
      setIsLoadingSlots(true);

      const dayName = format(
        parse(selectedDate, 'yyyy-MM-dd', new Date()),
        'EEEE'
      ).toLowerCase() as DayOfWeek;

      const dayAvailability = doctor.availability.filter(
        (a) => a.day_of_week === dayName && a.is_active
      );

      if (dayAvailability.length === 0) {
        setAvailableSlots([]);
        setIsLoadingSlots(false);
        return;
      }

      // Generate all possible time slots
      let allSlots: { start: string; end: string }[] = [];
      dayAvailability.forEach((avail: DoctorAvailability) => {
        const slots = generateTimeSlots(
          avail.start_time.substring(0, 5),
          avail.end_time.substring(0, 5),
          avail.slot_duration
        );
        allSlots = [...allSlots, ...slots];
      });

      // Check which slots are already booked
      const { data: bookedSlots } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('doctor_id', doctor.id)
        .eq('appointment_date', selectedDate)
        .not('status', 'in', '("cancelled","no-show")');

      const bookedTimes = new Set(
        (bookedSlots || []).map((b) => b.start_time.substring(0, 5))
      );

      // Filter out past slots if today
      const now = new Date();
      const isDateToday = isTodayFn(parse(selectedDate, 'yyyy-MM-dd', new Date()));

      const slotsWithAvailability = allSlots.map((slot) => {
        let available = !bookedTimes.has(slot.start);

        if (isDateToday) {
          const slotTime = parse(slot.start, 'HH:mm', new Date());
          if (isBefore(slotTime, now)) {
            available = false;
          }
        }

        return { ...slot, available };
      });

      setAvailableSlots(slotsWithAvailability);
      setIsLoadingSlots(false);
    }

    loadSlots();
  }, [selectedDate, doctor]);

  // Handle booking submission
  const onSubmitBooking = async (formData: BookingFormValues) => {
    if (!doctor || !selectedDate || !selectedTime || !user) return;

    setIsSubmitting(true);
    try {
      const appointmentId = generateAppointmentId();

      // Ensure valid doctor UUID for foreign key in case of synthetic clinic doctor
      let targetDoctorId = doctor.id;
      if (doctor.id.startsWith('synth-')) {
        const { data: realDoc } = await supabase
          .from('doctors')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (realDoc?.id) {
          targetDoctorId = realDoc.id;
        }
      }

      const clinicInfo = clinic ? ` [Booked at: ${clinic.name}, ${clinic.address}]` : '';

      const { error: err } = await supabase
        .from('appointments')
        .insert({
          appointment_id: appointmentId,
          patient_id: user.id,
          doctor_id: targetDoctorId,
          appointment_date: selectedDate,
          start_time: selectedTime.start,
          end_time: selectedTime.end,
          consultation_type: consultationType,
          status: 'pending',
          patient_name: formData.patient_name,
          patient_phone: formData.patient_phone,
          patient_email: formData.patient_email,
          patient_age: formData.patient_age || null,
          patient_gender: formData.patient_gender || null,
          symptoms: formData.symptoms || null,
          notes: (formData.notes || '') + clinicInfo || null,
        });

      if (err) {
        if (err.message.includes('unique') || err.message.includes('duplicate')) {
          toast.error('Slot already booked', {
            description: 'This time slot was just booked by another patient. Please select a different time.',
          });
        } else {
          throw err;
        }
        return;
      }

      // Create notification for patient
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'appointment_confirmed',
        title: 'Appointment Booked',
        message: `Your appointment with ${doctor.full_name} on ${format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')} at ${formatTime(selectedTime.start)} has been booked. Appointment ID: ${appointmentId}`,
        data: { appointment_id: appointmentId },
      });

      // Create notification for doctor
      if (doctor.user_id) {
        await supabase.from('notifications').insert({
          user_id: doctor.user_id,
          type: 'appointment_confirmed',
          title: 'New Appointment Booked',
          message: `${formData.patient_name} booked an appointment for ${format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')} at ${formatTime(selectedTime.start)}. Appointment ID: ${appointmentId}`,
          data: { appointment_id: appointmentId },
        });
      }

      toast.success('Appointment booked!', {
        description: `Your appointment ID is ${appointmentId}`,
      });

      navigate(`/booking/success/${appointmentId}${clinic?.id ? `?clinicId=${clinic.id}` : ''}`);
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Booking failed', {
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const goNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) setCurrentStep(STEPS[nextIdx].key);
  };

  const goPrev = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) setCurrentStep(STEPS[prevIdx].key);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'date': return !!selectedDate;
      case 'time': return !!selectedTime;
      case 'type': return !!consultationType;
      case 'details': return true;
      default: return false;
    }
  };

  if (isLoadingDoctor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="py-12 container-app text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-surface-900 mb-2">Doctor Not Found</h2>
        <Link to="/doctors"><Button>Browse Doctors</Button></Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container-app max-w-4xl animate-fade-in">
        {/* Back */}
        <Link to={clinic ? `/clinics/${clinic.id}` : `/doctors/${doctor.id}`} className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to {clinic ? clinic.name : doctor.full_name}
        </Link>

        {/* Clinic info banner if booking at a clinic */}
        {clinic && (
          <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  Healthcare Facility
                </div>
                <h3 className="font-bold text-sm text-teal-950">{clinic.name}</h3>
                <p className="text-xs text-teal-800">{clinic.address}</p>
              </div>
            </div>

            <a
              href={getDirectionsUrl(clinic.latitude || 40.7128, clinic.longitude || -74.006)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-100/80 hover:bg-teal-200/80 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              Get Directions ↗
            </a>
          </div>
        )}

        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 mb-6">Book Appointment</h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2 shrink-0">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                i < stepIndex ? 'bg-primary-600 text-white' :
                i === stepIndex ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-400' :
                'bg-surface-100 text-surface-400'
              )}>
                {i < stepIndex ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block',
                i === stepIndex ? 'text-primary-700' : 'text-surface-400'
              )}>
                {step.label}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-surface-200" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              {/* Step: Date */}
              {currentStep === 'date' && (
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-primary-600" /> Select Date
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {availableDates.map((d) => (
                      <button
                        key={d.date}
                        disabled={!d.isAvailable}
                        onClick={() => { setSelectedDate(d.date); setSelectedTime(null); }}
                        className={cn(
                          'p-3 rounded-xl text-center transition-all cursor-pointer border',
                          selectedDate === d.date
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                            : d.isAvailable
                            ? 'bg-white border-surface-200 hover:border-primary-300 hover:bg-primary-50'
                            : 'bg-surface-50 border-surface-100 text-surface-300 cursor-not-allowed'
                        )}
                      >
                        <p className="text-xs font-medium">{d.dayLabel}</p>
                        <p className={cn('text-sm font-bold', selectedDate === d.date ? 'text-white' : d.isAvailable ? 'text-surface-800' : 'text-surface-300')}>
                          {d.dateLabel}
                        </p>
                        {d.isToday && <p className="text-[10px] mt-0.5">Today</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step: Time */}
              {currentStep === 'time' && (
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-primary-600" /> Select Time Slot
                  </h2>
                  {isLoadingSlots ? (
                    <div className="flex justify-center py-8"><Spinner /></div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-surface-500 text-center py-8">No available slots for this date.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.start}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            'px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border',
                            selectedTime?.start === slot.start
                              ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                              : slot.available
                              ? 'bg-white border-surface-200 hover:border-primary-300 hover:bg-primary-50 text-surface-700'
                              : 'bg-surface-50 border-surface-100 text-surface-300 cursor-not-allowed line-through'
                          )}
                        >
                          {formatTime(slot.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Consultation Type */}
              {currentStep === 'type' && (
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 mb-4">Consultation Type</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {doctor.consultation_types.includes('offline') && (
                      <button
                        onClick={() => setConsultationType('offline')}
                        className={cn(
                          'p-5 rounded-xl border-2 text-left transition-all cursor-pointer',
                          consultationType === 'offline'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-surface-200 hover:border-primary-300'
                        )}
                      >
                        <Building2 size={28} className={consultationType === 'offline' ? 'text-primary-600' : 'text-surface-400'} />
                        <h3 className="text-lg font-semibold text-surface-900 mt-3">In-Person</h3>
                        <p className="text-sm text-surface-500 mt-1">Visit the clinic for your consultation</p>
                      </button>
                    )}
                    {doctor.consultation_types.includes('online') && (
                      <button
                        onClick={() => setConsultationType('online')}
                        className={cn(
                          'p-5 rounded-xl border-2 text-left transition-all cursor-pointer',
                          consultationType === 'online'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-surface-200 hover:border-primary-300'
                        )}
                      >
                        <Video size={28} className={consultationType === 'online' ? 'text-primary-600' : 'text-surface-400'} />
                        <h3 className="text-lg font-semibold text-surface-900 mt-3">Online</h3>
                        <p className="text-sm text-surface-500 mt-1">Video consultation from home</p>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Step: Patient Details */}
              {currentStep === 'details' && (
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <User size={20} className="text-primary-600" /> Patient Details
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Full Name *" error={errors.patient_name?.message} {...register('patient_name')} />
                      <Input label="Email *" type="email" error={errors.patient_email?.message} {...register('patient_email')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input label="Phone *" type="tel" error={errors.patient_phone?.message} {...register('patient_phone')} />
                      <Input label="Age" type="number" {...register('patient_age', { valueAsNumber: true })} />
                      <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Gender</label>
                        <select {...register('patient_gender')} className="w-full px-4 py-2.5 rounded-lg border border-surface-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">Symptoms / Reason for Visit</label>
                      <textarea {...register('symptoms')} rows={3} placeholder="Describe your symptoms or reason..." className="w-full px-4 py-2.5 rounded-lg border border-surface-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">Additional Notes</label>
                      <textarea {...register('notes')} rows={2} placeholder="Any additional information..." className="w-full px-4 py-2.5 rounded-lg border border-surface-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Confirm */}
              {currentStep === 'confirm' && (
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-primary-600" /> Confirm Booking
                  </h2>
                  <div className="space-y-4 text-sm">
                    <div className="bg-surface-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between"><span className="text-surface-500">Doctor</span><span className="font-medium text-surface-800">{doctor.full_name}</span></div>
                      <div className="flex justify-between"><span className="text-surface-500">Date</span><span className="font-medium text-surface-800">{format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM dd, yyyy')}</span></div>
                      <div className="flex justify-between"><span className="text-surface-500">Time</span><span className="font-medium text-surface-800">{selectedTime ? formatTime(selectedTime.start) + ' - ' + formatTime(selectedTime.end) : ''}</span></div>
                      <div className="flex justify-between"><span className="text-surface-500">Consultation</span><span className="font-medium text-surface-800 capitalize">{consultationType === 'offline' ? 'In-Person' : 'Online'}</span></div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-xs">
                      <strong>Note:</strong> By confirming, you agree to the appointment terms. Please arrive on time or join the video call at the scheduled time.
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-4 border-t border-surface-100">
                <Button variant="ghost" onClick={goPrev} disabled={stepIndex === 0}>
                  <ArrowLeft size={16} /> Back
                </Button>
                {currentStep === 'confirm' ? (
                  <Button
                    onClick={handleSubmit(onSubmitBooking)}
                    isLoading={isSubmitting}
                    size="lg"
                  >
                    <CheckCircle2 size={18} /> Confirm Booking
                  </Button>
                ) : (
                  <Button onClick={currentStep === 'details' ? handleSubmit(() => goNext()) : goNext} disabled={!canGoNext()}>
                    Next <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar: Doctor Info */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                  {doctor.photo_url ? (
                    <img src={doctor.photo_url} alt={doctor.full_name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    getInitials(doctor.full_name)
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 text-sm">{doctor.full_name}</h3>
                  <p className="text-xs text-primary-600">{doctor.qualification}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {doctor.specializations?.map((s) => (
                  <Badge key={s.id} size="sm" variant="outline">{s.name}</Badge>
                ))}
              </div>
            </Card>

            {/* Selection Summary */}
            {(selectedDate || selectedTime) && (
              <Card className="bg-primary-50 border-primary-200">
                <h4 className="text-sm font-semibold text-primary-800 mb-2">Your Selection</h4>
                <div className="space-y-1 text-sm text-primary-700">
                  {selectedDate && (
                    <p className="flex items-center gap-2">
                      <Calendar size={14} /> {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}
                    </p>
                  )}
                  {selectedTime && (
                    <p className="flex items-center gap-2">
                      <Clock size={14} /> {formatTime(selectedTime.start)}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
