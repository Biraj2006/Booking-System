import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Siren,
  Star,
  CheckCircle2,
  Calendar,
  Navigation,
  ArrowLeft,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { getClinicById } from '@/lib/clinic-service';
import { formatDistance, getDirectionsUrl } from '@/lib/geo';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Clinic } from '@/types/clinic';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import Card from '@/components/common/Card';
import ClinicMap from '@/components/clinics/ClinicMap';

export default function ClinicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { location } = useGeolocation();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      const data = await getClinicById(id, location);
      setClinic(data);
      setIsLoading(false);
    }
    load();
  }, [id, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4 text-primary-600" />
          <p className="text-sm font-medium text-surface-600">Loading clinic profile...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen py-24 text-center container-app">
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Clinic Not Found</h2>
        <p className="text-surface-600 mb-6">
          The requested clinic could not be located in our healthcare network.
        </p>
        <Link to="/nearby-clinics">
          <Button variant="primary">Back to Nearby Clinics</Button>
        </Link>
      </div>
    );
  }

  const isOpen = clinic.opening_status === 'open';
  const isLimited = clinic.opening_status === 'limited';

  const directionsUrl =
    clinic.latitude != null && clinic.longitude != null
      ? getDirectionsUrl(
          clinic.latitude,
          clinic.longitude,
          location?.lat,
          location?.lng
        )
      : '#';

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      {/* ============================================================ */}
      {/* 1. Header Banner & Hero                                      */}
      {/* ============================================================ */}
      <div className="relative bg-surface-900 text-white">
        {/* Background Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <img
            src={
              clinic.image_url ||
              'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80'
            }
            alt={clinic.name}
            className="w-full h-full object-cover filter blur-xs"
          />
        </div>

        <div className="container-app relative py-8 lg:py-12">
          {/* Back Navigation */}
          <Link
            to="/nearby-clinics"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Nearby Clinics</span>
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
            <div>
              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {isOpen ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white border border-emerald-400">
                    🟢 Open Now
                  </span>
                ) : isLimited ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white border border-amber-400">
                    🟡 Limited Availability
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/90 text-white border border-rose-400">
                    🔴 Closed
                  </span>
                )}

                {clinic.has_emergency && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white flex items-center gap-1">
                    <Siren size={13} />
                    24/7 Emergency Services
                  </span>
                )}

                {clinic.distance_km != null && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center gap-1">
                    <MapPin size={13} className="text-primary-300" />
                    {formatDistance(clinic.distance_km)} from your location
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                {clinic.name}
              </h1>

              {/* Address */}
              <p className="text-sm sm:text-base text-white/80 flex items-center gap-2 max-w-2xl">
                <MapPin size={16} className="text-primary-300 shrink-0" />
                <span>{clinic.address}, {clinic.city}, {clinic.state} {clinic.country}</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2.5 shrink-0 w-full sm:w-auto">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm border border-white/30 backdrop-blur-md transition-colors"
              >
                <Navigation size={16} className="text-primary-300" />
                <span>Get Directions</span>
              </a>

              {clinic.phone && (
                <a
                  href={`tel:${clinic.phone}`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm border border-white/30 backdrop-blur-md transition-colors"
                >
                  <Phone size={16} className="text-emerald-300" />
                  <span>Call Clinic</span>
                </a>
              )}

              <a
                href="#doctors-section"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-md transition-colors"
              >
                <Calendar size={16} />
                <span>Book Appointment</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Main Content Details Grid                                 */}
      {/* ============================================================ */}
      <div className="container-app pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Details, Services, Doctors */}
          <div className="lg:col-span-8 space-y-8">
            {/* About the Clinic */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-surface-900 mb-3 flex items-center gap-2">
                <Building2 size={20} className="text-primary-600" />
                <span>About {clinic.name}</span>
              </h2>
              <p className="text-surface-600 leading-relaxed text-sm sm:text-base">
                {clinic.description ||
                  `${clinic.name} is a trusted, verified healthcare facility providing immediate medical attention, multi-specialty care, and preventive medicine to patients and families.`}
              </p>

              {/* Operating Hours Summary */}
              <div className="mt-6 pt-6 border-t border-surface-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">
                    <Clock size={14} className="text-primary-600" />
                    <span>Operating Hours</span>
                  </div>
                  <div className="text-sm font-semibold text-surface-900">
                    {clinic.opening_hours || 'Mon - Sun: 24/7'}
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {clinic.is_24_7 ? '24/7 emergency walk-in access available' : 'Appointments scheduled in advance'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">
                    <Phone size={14} className="text-primary-600" />
                    <span>Clinic Inquiries</span>
                  </div>
                  <div className="text-sm font-semibold text-surface-900">
                    {clinic.phone || '+1-800-MEDICARE'}
                  </div>
                  <div className="text-xs text-surface-500 mt-0.5">
                    {clinic.email || 'contact@medicare247.com'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Clinical Services */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
                <Stethoscope size={20} className="text-primary-600" />
                <span>Specialized Services & Facilities</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(clinic.services || ['General Consultation', 'Diagnostics', 'Pharmacy']).map(
                  (service) => (
                    <div
                      key={service}
                      className="p-3 rounded-xl bg-surface-50 border border-surface-200 flex items-center gap-2.5 text-xs font-semibold text-surface-800"
                    >
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{service}</span>
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* Available Doctors Section */}
            <div id="doctors-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
                    <Stethoscope size={20} className="text-primary-600" />
                    <span>Available Physicians & Specialists</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
                    Select a doctor to view their active consultation slots and book an appointment.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 font-bold">
                  {clinic.doctors?.length || 1} Doctor{(clinic.doctors?.length || 1) > 1 ? 's' : ''}
                </span>
              </div>

              {clinic.doctors && clinic.doctors.length > 0 ? (
                <div className="space-y-4">
                  {clinic.doctors.map((doctor) => (
                    <Card
                      key={doctor.id}
                      className="p-5 hover:shadow-card-hover transition-all border border-surface-200"
                    >
                      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                        <div className="flex items-start gap-4">
                          <img
                            src={
                              doctor.photo_url ||
                              'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80'
                            }
                            alt={doctor.full_name}
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary-100 shrink-0"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-base sm:text-lg font-bold text-surface-900">
                                {doctor.full_name}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                                {doctor.specializations?.[0]?.name || doctor.department || 'Specialist'}
                              </span>
                            </div>

                            <p className="text-xs text-surface-600">
                              {doctor.qualification} • {doctor.experience_years} Years Experience
                            </p>

                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-500">
                              <span className="flex items-center gap-1 text-amber-600 font-bold">
                                <Star size={13} className="fill-amber-400 text-amber-400" />
                                <span>{doctor.average_rating || 4.9}</span>
                                <span className="text-surface-400 font-normal">
                                  ({doctor.total_reviews || 40})
                                </span>
                              </span>
                              <span>•</span>
                              <span>
                                Fee: <strong>${doctor.consultation_fee || 75}</strong>
                              </span>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">🟢 Bookable Slots Available</span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Action */}
                        <div className="w-full sm:w-auto shrink-0 flex sm:flex-col gap-2">
                          <Link
                            to={`/booking/${doctor.id}?clinicId=${clinic.id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            <Calendar size={14} />
                            <span>Book with Doctor</span>
                          </Link>

                          <Link
                            to={`/doctors/${doctor.id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold text-xs transition-colors"
                          >
                            View Bio ➔
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-surface-500 text-sm">
                  No doctors currently registered at this clinic.
                </Card>
              )}
            </div>
          </div>

          {/* Right Column: Mini Map & Quick Contact Card */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mini Map Card */}
            <Card className="overflow-hidden p-0 border border-surface-200 shadow-sm">
              <div className="p-4 bg-white border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-surface-900">Location & Navigation</h3>
                  <p className="text-xs text-surface-500">{clinic.address}</p>
                </div>
                {clinic.distance_km != null && (
                  <span className="px-2 py-1 rounded-lg bg-primary-50 text-primary-700 font-bold text-xs">
                    {formatDistance(clinic.distance_km)}
                  </span>
                )}
              </div>

              {/* Leaflet Mini Map */}
              <div className="h-64 w-full">
                <ClinicMap
                  clinics={[clinic]}
                  userLocation={location}
                  selectedClinicId={clinic.id}
                  className="h-64 w-full"
                />
              </div>

              <div className="p-4 bg-surface-50 flex items-center gap-2">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Navigation size={14} />
                  <span>Open Turn-by-Turn Directions ↗</span>
                </a>
              </div>
            </Card>

            {/* Quick Contact & Emergency Box */}
            <Card className="p-5 border border-surface-200 bg-white">
              <h3 className="font-bold text-sm text-surface-900 mb-3">Direct Contact</h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 text-surface-700">
                  <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-500">Reception</div>
                    <a
                      href={`tel:${clinic.phone}`}
                      className="font-bold text-surface-900 hover:text-primary-600"
                    >
                      {clinic.phone || '+1-800-MEDICARE'}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-surface-700">
                  <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-500">Email</div>
                    <div className="font-bold text-surface-900 truncate">
                      {clinic.email || 'contact@medicare247.com'}
                    </div>
                  </div>
                </div>

                {clinic.has_emergency && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                    <div className="font-bold flex items-center gap-1.5 text-rose-700 mb-1">
                      <Siren size={14} />
                      Emergency Triage Available
                    </div>
                    <p className="text-[11px] text-rose-800">
                      Patients presenting severe symptoms can walk in immediately without prior appointment.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
