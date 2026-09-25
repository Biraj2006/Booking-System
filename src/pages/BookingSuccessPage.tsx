import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, Home, LayoutDashboard, Navigation, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';
import { getClinicById } from '@/lib/clinic-service';
import { getDirectionsUrl } from '@/lib/geo';
import type { Clinic } from '@/types/clinic';
import Button from '@/components/common/Button';

export default function BookingSuccessPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinicId');
  const [clinic, setClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    if (clinicId) {
      getClinicById(clinicId).then(setClinic);
    }
  }, [clinicId]);

  const copyId = () => {
    if (appointmentId) {
      navigator.clipboard.writeText(appointmentId);
      toast.success('Copied!', { description: 'Appointment ID copied to clipboard.' });
    }
  };

  const directionsUrl = clinic
    ? getDirectionsUrl(clinic.latitude || 40.7128, clinic.longitude || -74.006)
    : '#';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center animate-fade-in">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 size={44} className="text-emerald-600" />
        </div>

        <h1 className="text-3xl font-bold text-surface-900 mb-2">Booking Confirmed!</h1>
        <p className="text-surface-600 mb-6 text-sm">
          Your appointment has been successfully booked in the 24/7 Clinical System. You will receive a confirmation notification.
        </p>

        {/* Appointment ID */}
        <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5 mb-5">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
            Your Unique Appointment ID
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-primary-700 tracking-wider font-mono">
              {appointmentId}
            </span>
            <button
              onClick={copyId}
              className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
              aria-label="Copy appointment ID"
              title="Copy ID"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>

        {/* Clinic Location & Directions Card (if booked via clinic) */}
        {clinic && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-5 text-left shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="font-bold text-sm text-teal-950 flex items-center gap-1.5">
                <Building2 size={16} className="text-teal-700 shrink-0" />
                <span>{clinic.name}</span>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-200/80 px-2 py-0.5 rounded-full uppercase">
                Clinic Location
              </span>
            </div>
            <p className="text-xs text-teal-800 mb-3">{clinic.address}</p>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Navigation size={14} />
              <span>Get Directions to Clinic ↗</span>
            </a>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-xs text-amber-800 text-left">
          <strong>Important:</strong> Please present your Appointment ID upon arrival at the clinical center. You can manage or reschedule this appointment anytime from your Patient Dashboard.
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link to={ROUTES.PATIENT_DASHBOARD}>
            <Button fullWidth size="lg">
              <LayoutDashboard size={18} />
              Go to Dashboard
            </Button>
          </Link>
          <div className="flex gap-3">
            <Link to={ROUTES.NEARBY_CLINICS} className="flex-1">
              <Button variant="outline" fullWidth>
                <Navigation size={16} />
                Find More Clinics
              </Button>
            </Link>
            <Link to={ROUTES.HOME} className="flex-1">
              <Button variant="ghost" fullWidth>
                <Home size={18} />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
