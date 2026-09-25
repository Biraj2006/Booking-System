import { Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  Video,
  Building2,
  BadgeCheck,
  Globe,
} from 'lucide-react';
import type { Doctor } from '@/types/doctor';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { getInitials } from '@/lib/utils';

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <Card hover padding="none" className="overflow-hidden group">
      {/* Photo / Avatar */}
      <div className="relative h-52 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center overflow-hidden">
        {doctor.photo_url ? (
          <img
            src={doctor.photo_url}
            alt={doctor.full_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-3xl font-bold">
            {getInitials(doctor.full_name)}
          </div>
        )}
        {/* Verified badge */}
        {doctor.is_verified && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
            <BadgeCheck size={18} className="text-primary-600" />
          </div>
        )}
        {/* Consultation types */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {doctor.consultation_types.includes('online') && (
            <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
              <Video size={12} />
              Online
            </span>
          )}
          {doctor.consultation_types.includes('offline') && (
            <span className="inline-flex items-center gap-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
              <Building2 size={12} />
              In-Person
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-surface-900 mb-0.5 group-hover:text-primary-700 transition-colors">
          {doctor.full_name}
        </h3>
        {doctor.department && (
          <p className="text-xs font-semibold text-primary-700 mb-1">
            {doctor.department}
          </p>
        )}
        {doctor.qualification && doctor.qualification !== 'Medical Doctor' && (
          <p className="text-xs text-surface-500 mb-1">
            {doctor.qualification}
          </p>
        )}

        {/* Specializations */}
        <div className="flex flex-wrap gap-1 mb-3">
          {doctor.specializations?.slice(0, 3).map((spec) => (
            <Badge key={spec.id} variant="outline" size="sm">
              {spec.name}
            </Badge>
          ))}
          {(doctor.specializations?.length || 0) > 3 && (
            <Badge variant="default" size="sm">
              +{(doctor.specializations?.length || 0) - 3}
            </Badge>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-sm text-surface-500 mb-3">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="font-medium text-surface-700">
              {doctor.average_rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-surface-400">
              ({doctor.total_reviews || 0})
            </span>
          </div>
          <span className="text-surface-200">|</span>
          {/* Experience */}
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{doctor.experience_years} yrs</span>
          </div>
        </div>

        {/* Languages */}
        {doctor.languages.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-surface-400 mb-4">
            <Globe size={12} />
            <span>{doctor.languages.join(', ')}</span>
          </div>
        )}

        {/* Clinic */}
        {doctor.clinic && (
          <div className="flex items-start gap-1.5 text-xs text-surface-400 mb-4">
            <MapPin size={12} className="mt-0.5 shrink-0" />
            <span className="truncate">{doctor.clinic.name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link to={`/doctors/${doctor.id}`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth>
              View Profile
            </Button>
          </Link>
          <Link to={`/booking/${doctor.id}`} className="flex-1">
            <Button size="sm" fullWidth>
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
