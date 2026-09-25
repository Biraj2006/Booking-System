import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Clock,
  Siren,
  Stethoscope,
  Navigation,
  Calendar,
} from 'lucide-react';
import { formatDistance, getDirectionsUrl } from '@/lib/geo';
import { cn } from '@/lib/utils';
import type { Clinic, UserLocation } from '@/types/clinic';

interface ClinicCardProps {
  clinic: Clinic;
  userLocation: UserLocation | null;
  isSelected?: boolean;
  onSelect?: () => void;
  onBookAppointment?: (clinic: Clinic) => void;
}

export default function ClinicCard({
  clinic,
  userLocation,
  isSelected = false,
  onSelect,
  onBookAppointment,
}: ClinicCardProps) {
  const isOpen = clinic.opening_status === 'open';
  const isLimited = clinic.opening_status === 'limited';

  const directionsUrl =
    clinic.latitude != null && clinic.longitude != null
      ? getDirectionsUrl(
          clinic.latitude,
          clinic.longitude,
          userLocation?.lat,
          userLocation?.lng
        )
      : '#';

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group bg-white rounded-2xl border p-5 transition-all duration-200 cursor-pointer hover:shadow-card-hover relative',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md bg-primary-50/20'
          : 'border-surface-200 hover:border-surface-300'
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Clinic Image */}
        <div className="relative w-full sm:w-36 h-36 sm:h-auto rounded-xl overflow-hidden bg-surface-100 shrink-0">
          <img
            src={
              clinic.image_url ||
              'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80'
            }
            alt={clinic.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Distance pill overlay */}
          {clinic.distance_km != null && (
            <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-surface-900/85 backdrop-blur-sm text-white font-bold text-xs flex items-center gap-1 shadow-sm">
              <MapPin size={12} className="text-primary-300" />
              <span>{formatDistance(clinic.distance_km)}</span>
            </div>
          )}

          {clinic.has_emergency && (
            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-600/90 text-white font-semibold text-[10px] flex items-center gap-1">
              <Siren size={11} />
              <span>Emergency</span>
            </div>
          )}
        </div>

        {/* Clinic Information */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Header: Status badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isOpen ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Open Now
                </span>
              ) : isLimited ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Limited Availability
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Closed
                </span>
              )}

              {clinic.has_doctor_available_now && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Stethoscope size={12} />
                  Doctor Available Now
                </span>
              )}

              {clinic.is_24_7 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  <Clock size={12} />
                  24/7 Facility
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-surface-900 group-hover:text-primary-700 transition-colors leading-snug">
              {clinic.name}
            </h3>

            {/* Address */}
            <p className="text-xs sm:text-sm text-surface-500 mt-1 flex items-start gap-1.5">
              <MapPin size={14} className="text-surface-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{clinic.address}</span>
            </p>

            {/* Hours & Contact */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-surface-600">
              {clinic.opening_hours && (
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-surface-400" />
                  <span>{clinic.opening_hours}</span>
                </span>
              )}
              {clinic.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-surface-400" />
                  <span>{clinic.phone}</span>
                </span>
              )}
            </div>

            {/* Services badges */}
            {clinic.services && clinic.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {clinic.services.slice(0, 4).map((service) => (
                  <span
                    key={service}
                    className="px-2 py-0.5 rounded-md bg-surface-100 text-surface-700 text-[11px] font-medium"
                  >
                    {service}
                  </span>
                ))}
                {clinic.services.length > 4 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-500 text-[11px]">
                    +{clinic.services.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-surface-100">
            {/* Doctors summary */}
            <div className="text-xs text-surface-600 flex items-center gap-1.5">
              <div className="flex -space-x-1.5 overflow-hidden">
                {(clinic.doctors || []).slice(0, 3).map((doc, idx) => (
                  <img
                    key={doc.id || idx}
                    src={
                      doc.photo_url ||
                      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80'
                    }
                    alt={doc.full_name}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  />
                ))}
              </div>
              <span className="font-medium text-surface-800">
                {clinic.doctor_count || clinic.doctors?.length || 1} Doctor
                {(clinic.doctor_count || clinic.doctors?.length || 1) > 1 ? 's' : ''}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-surface-600 hover:text-primary-700 hover:bg-surface-100 rounded-lg transition-colors border border-surface-200"
                title="Get Directions"
              >
                <Navigation size={16} />
              </a>

              <Link
                to={`/clinics/${clinic.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-300 text-xs font-semibold text-surface-700 hover:bg-surface-50 transition-colors"
              >
                View Clinic
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBookAppointment) {
                    onBookAppointment(clinic);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Calendar size={14} />
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
