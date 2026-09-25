import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Video,
  Building2,
  BadgeCheck,
  Globe,
  Calendar,
  GraduationCap,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { getDoctorById } from '@/hooks/useDoctors';
import { supabase } from '@/lib/supabase';
import type { Doctor } from '@/types/doctor';
import type { Review } from '@/types/review';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { formatTime, getInitials } from '@/lib/utils';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import StarRating from '@/components/common/StarRating';
import EmptyState from '@/components/common/EmptyState';

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'availability' | 'reviews'>('about');

  useEffect(() => {
    async function loadDoctor() {
      if (!id) return;
      setIsLoading(true);
      const doc = await getDoctorById(id);
      setDoctor(doc);

      // Fetch reviews
      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`
          *,
          patient:profiles!reviews_patient_id_fkey(full_name, avatar_url)
        `)
        .eq('doctor_id', id)
        .order('created_at', { ascending: false });

      if (reviewData) {
        setReviews(
          reviewData.map((r) => ({
            ...r,
            patient_name: (r.patient as { full_name: string })?.full_name || 'Anonymous',
            patient_avatar: (r.patient as { avatar_url: string | null })?.avatar_url || null,
          }))
        );
      }

      setIsLoading(false);
    }
    loadDoctor();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="py-12">
        <div className="container-app">
          <EmptyState
            title="Doctor Not Found"
            description="The doctor profile you're looking for doesn't exist or has been removed."
            action={
              <Link to="/doctors">
                <Button>Browse All Doctors</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'about', label: 'About' },
    { key: 'availability', label: 'Availability' },
    { key: 'reviews', label: `Reviews (${reviews.length})` },
  ] as const;

  return (
    <div className="py-8">
      <div className="container-app max-w-5xl animate-fade-in">
        {/* Back button */}
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Doctors
        </Link>

        {/* Profile Header */}
        <Card padding="none" className="overflow-hidden mb-6">
          <div className="relative">
            {/* Banner */}
            <div className="h-32 md:h-40 gradient-hero" />

            {/* Avatar + Info */}
            <div className="px-6 pb-6 md:flex md:items-end md:gap-6 -mt-12 md:-mt-16">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden shrink-0">
                {doctor.photo_url ? (
                  <img src={doctor.photo_url} alt={doctor.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-700 text-3xl md:text-4xl font-bold">
                    {getInitials(doctor.full_name)}
                  </div>
                )}
              </div>

              <div className="mt-4 md:mt-0 md:pb-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-surface-900">
                    {doctor.full_name}
                  </h1>
                  {doctor.is_verified && (
                    <BadgeCheck size={22} className="text-primary-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {doctor.department && (
                    <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
                      {doctor.department}
                    </span>
                  )}
                  {doctor.qualification && doctor.qualification !== 'Medical Doctor' && (
                    <span className="text-sm text-surface-600 font-medium">{doctor.qualification}</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-surface-500">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-surface-700">
                      {doctor.average_rating?.toFixed(1) || '0.0'}
                    </span>
                    <span>({doctor.total_reviews || 0} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase size={16} />
                    <span>{doctor.experience_years} years experience</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe size={16} />
                    <span>{doctor.languages.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Book CTA */}
              <div className="mt-4 md:mt-0 shrink-0">
                <Link to={`/booking/${doctor.id}`}>
                  <Button size="lg">
                    <Calendar size={18} />
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {doctor.specializations?.map((spec) => (
            <Badge key={spec.id} variant="outline" size="md">{spec.name}</Badge>
          ))}
          {doctor.consultation_types.includes('online') && (
            <Badge variant="success" size="md">
              <Video size={12} className="mr-1" /> Online
            </Badge>
          )}
          {doctor.consultation_types.includes('offline') && (
            <Badge variant="info" size="md">
              <Building2 size={12} className="mr-1" /> In-Person
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-surface-200 mb-6">
          {tabs.map((tab) => (
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

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'about' && <AboutTab doctor={doctor} />}
          {activeTab === 'availability' && <AvailabilityTab doctor={doctor} />}
          {activeTab === 'reviews' && <ReviewsTab reviews={reviews} />}
        </div>
      </div>
    </div>
  );
}

/* ===== About Tab ===== */
function AboutTab({ doctor }: { doctor: Doctor }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Bio */}
      <div className="md:col-span-2 space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-surface-900 mb-3">About</h3>
          <p className="text-sm text-surface-600 leading-relaxed">
            {doctor.bio || `${doctor.full_name} is an experienced medical professional specializing in providing quality healthcare services. With ${doctor.experience_years} years of experience, they are committed to delivering the best possible care to all patients.`}
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-surface-900 mb-3">Qualifications</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <GraduationCap size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-800">{doctor.qualification}</p>
                <p className="text-xs text-surface-500">Medical Degree</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Briefcase size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-800">{doctor.experience_years} Years Experience</p>
                <p className="text-xs text-surface-500">Clinical Practice</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar Info */}
      <div className="space-y-4">
        {/* Contact */}
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 mb-3">Contact</h3>
          <div className="space-y-2.5">
            {doctor.email && (
              <div className="flex items-center gap-2.5 text-sm text-surface-600">
                <Mail size={16} className="text-surface-400 shrink-0" />
                <span className="truncate">{doctor.email}</span>
              </div>
            )}
            {doctor.phone && (
              <div className="flex items-center gap-2.5 text-sm text-surface-600">
                <Phone size={16} className="text-surface-400 shrink-0" />
                <span>{doctor.phone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Clinic */}
        {doctor.clinic && (
          <Card>
            <h3 className="text-sm font-semibold text-surface-900 mb-3">Clinic</h3>
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-800">{doctor.clinic.name}</p>
              <div className="flex items-start gap-2 text-sm text-surface-600">
                <MapPin size={16} className="text-surface-400 mt-0.5 shrink-0" />
                <span>{doctor.clinic.address}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Languages */}
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 mb-3">Languages</h3>
          <div className="flex flex-wrap gap-1.5">
            {doctor.languages.map((lang) => (
              <Badge key={lang} variant="default" size="sm">{lang}</Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ===== Availability Tab ===== */
function AvailabilityTab({ doctor }: { doctor: Doctor }) {
  if (!doctor.availability || doctor.availability.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={32} />}
        title="No Availability Set"
        description="This doctor hasn't set up their availability schedule yet."
      />
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-surface-900 mb-4">Weekly Schedule</h3>
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const slots = doctor.availability?.filter((a) => a.day_of_week === day.value) || [];
          return (
            <div key={day.value} className="flex items-center gap-4 py-2 border-b border-surface-100 last:border-0">
              <span className="w-24 text-sm font-medium text-surface-700">{day.label}</span>
              {slots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <span key={slot.id} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Clock size={12} />
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-surface-400">Not available</span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ===== Reviews Tab ===== */
function ReviewsTab({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={32} />}
        title="No Reviews Yet"
        description="This doctor hasn't received any reviews yet. Be the first to leave a review after your appointment!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-600 text-sm font-semibold shrink-0">
              {getInitials(review.patient_name || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-surface-800">
                  {review.patient_name}
                </span>
                <span className="text-xs text-surface-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <StarRating rating={review.rating} size={14} />
              {review.comment && (
                <p className="mt-2 text-sm text-surface-600 leading-relaxed">{review.comment}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
