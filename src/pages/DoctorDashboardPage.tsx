import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle2, Users,
  Video, Building2, AlertTriangle, Plus, Trash2,
  XCircle, Stethoscope, DollarSign, User,
  Mail, Phone, Shield, Ban, Check, Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { supabase } from '@/lib/supabase';
import { APPOINTMENT_STATUS_CONFIG, DAYS_OF_WEEK } from '@/lib/constants';
import { formatTime, getInitials, formatDate } from '@/lib/utils';
import type { Appointment } from '@/types/appointment';
import type { AppointmentStatus, DayOfWeek } from '@/types';
import type { Doctor, DoctorAvailability, BlockedDate, Specialization } from '@/types/doctor';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AppointmentDetailsModal from '@/components/doctors/AppointmentDetailsModal';

type DoctorView = 'dashboard' | 'appointments' | 'patients' | 'availability' | 'profile';

export default function DoctorDashboardPage() {
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const { appointments, isLoading: isLoadingAppointments, updateStatus, refetch: refetchAppointments } =
    useAppointments(user?.id, 'doctor');

  const [activeView, setActiveView] = useState<DoctorView>(() => {
    if (location.pathname.includes('appointments')) return 'appointments';
    if (location.pathname.includes('patients')) return 'patients';
    if (location.pathname.includes('availability')) return 'availability';
    if (location.pathname.includes('profile')) return 'profile';
    return 'dashboard';
  });

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [doctorRating, setDoctorRating] = useState<{ average_rating: number; total_reviews: number }>({ average_rating: 0, total_reviews: 0 });
  const [doctorReviews, setDoctorReviews] = useState<Array<{ id: string; rating: number; comment: string | null; created_at: string; patient_name?: string }>>([]);

  // Appointments filter & modal states
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | AppointmentStatus>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedAptAction, setSelectedAptAction] = useState<{
    id: string;
    status: AppointmentStatus;
    title: string;
    message: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Availability state
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 'monday' as DayOfWeek,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 30,
  });
  const [newBlockedDate, setNewBlockedDate] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  // Profile Edit state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    specialization_id: '',
    department: '',
    experience_years: 0,
    consultation_fee: 0,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync active view with route
  useEffect(() => {
    if (location.pathname.includes('appointments')) setActiveView('appointments');
    else if (location.pathname.includes('patients')) setActiveView('patients');
    else if (location.pathname.includes('availability')) setActiveView('availability');
    else if (location.pathname.includes('profile')) setActiveView('profile');
    else if (location.pathname.includes('dashboard')) setActiveView('dashboard');
  }, [location.pathname]);

  // Load doctor record, availability, and specializations
  const loadDoctorData = useCallback(async () => {
    if (!user) return;
    setIsLoadingDoctor(true);
    try {
      // 1. Fetch Doctor with clinic and specializations
      const { data: docData, error: docErr } = await supabase
        .from('doctors')
        .select(`
          *,
          clinic:clinics(*),
          doctor_specializations(
            specialization:specializations(*)
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (docErr) throw docErr;

      if (docData) {
        const transformedDoctor: Doctor = {
          ...docData,
          status: docData.status || (docData.is_verified ? 'approved' : 'pending'),
          specializations: docData.doctor_specializations
            ?.map((ds: any) => ds.specialization)
            .filter(Boolean) || [],
        };

        setDoctor(transformedDoctor);
        setDoctorId(transformedDoctor.id);

        setProfileForm({
          full_name: transformedDoctor.full_name || user.full_name || '',
          phone: transformedDoctor.phone || user.phone || '',
          specialization_id: transformedDoctor.specializations?.[0]?.id || '',
          department: transformedDoctor.department || 'General Medicine',
          experience_years: transformedDoctor.experience_years || 0,
          consultation_fee: transformedDoctor.consultation_fee || 0,
        });

        // 2. Fetch Availability slots, blocked dates, specializations, rating & reviews
        setIsLoadingAvailability(true);
        const [availRes, blockedRes, specsRes, ratingRes, reviewsRes] = await Promise.all([
          supabase
            .from('doctor_availability')
            .select('*')
            .eq('doctor_id', transformedDoctor.id)
            .order('start_time'),
          supabase
            .from('blocked_dates')
            .select('*')
            .eq('doctor_id', transformedDoctor.id)
            .gte('blocked_date', format(new Date(), 'yyyy-MM-dd'))
            .order('blocked_date'),
          supabase
            .from('specializations')
            .select('*')
            .eq('is_active', true)
            .order('name'),
          supabase
            .from('doctor_ratings')
            .select('*')
            .eq('doctor_id', transformedDoctor.id)
            .maybeSingle(),
          supabase
            .from('reviews')
            .select(`
              id,
              rating,
              comment,
              created_at,
              patient:patient_id (full_name)
            `)
            .eq('doctor_id', transformedDoctor.id)
            .order('created_at', { ascending: false }),
        ]);

        setAvailability(availRes.data || []);
        setBlockedDates(blockedRes.data || []);
        setSpecializations((specsRes.data || []) as Specialization[]);

        if (ratingRes.data) {
          setDoctorRating({
            average_rating: ratingRes.data.average_rating || 0,
            total_reviews: ratingRes.data.total_reviews || 0,
          });
        }

        if (reviewsRes.data) {
          setDoctorReviews(
            reviewsRes.data.map((r: any) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              created_at: r.created_at,
              patient_name: r.patient?.full_name || 'Verified Patient',
            }))
          );
        }

        setIsLoadingAvailability(false);
      }
    } catch (err) {
      console.error('Error loading doctor data:', err);
      toast.error('Failed to load doctor profile.');
    } finally {
      setIsLoadingDoctor(false);
    }
  }, [user]);

  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

  // Appointment Calculations
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter((a) => a.appointment_date === today && a.status !== 'cancelled');
  const upcomingAppointments = appointments.filter((a) => a.appointment_date >= today && a.status === 'confirmed');
  const pendingRequests = appointments.filter((a) => a.status === 'pending');
  const completedAppointments = appointments.filter((a) => a.status === 'completed');

  // Unique Patients calculation
  const uniquePatientsMap = new Map<string, {
    patient_id: string;
    name: string;
    email: string;
    phone: string;
    gender?: string | null;
    age?: number;
    totalVisits: number;
    lastVisitDate: string;
    lastAppointment: Appointment;
  }>();

  appointments.forEach((apt) => {
    const existing = uniquePatientsMap.get(apt.patient_id);
    if (!existing) {
      uniquePatientsMap.set(apt.patient_id, {
        patient_id: apt.patient_id,
        name: apt.patient_name,
        email: apt.patient_email,
        phone: apt.patient_phone,
        gender: apt.patient_gender,
        age: apt.patient_age || undefined,
        totalVisits: 1,
        lastVisitDate: apt.appointment_date,
        lastAppointment: apt,
      });
    } else {
      existing.totalVisits += 1;
      if (apt.appointment_date > existing.lastVisitDate) {
        existing.lastVisitDate = apt.appointment_date;
        existing.lastAppointment = apt;
      }
    }
  });

  const uniquePatients = Array.from(uniquePatientsMap.values());

  // Handle Action Trigger (Accept, Reject, Complete, No-Show)
  const triggerStatusAction = (id: string, status: AppointmentStatus) => {
    const titles: Record<AppointmentStatus, string> = {
      confirmed: 'Accept Appointment Request',
      cancelled: 'Reject Appointment Request',
      completed: 'Complete Appointment',
      'no-show': 'Mark as Patient No-Show',
      pending: 'Set to Pending',
    };
    const messages: Record<AppointmentStatus, string> = {
      confirmed: 'Confirm and accept this appointment request? The patient will be notified.',
      cancelled: 'Are you sure you want to reject/cancel this appointment request?',
      completed: 'Mark this clinical consultation as completed?',
      'no-show': 'Mark this patient as a no-show for the scheduled slot?',
      pending: 'Reset status to pending?',
    };

    setRejectReason('');
    setSelectedAptAction({
      id,
      status,
      title: titles[status],
      message: messages[status],
    });
    setStatusDialogOpen(true);
  };

  // Perform Appointment Status Update
  const handleConfirmStatusUpdate = async () => {
    if (!selectedAptAction) return;
    setIsUpdating(true);
    try {
      const apt = appointments.find((a) => a.id === selectedAptAction.id);
      const { error } = await updateStatus(selectedAptAction.id, selectedAptAction.status);
      if (error) throw error;

      // If rejected/cancelled, store cancellation reason
      if (selectedAptAction.status === 'cancelled' && rejectReason.trim()) {
        await supabase
          .from('appointments')
          .update({
            cancellation_reason: rejectReason.trim(),
            cancelled_by: user?.id,
          })
          .eq('id', selectedAptAction.id);
      }

      // If completed, set completed_at timestamp
      if (selectedAptAction.status === 'completed') {
        await supabase
          .from('appointments')
          .update({
            completed_at: new Date().toISOString(),
          })
          .eq('id', selectedAptAction.id);
      }

      // Notify the Patient
      if (apt) {
        let notificationType: 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_completed' = 'appointment_confirmed';
        let notifTitle = 'Appointment Update';
        let notifMessage = `Your appointment (${apt.appointment_id}) has been updated.`;

        if (selectedAptAction.status === 'confirmed') {
          notificationType = 'appointment_confirmed';
          notifTitle = 'Appointment Request Accepted';
          notifMessage = `Dr. ${doctor?.full_name || 'Your doctor'} has confirmed your appointment for ${formatDate(apt.appointment_date)} at ${formatTime(apt.start_time)}.`;
        } else if (selectedAptAction.status === 'cancelled') {
          notificationType = 'appointment_cancelled';
          notifTitle = 'Appointment Request Declined';
          notifMessage = `Dr. ${doctor?.full_name || 'Your doctor'} was unable to accept your appointment (${apt.appointment_id}). ${rejectReason ? `Reason: ${rejectReason}` : ''}`;
        } else if (selectedAptAction.status === 'completed') {
          notificationType = 'appointment_completed';
          notifTitle = `Consultation Completed — Rate Dr. ${doctor?.full_name || 'Your Doctor'}`;
          notifMessage = `Your consultation with Dr. ${doctor?.full_name || 'your doctor'} on ${formatDate(apt.appointment_date)} has been marked as completed. Please share your rating and feedback!`;
        }

        await supabase.from('notifications').insert({
          user_id: apt.patient_id,
          type: notificationType,
          title: notifTitle,
          message: notifMessage,
          data: { appointment_id: apt.appointment_id, action: 'rate', doctor_id: doctorId },
        });
      }

      toast.success(`Appointment marked as ${selectedAptAction.status}`);
      refetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
      setStatusDialogOpen(false);
      setSelectedAptAction(null);
    }
  };

  // Add Availability Time Slot
  const addAvailabilitySlot = async () => {
    if (!doctorId) return;
    try {
      const { error } = await supabase.from('doctor_availability').insert({
        doctor_id: doctorId,
        day_of_week: newSlot.day_of_week,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        slot_duration: newSlot.slot_duration,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Time slot added!');
      // Refresh
      const { data } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('start_time');
      setAvailability(data || []);
    } catch (err) {
      toast.error('Failed to add slot. Please check that start time is before end time.');
      console.error(err);
    }
  };

  // Remove Availability Slot
  const removeSlot = async (slotId: string) => {
    try {
      await supabase.from('doctor_availability').delete().eq('id', slotId);
      setAvailability((prev) => prev.filter((a) => a.id !== slotId));
      toast.success('Slot removed');
    } catch {
      toast.error('Failed to remove slot');
    }
  };

  // Add Blocked Date
  const addBlockedDate = async () => {
    if (!doctorId || !newBlockedDate.date) return;
    try {
      const { error } = await supabase.from('blocked_dates').insert({
        doctor_id: doctorId,
        blocked_date: newBlockedDate.date,
        reason: newBlockedDate.reason || 'Doctor Unavailable',
      });
      if (error) throw error;
      toast.success('Date blocked successfully');
      setNewBlockedDate({ date: format(new Date(), 'yyyy-MM-dd'), reason: '' });
      const { data } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('blocked_date', format(new Date(), 'yyyy-MM-dd'))
        .order('blocked_date');
      setBlockedDates(data || []);
    } catch (err) {
      toast.error('Failed to block date');
      console.error(err);
    }
  };

  // Remove Blocked Date
  const removeBlockedDate = async (id: string) => {
    try {
      await supabase.from('blocked_dates').delete().eq('id', id);
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
      toast.success('Blocked date removed');
    } catch {
      toast.error('Failed to unblock date');
    }
  };

  // Save Doctor Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !user) return;
    setIsSavingProfile(true);
    try {
      // 1. Update doctors table
      const { error: docErr } = await supabase
        .from('doctors')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone || null,
          department: profileForm.department,
          experience_years: Number(profileForm.experience_years),
          consultation_fee: Number(profileForm.consultation_fee),
          updated_at: new Date().toISOString(),
        })
        .eq('id', doctorId);

      if (docErr) throw docErr;

      // 2. Update profiles table
      await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone || null,
        })
        .eq('id', user.id);

      // 3. Update specialization if changed
      if (profileForm.specialization_id) {
        await supabase.from('doctor_specializations').delete().eq('doctor_id', doctorId);
        await supabase.from('doctor_specializations').insert({
          doctor_id: doctorId,
          specialization_id: profileForm.specialization_id,
        });
      }

      toast.success('Profile updated successfully!');
      refreshProfile();
      loadDoctorData();
    } catch (err) {
      console.error('Error saving doctor profile:', err);
      toast.error('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const statusBadge = (status: AppointmentStatus) => {
    const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger', 'no-show': 'default',
    };
    return <Badge variant={variantMap[status] || 'default'}>{APPOINTMENT_STATUS_CONFIG[status]?.label || status}</Badge>;
  };

  // Filtered appointments for Appointments view
  const filteredAppointments = appointments.filter((a) => {
    if (appointmentFilter === 'all') return true;
    return a.status === appointmentFilter;
  });

  if (isLoadingDoctor || isLoadingAppointments) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const primarySpec = doctor?.specializations?.[0]?.name || 'Specialist';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Pending Approval / Inactive Alerts */}
      {doctor?.status === 'pending' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Application Pending Review</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Your doctor registration is awaiting administrator verification. While in pending status, patients cannot book new appointments with you. You can still set up your availability schedule and practice profile below.
            </p>
          </div>
        </div>
      )}

      {doctor && !doctor.is_active && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <Ban className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-red-900">Practice Profile Inactive</h4>
            <p className="text-xs text-red-700 mt-0.5">
              Your profile is currently deactivated by the hospital administration. You cannot accept new bookings until reactivated.
            </p>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
            {getInitials(doctor?.full_name || user?.full_name || 'Dr')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-surface-900">
                Welcome back, {doctor?.full_name || user?.full_name}
              </h1>
              {doctor?.is_verified && (
                <span title="Verified Doctor">
                  <Shield size={18} className="text-primary-600" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-surface-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                <Stethoscope size={13} /> {primarySpec}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 size={13} /> {doctor?.department || 'General Medicine'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-surface-700">
                <DollarSign size={13} /> ${Number(doctor?.consultation_fee || 0).toFixed(2)} / visit
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {doctorRating.average_rating > 0 ? doctorRating.average_rating.toFixed(1) : 'New'}{' '}
                <span className="text-surface-400 font-normal">({doctorRating.total_reviews} reviews)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick status badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              doctor?.status === 'approved'
                ? 'success'
                : doctor?.status === 'pending'
                ? 'warning'
                : 'danger'
            }
          >
            {doctor?.status?.toUpperCase() || 'APPROVED'}
          </Badge>
          <Badge variant={doctor?.is_active ? 'info' : 'default'}>
            {doctor?.is_active ? 'Accepting Patients' : 'Deactivated'}
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b border-surface-200 overflow-x-auto">
        {[
          { key: 'dashboard', label: 'Overview', icon: <Calendar size={16} /> },
          {
            key: 'appointments',
            label: `All Appointments (${appointments.length})`,
            icon: <Clock size={16} />,
            badge: pendingRequests.length > 0 ? pendingRequests.length : undefined,
          },
          { key: 'patients', label: `My Patients (${uniquePatients.length})`, icon: <Users size={16} /> },
          { key: 'availability', label: 'Availability & Hours', icon: <Clock size={16} /> },
          { key: 'profile', label: 'Doctor Profile', icon: <User size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as DoctorView)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeView === tab.key
                ? 'text-primary-700 border-primary-600 font-semibold'
                : 'text-surface-500 border-transparent hover:text-surface-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* 1. OVERVIEW DASHBOARD VIEW                                    */}
      {/* ============================================================ */}
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Today's Appts", value: todayAppointments.length, color: 'text-primary-600 bg-primary-50' },
              { label: 'Upcoming', value: upcomingAppointments.length, color: 'text-blue-600 bg-blue-50' },
              { label: 'Pending Requests', value: pendingRequests.length, color: 'text-amber-600 bg-amber-50', highlight: pendingRequests.length > 0 },
              { label: 'Completed', value: completedAppointments.length, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Total Patients', value: uniquePatients.length, color: 'text-violet-600 bg-violet-50' },
              {
                label: 'Patient Rating',
                value: doctorRating.average_rating > 0 ? `${doctorRating.average_rating.toFixed(1)} ★` : '—',
                color: 'text-amber-600 bg-amber-50',
                sublabel: `${doctorRating.total_reviews} reviews`,
              },
            ].map((stat) => (
              <Card key={stat.label} className={`text-center p-3.5 ${stat.highlight ? 'border-amber-300 ring-2 ring-amber-400/20' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${stat.color}`}>
                  <Calendar size={16} />
                </div>
                <p className="text-xl font-bold text-surface-900">{stat.value}</p>
                <p className="text-[11px] text-surface-500">{stat.label}</p>
                {stat.sublabel && (
                  <p className="text-[10px] text-surface-400 font-medium">{stat.sublabel}</p>
                )}
              </Card>
            ))}
          </div>

          {/* Pending Appointment Requests Alert */}
          {pendingRequests.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">
                    Pending Appointment Requests ({pendingRequests.length})
                  </h3>
                </div>
                <span className="text-xs text-amber-700">Action required</span>
              </div>
              <div className="space-y-2.5">
                {pendingRequests.map((apt) => (
                  <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-amber-200">
                    <div>
                      <p className="text-sm font-bold text-surface-900">{apt.patient_name}</p>
                      <p className="text-xs text-surface-500">
                        {formatDate(apt.appointment_date)} at {formatTime(apt.start_time)} • {apt.consultation_type}
                      </p>
                      {apt.symptoms && (
                        <p className="text-xs text-surface-600 mt-1 italic">"{apt.symptoms}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        onClick={() => triggerStatusAction(apt.id, 'confirmed')}
                      >
                        <Check size={14} /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                        onClick={() => triggerStatusAction(apt.id, 'cancelled')}
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Today's Schedule */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                <Calendar size={18} className="text-primary-600" /> Today's Appointments
              </h3>
              <span className="text-xs text-surface-500">{todayAppointments.length} scheduled</span>
            </div>

            {todayAppointments.length === 0 ? (
              <EmptyState
                icon={<Calendar size={32} />}
                title="No appointments today"
                description="You have no scheduled clinical visits for today."
              />
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <Card key={apt.id} className="hover:border-surface-300 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                          {getInitials(apt.patient_name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-surface-900">{apt.patient_name}</h4>
                            {statusBadge(apt.status as AppointmentStatus)}
                          </div>
                          <p className="text-xs text-surface-500">
                            {formatTime(apt.start_time)} - {formatTime(apt.end_time)} • ID: {apt.appointment_id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {apt.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              onClick={() => triggerStatusAction(apt.id, 'completed')}
                            >
                              <CheckCircle2 size={14} /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-600 border-amber-200 hover:bg-amber-50 text-xs"
                              onClick={() => triggerStatusAction(apt.id, 'no-show')}
                            >
                              <AlertTriangle size={14} /> No-Show
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Patient Reviews & Feedback */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-400" /> Patient Reviews & Feedback
              </h3>
              <span className="text-xs text-surface-500 font-medium">
                {doctorReviews.length} {doctorReviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            {doctorReviews.length === 0 ? (
              <Card className="p-6 text-center border-dashed border-surface-200">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2">
                  <Star size={24} />
                </div>
                <h4 className="text-sm font-semibold text-surface-800">No Patient Reviews Yet</h4>
                <p className="text-xs text-surface-500 mt-1 max-w-sm mx-auto">
                  When you complete consultations, patients receive an automated notification to rate their visit. Their reviews and ratings will appear here.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {doctorReviews.map((rev) => (
                  <Card key={rev.id} className="p-4 border-surface-200 hover:border-amber-200 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                          {getInitials(rev.patient_name || 'PT')}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-surface-900">{rev.patient_name}</p>
                          <p className="text-[10px] text-surface-400">
                            {formatDate(rev.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-800">{rev.rating}.0</span>
                      </div>
                    </div>
                    {rev.comment ? (
                      <p className="text-xs text-surface-600 bg-surface-50 p-2.5 rounded-lg italic">
                        "{rev.comment}"
                      </p>
                    ) : (
                      <p className="text-xs text-surface-400 italic">No written comment provided.</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ALL APPOINTMENTS VIEW                                      */}
      {/* ============================================================ */}
      {activeView === 'appointments' && (
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex gap-1.5 bg-surface-100 p-1 rounded-xl overflow-x-auto">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((statusKey) => {
              const count =
                statusKey === 'all'
                  ? appointments.length
                  : appointments.filter((a) => a.status === statusKey).length;

              return (
                <button
                  key={statusKey}
                  onClick={() => setAppointmentFilter(statusKey)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer whitespace-nowrap ${
                    appointmentFilter === statusKey
                      ? 'bg-white text-surface-900 shadow-sm'
                      : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  {statusKey} ({count})
                </button>
              );
            })}
          </div>

          {/* List */}
          {filteredAppointments.length === 0 ? (
            <EmptyState
              icon={<Calendar size={32} />}
              title="No appointments found"
              description="There are no appointments matching the selected status filter."
            />
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <Card key={apt.id} className="hover:border-surface-300 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Patient & Booking info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-700 font-bold text-sm shrink-0">
                        {getInitials(apt.patient_name)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-surface-900">{apt.patient_name}</h4>
                          {statusBadge(apt.status as AppointmentStatus)}
                          <span className="text-[11px] font-mono text-surface-400">ID: {apt.appointment_id}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 text-xs text-surface-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar size={13} className="text-surface-400" /> {formatDate(apt.appointment_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-surface-400" /> {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            {apt.consultation_type === 'online' ? (
                              <Video size={13} className="text-emerald-500" />
                            ) : (
                              <Building2 size={13} className="text-blue-500" />
                            )}
                            <span className="capitalize">{apt.consultation_type}</span>
                          </span>
                        </div>
                        {apt.symptoms && (
                          <p className="text-xs text-surface-500 italic line-clamp-1">Symptoms: {apt.symptoms}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {apt.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            onClick={() => triggerStatusAction(apt.id, 'confirmed')}
                          >
                            <Check size={14} /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            onClick={() => triggerStatusAction(apt.id, 'cancelled')}
                          >
                            <XCircle size={14} /> Reject
                          </Button>
                        </>
                      )}

                      {apt.status === 'confirmed' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            onClick={() => triggerStatusAction(apt.id, 'completed')}
                          >
                            <CheckCircle2 size={14} /> Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 text-xs"
                            onClick={() => triggerStatusAction(apt.id, 'no-show')}
                          >
                            <AlertTriangle size={14} /> No-Show
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MY PATIENTS VIEW                                          */}
      {/* ============================================================ */}
      {activeView === 'patients' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-surface-200">
            <h3 className="text-base font-bold text-surface-900">My Patients Directory</h3>
            <p className="text-xs text-surface-500 mt-0.5">
              Patients who have clinical appointments booked with you.
            </p>
          </div>

          {uniquePatients.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No patients yet"
              description="Patients who book consultations with you will automatically appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uniquePatients.map((p) => (
                <Card key={p.patient_id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-surface-900">{p.name}</h4>
                        <p className="text-xs text-surface-500">
                          {p.gender ? `${p.gender}, ` : ''}{p.age ? `${p.age} yrs` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="info" size="sm">
                      {p.totalVisits} appointment{p.totalVisits > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-surface-600 border-t border-surface-100 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-surface-400" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-surface-400" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1 text-surface-500">
                      <Clock size={13} className="text-surface-400" />
                      <span>Last Visit: <strong>{formatDate(p.lastVisitDate)}</strong></span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        setSelectedAppointment(p.lastAppointment);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      View Last Consultation
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. AVAILABILITY & HOURS VIEW                                  */}
      {/* ============================================================ */}
      {activeView === 'availability' && (
        <div className="space-y-6">
          {/* Add Recurring Time Slot */}
          <Card>
            <h3 className="text-base font-bold text-surface-900 mb-1 flex items-center gap-2">
              <Plus size={18} className="text-primary-600" /> Add Weekly Availability Slot
            </h3>
            <p className="text-xs text-surface-500 mb-4">
              Configure your recurring weekly consultation slots. Patients will only be able to book during these active hours.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Day of Week</label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({ ...newSlot, day_of_week: e.target.value as DayOfWeek })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm bg-white"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Slot Duration</label>
                <select
                  value={newSlot.slot_duration}
                  onChange={(e) => setNewSlot({ ...newSlot, slot_duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm bg-white"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <Button onClick={addAvailabilitySlot}>
                <Plus size={16} /> Add Slot
              </Button>
            </div>
          </Card>

          {/* Current Weekly Schedule List */}
          <Card>
            <h3 className="text-base font-bold text-surface-900 mb-3">Active Weekly Schedule</h3>
            {isLoadingAvailability ? (
              <Spinner />
            ) : availability.length === 0 ? (
              <EmptyState
                icon={<Clock size={32} />}
                title="No availability slots scheduled"
                description="Add your consultation hours above so patients can book appointments with you."
              />
            ) : (
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const slots = availability.filter((a) => a.day_of_week === day.value);
                  if (slots.length === 0) return null;

                  return (
                    <div key={day.value} className="flex flex-col sm:flex-row sm:items-center gap-3 py-2.5 border-b border-surface-100 last:border-0">
                      <span className="w-28 text-sm font-semibold text-surface-800">{day.label}</span>
                      <div className="flex flex-wrap gap-2 flex-1">
                        {slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-200 shadow-xs"
                          >
                            <Clock size={13} className="text-emerald-600" />
                            <span>
                              {formatTime(slot.start_time.substring(0, 5))} - {formatTime(slot.end_time.substring(0, 5))}
                            </span>
                            <span className="text-emerald-500 font-normal">({slot.slot_duration}m)</span>
                            <button
                              onClick={() => removeSlot(slot.id)}
                              className="ml-1 text-red-400 hover:text-red-700 cursor-pointer transition-colors"
                              title="Delete time slot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Block Specific Dates (Leave / Vacation) */}
          <Card>
            <h3 className="text-base font-bold text-surface-900 mb-1 flex items-center gap-2">
              <Ban size={18} className="text-amber-600" /> Block Specific Dates (Leave / Days Off)
            </h3>
            <p className="text-xs text-surface-500 mb-4">
              Mark specific dates as unavailable so patients cannot schedule appointments on your days off.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-4">
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Date</label>
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={newBlockedDate.date}
                  onChange={(e) => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Medical Conference, Vacation"
                  value={newBlockedDate.reason}
                  onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm bg-white"
                />
              </div>

              <Button onClick={addBlockedDate} variant="outline">
                <Ban size={15} /> Block Date
              </Button>
            </div>

            {blockedDates.length > 0 && (
              <div className="space-y-2 border-t border-surface-100 pt-3">
                <h4 className="text-xs font-semibold text-surface-700">Upcoming Blocked Dates:</h4>
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map((b) => (
                    <div
                      key={b.id}
                      className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-lg border border-amber-200"
                    >
                      <Calendar size={13} />
                      <span>{formatDate(b.blocked_date)}</span>
                      {b.reason && <span className="text-amber-600 font-normal">({b.reason})</span>}
                      <button
                        onClick={() => removeBlockedDate(b.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        title="Unblock date"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. DOCTOR PROFILE VIEW                                        */}
      {/* ============================================================ */}
      {activeView === 'profile' && (
        <div className="max-w-2xl">
          <Card>
            <div className="flex items-center justify-between border-b border-surface-100 pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-surface-900">Doctor Practice Profile</h3>
                <p className="text-xs text-surface-500 mt-0.5">
                  Update your contact details, clinical department, and consultation fee.
                </p>
              </div>
              <Badge variant={doctor?.status === 'approved' ? 'success' : 'warning'}>
                {doctor?.status?.toUpperCase()}
              </Badge>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <Input
                label="Full Name *"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                required
              />

              {/* Email (Read-only) */}
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">
                  Email Address (Registered Login)
                </label>
                <input
                  type="email"
                  value={doctor?.email || user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm bg-surface-50 text-surface-500 cursor-not-allowed font-mono"
                />
                <p className="text-[11px] text-surface-400 mt-1">
                  Email is your login identifier and managed by clinic administration.
                </p>
              </div>

              {/* Phone */}
              <Input
                label="Contact Phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+1-555-0199"
              />

              {/* Specialization & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">
                    Medical Specialization
                  </label>
                  <select
                    value={profileForm.specialization_id}
                    onChange={(e) => setProfileForm({ ...profileForm, specialization_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-sm bg-white"
                  >
                    {specializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-sm bg-white"
                    placeholder="e.g. Cardiology & Heart Center"
                    required
                  />
                </div>
              </div>

              {/* Experience & Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Years of Experience"
                  type="number"
                  min={0}
                  value={profileForm.experience_years}
                  onChange={(e) => setProfileForm({ ...profileForm, experience_years: Number(e.target.value) })}
                  required
                />

                <Input
                  label="Consultation Fee ($)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={profileForm.consultation_fee}
                  onChange={(e) => setProfileForm({ ...profileForm, consultation_fee: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-surface-100">
                <Button type="submit" isLoading={isSavingProfile}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onAccept={(id) => triggerStatusAction(id, 'confirmed')}
        onReject={(id) => triggerStatusAction(id, 'cancelled')}
        onComplete={(id) => triggerStatusAction(id, 'completed')}
        onNoShow={(id) => triggerStatusAction(id, 'no-show')}
      />

      {/* Confirm / Reject Status Dialog */}
      <ConfirmDialog
        isOpen={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setSelectedAptAction(null);
        }}
        onConfirm={handleConfirmStatusUpdate}
        title={selectedAptAction?.title || 'Confirm Status Update'}
        message={
          <div>
            <p>{selectedAptAction?.message}</p>
            {selectedAptAction?.status === 'cancelled' && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Reason for rejection (Optional - sent to patient):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Doctor is in emergency surgery, please reschedule."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 text-xs bg-white"
                />
              </div>
            )}
          </div>
        }
        confirmLabel={
          selectedAptAction?.status === 'confirmed'
            ? 'Accept'
            : selectedAptAction?.status === 'cancelled'
            ? 'Reject Request'
            : selectedAptAction?.status === 'completed'
            ? 'Mark Complete'
            : 'Mark No-Show'
        }
        variant={selectedAptAction?.status === 'cancelled' || selectedAptAction?.status === 'no-show' ? 'danger' : 'primary'}
        isLoading={isUpdating}
      />
    </div>
  );
}
