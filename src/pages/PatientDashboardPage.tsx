import { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Video,
  Building2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { ROUTES, APPOINTMENT_STATUS_CONFIG } from '@/lib/constants';
import {
  formatTime,
  formatDate,
  getRelativeDate,
  canCancelAppointment,
  canReviewAppointment,
  getInitials,
} from '@/lib/utils';
import type { Appointment } from '@/types/appointment';
import type { AppointmentStatus } from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Modal from '@/components/common/Modal';
import StarRating from '@/components/common/StarRating';
import { supabase } from '@/lib/supabase';

// Quick feedback suggestions for patients
const QUICK_FEEDBACK_TAGS = [
  'Attentive & Caring',
  'Clear Medical Explanation',
  'Punctual & On Time',
  'Accurate Diagnosis',
  'Patient & Friendly',
  'Helpful Advice',
];

// Contextual descriptor for selected star count
const RATING_LABELS: Record<number, { text: string; color: string }> = {
  5: { text: 'Outstanding — Highly Recommended! ⭐⭐⭐⭐⭐', color: 'text-emerald-600' },
  4: { text: 'Very Good — Thorough Consultation ⭐⭐⭐⭐', color: 'text-blue-600' },
  3: { text: 'Good — Standard Consultation ⭐⭐⭐', color: 'text-amber-600' },
  2: { text: 'Fair — Room for Improvement ⭐⭐', color: 'text-orange-600' },
  1: { text: 'Poor Experience ⭐', color: 'text-red-600' },
};

export default function PatientDashboardPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { appointments, isLoading, cancelAppointment } = useAppointments(user?.id, 'patient');

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>(() => {
    if (location.pathname.includes('appointments')) return 'upcoming';
    if (location.pathname.includes('profile')) return 'upcoming';
    return 'upcoming';
  });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [patientReviews, setPatientReviews] = useState<Record<string, { id: string; rating: number; comment?: string }>>({});

  // Fetch reviews already submitted by this patient
  const fetchPatientReviews = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, appointment_id, rating, comment')
        .eq('patient_id', user.id);
      if (!error && data) {
        const map: Record<string, { id: string; rating: number; comment?: string }> = {};
        data.forEach((r) => {
          map[r.appointment_id] = r;
        });
        setPatientReviews(map);
      }
    } catch (err) {
      console.error('Error fetching patient reviews:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchPatientReviews();
  }, [fetchPatientReviews]);

  // Filter appointments by tab
  const now = new Date();
  const upcoming = appointments.filter((a) =>
    (a.status === 'pending' || a.status === 'confirmed') &&
    new Date(`${a.appointment_date}T${a.end_time}`) >= now
  );
  const completed = appointments.filter((a) => a.status === 'completed');
  const cancelled = appointments.filter((a) => a.status === 'cancelled' || a.status === 'no-show');

  // Completed appointments that haven't been reviewed yet
  const unreviewedCompletedApts = completed.filter((a) => !patientReviews[a.id]);

  // Check URL param ?rate=APT-... or ?review=APT-...
  useEffect(() => {
    const rateId = searchParams.get('rate') || searchParams.get('review');
    if (rateId && appointments.length > 0) {
      const target = appointments.find(
        (a) => a.appointment_id === rateId || a.id === rateId
      );
      if (target && target.status === 'completed') {
        const existing = patientReviews[target.id];
        setReviewingAppointment(target);
        setReviewRating(existing?.rating || 5);
        setReviewComment(existing?.comment || '');
        setReviewModalOpen(true);
        setActiveTab('completed');
      }
    }
  }, [searchParams, appointments, patientReviews]);

  const displayedAppointments = activeTab === 'upcoming' ? upcoming : activeTab === 'completed' ? completed : cancelled;

  const handleCancel = async () => {
    if (!cancellingId || !user) return;
    setIsCancelling(true);
    const apt = appointments.find((a) => a.id === cancellingId);
    const { error } = await cancelAppointment(cancellingId, cancelReason, user.id);
    if (error) {
      toast.error('Failed to cancel', { description: error.message });
    } else {
      toast.success('Appointment cancelled');

      // Create notification for the patient
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Your appointment (${apt?.appointment_id}) has been cancelled.`,
        data: { appointment_id: apt?.appointment_id },
      });

      // Notify the doctor
      if (apt) {
        const doctorData = apt.doctor as unknown as { id: string; full_name: string; user_id?: string };
        if (doctorData?.id) {
          const { data: docRecord } = await supabase
            .from('doctors')
            .select('user_id')
            .eq('id', doctorData.id)
            .single();
          if (docRecord?.user_id) {
            await supabase.from('notifications').insert({
              user_id: docRecord.user_id,
              type: 'appointment_cancelled',
              title: 'Appointment Cancelled by Patient',
              message: `${apt.patient_name} cancelled their appointment (${apt.appointment_id}).`,
              data: { appointment_id: apt.appointment_id },
            });
          }
        }
      }
    }
    setIsCancelling(false);
    setCancelDialogOpen(false);
    setCancellingId(null);
    setCancelReason('');
  };

  const handleOpenReviewModal = (apt: Appointment) => {
    const existing = patientReviews[apt.id];
    setReviewingAppointment(apt);
    setReviewRating(existing?.rating || 5);
    setReviewComment(existing?.comment || '');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingAppointment || !user || reviewRating === 0) return;
    setIsSubmittingReview(true);

    try {
      const doctorData = reviewingAppointment.doctor;
      const doctorId = typeof doctorData === 'object' && doctorData !== null ? (doctorData as { id: string }).id : reviewingAppointment.doctor_id;

      const existingReview = patientReviews[reviewingAppointment.id];
      let res;

      if (existingReview?.id && !existingReview.id.startsWith('new-')) {
        res = await supabase
          .from('reviews')
          .update({
            rating: reviewRating,
            comment: reviewComment.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('appointment_id', reviewingAppointment.id);
      } else {
        res = await supabase
          .from('reviews')
          .insert({
            appointment_id: reviewingAppointment.id,
            patient_id: user.id,
            doctor_id: doctorId,
            rating: reviewRating,
            comment: reviewComment.trim() || null,
          });
      }

      if (res.error) throw res.error;

      // Update local reviews map immediately
      setPatientReviews((prev) => ({
        ...prev,
        [reviewingAppointment.id]: {
          id: existingReview?.id || 'new-' + Date.now(),
          appointment_id: reviewingAppointment.id,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        },
      }));

      // Notify the doctor about the review
      const { data: docRecord } = await supabase
        .from('doctors')
        .select('user_id')
        .eq('id', doctorId)
        .maybeSingle();

      if (docRecord?.user_id) {
        await supabase.from('notifications').insert({
          user_id: docRecord.user_id,
          type: 'review_received',
          title: 'New Patient Review Received',
          message: `${user.full_name || 'A patient'} left a ${reviewRating}-star review for consultation ${reviewingAppointment.appointment_id}.`,
          data: { appointment_id: reviewingAppointment.appointment_id, rating: reviewRating },
        });
      }

      toast.success(existingReview ? 'Your review has been updated!' : 'Thank you! Your review has been submitted.');
      setReviewModalOpen(false);
      setReviewingAppointment(null);
      setReviewRating(5);
      setReviewComment('');
      fetchPatientReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      toast.error('Failed to submit review', { description: msg });
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const statusBadge = (status: AppointmentStatus) => {
    const config = APPOINTMENT_STATUS_CONFIG[status];
    const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      pending: 'warning',
      confirmed: 'info',
      completed: 'success',
      cancelled: 'danger',
      'no-show': 'default',
    };
    return <Badge variant={variantMap[status] || 'default'}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome & Find Clinics Near Me CTA */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900">
            Welcome, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-surface-500 mt-1">Manage your appointments, health records, and clinical care.</p>
        </div>

        <Link to={`${ROUTES.NEARBY_CLINICS}?locate=true`}>
          <Button
            size="md"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm border border-emerald-500/30"
          >
            <MapPin size={17} />
            📍 Find Clinics Near Me
          </Button>
        </Link>
      </div>

      {/* Urgent Care / Travelling Banner */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-primary-800 to-primary-900 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-teal-700/40">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <MapPin size={22} className="text-primary-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base">Need Immediate Medical Attention?</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                Live Network
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/80 mt-0.5">
              Locate registered clinics closest to you, check doctor availability, and book an immediate appointment.
            </p>
          </div>
        </div>

        <Link to={`${ROUTES.NEARBY_CLINICS}?locate=true`} className="shrink-0 w-full sm:w-auto">
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold w-full sm:w-auto">
            Find Nearby Clinics
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Upcoming', value: upcoming.length, icon: <Calendar size={20} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Completed', value: completed.length, icon: <CheckCircle2 size={20} />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Cancelled', value: cancelled.length, icon: <XCircle size={20} />, color: 'text-red-600 bg-red-50' },
          { label: 'Total', value: appointments.length, icon: <Clock size={20} />, color: 'text-primary-600 bg-primary-50' },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
              <p className="text-xs text-surface-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Prominent Rating Prompt for Completed Appointments */}
      {unreviewedCompletedApts.length > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary-500/10 to-amber-500/5 border border-amber-200/80 shadow-sm relative overflow-hidden animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-surface-900">
                    How was your recent consultation?
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                    {unreviewedCompletedApts.length} Pending Review
                  </span>
                </div>
                <p className="text-sm text-surface-600 mt-1">
                  Dr. {(unreviewedCompletedApts[0].doctor as unknown as { full_name?: string })?.full_name || 'your doctor'} has completed your consultation on{' '}
                  <span className="font-semibold text-surface-800">
                    {formatDate(unreviewedCompletedApts[0].appointment_date)}
                  </span>
                  . Your feedback directly helps other patients and supports doctor clinical care!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={() => handleOpenReviewModal(unreviewedCompletedApts[0])}
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-2 text-sm font-medium cursor-pointer"
              >
                <Star size={16} className="fill-white" />
                Rate Consultation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200 mb-6">
        {([
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'completed', label: `Completed (${completed.length})` },
          { key: 'cancelled', label: `Cancelled (${cancelled.length})` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'text-primary-700 border-primary-600'
                : 'text-surface-500 border-transparent hover:text-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {displayedAppointments.length === 0 ? (
        <EmptyState
          icon={<Calendar size={32} />}
          title={`No ${activeTab} appointments`}
          description={activeTab === 'upcoming' ? 'Book an appointment with a doctor to get started.' : undefined}
          action={
            activeTab === 'upcoming' ? (
              <Link to={ROUTES.DOCTORS}><Button size="sm">Find a Doctor</Button></Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4 stagger-children">
          {displayedAppointments.map((apt) => {
            const doc = apt.doctor as unknown as {
              id: string;
              full_name: string;
              photo_url: string | null;
              qualification: string;
              clinic?: { name: string; address: string };
            };
            const review = patientReviews[apt.id];

            return (
              <Card key={apt.id} className="hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Doctor info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                      {doc?.photo_url ? (
                        <img src={doc.photo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        getInitials(doc?.full_name || 'DR')
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-surface-900 truncate">{doc?.full_name}</h3>
                      <p className="text-xs text-primary-600">{doc?.qualification}</p>
                    </div>
                  </div>

                  {/* Date & time */}
                  <div className="flex items-center gap-4 text-sm text-surface-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-surface-400" />
                      <span>{getRelativeDate(apt.appointment_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-surface-400" />
                      <span>{formatTime(apt.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {apt.consultation_type === 'online' ? (
                        <Video size={14} className="text-emerald-500" />
                      ) : (
                        <Building2 size={14} className="text-blue-500" />
                      )}
                    </div>
                  </div>

                  {/* Status & actions */}
                  <div className="flex items-center gap-3">
                    {statusBadge(apt.status as AppointmentStatus)}

                    {canCancelAppointment(apt.status as AppointmentStatus) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setCancellingId(apt.id);
                          setCancelDialogOpen(true);
                        }}
                      >
                        Cancel
                      </Button>
                    )}

                    {canReviewAppointment(apt.status as AppointmentStatus) && (
                      review ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Star size={12} className="fill-amber-400 text-amber-500" />
                            {review.rating}/5 Rated
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(apt)}
                            className="text-xs text-surface-500 hover:text-surface-800 underline underline-offset-2 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm flex items-center gap-1.5 cursor-pointer"
                          onClick={() => handleOpenReviewModal(apt)}
                        >
                          <Star size={14} className="fill-white" />
                          Rate Doctor
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Appointment ID */}
                <div className="mt-3 pt-3 border-t border-surface-100 text-xs text-surface-400 flex items-center justify-between">
                  <span>ID: {apt.appointment_id}</span>
                  {review?.comment && (
                    <span className="text-surface-500 italic truncate max-w-xs md:max-w-md">
                      "{review.comment}"
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setCancellingId(null);
        }}
        onConfirm={handleCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmLabel="Cancel Appointment"
        variant="danger"
        isLoading={isCancelling}
      />

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewingAppointment(null);
        }}
        title={patientReviews[reviewingAppointment?.id || ''] ? 'Edit Your Review' : 'Rate Your Consultation'}
        size="md"
      >
        {reviewingAppointment && (
          <div className="space-y-5">
            {/* Doctor Info Card */}
            <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0 text-base">
                {(reviewingAppointment.doctor as unknown as { photo_url?: string; full_name?: string })?.photo_url ? (
                  <img
                    src={(reviewingAppointment.doctor as unknown as { photo_url?: string })?.photo_url}
                    alt=""
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  getInitials((reviewingAppointment.doctor as unknown as { full_name?: string })?.full_name || 'DR')
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-surface-900 truncate">
                  {(reviewingAppointment.doctor as unknown as { full_name?: string })?.full_name || 'Doctor'}
                </h4>
                <p className="text-xs text-primary-600 font-medium">
                  {(reviewingAppointment.doctor as unknown as { qualification?: string; department?: string })?.qualification ||
                    (reviewingAppointment.doctor as unknown as { department?: string })?.department ||
                    'Clinical Specialist'}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Consultation on {formatDate(reviewingAppointment.appointment_date)} at {formatTime(reviewingAppointment.start_time)}
                </p>
              </div>
            </div>

            {/* Star Rating Section */}
            <div className="text-center py-2">
              <p className="text-sm font-medium text-surface-700 mb-2">How would you rate your experience?</p>
              <div className="flex justify-center mb-2">
                <StarRating
                  rating={reviewRating}
                  interactive
                  onChange={setReviewRating}
                  size={32}
                  className="justify-center gap-1.5"
                />
              </div>
              <p className={`text-xs font-semibold transition-all ${RATING_LABELS[reviewRating]?.color || 'text-surface-600'}`}>
                {RATING_LABELS[reviewRating]?.text || 'Tap stars to select rating'}
              </p>
            </div>

            {/* Quick Feedback Chips */}
            <div>
              <p className="text-xs font-medium text-surface-600 mb-2">Quick feedback tags (tap to add):</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_FEEDBACK_TAGS.map((tag) => {
                  const isSelected = reviewComment.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setReviewComment((prev) =>
                            prev
                              .replace(tag, '')
                              .replace(/,\s*,/g, ',')
                              .replace(/^,\s*/, '')
                              .replace(/,\s*$/, '')
                              .trim()
                          );
                        } else {
                          setReviewComment((prev) =>
                            prev.trim() ? `${prev.trim()}, ${tag}` : tag
                          );
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary-50 text-primary-700 border-primary-300 ring-1 ring-primary-300'
                          : 'bg-white text-surface-600 border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Comment Box */}
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1.5">
                Detailed Feedback (optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Share more about your consultation, diagnosis, and doctor's guidance..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setReviewModalOpen(false);
                  setReviewingAppointment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={handleSubmitReview}
                isLoading={isSubmittingReview}
                disabled={reviewRating === 0}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm cursor-pointer"
              >
                <Star size={16} className="fill-white mr-1.5" />
                {patientReviews[reviewingAppointment.id] ? 'Update Review' : 'Submit Review'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
