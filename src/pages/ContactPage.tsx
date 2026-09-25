import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { CLINIC } from '@/lib/constants';
import Card from '@/components/common/Card';

export default function ContactPage() {
  return (
    <div className="py-12">
      <div className="container-app max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">Contact Us</h1>
          <p className="text-surface-600 max-w-xl mx-auto">
            Have questions or need assistance? We're here to help. Reach out to us through any of the following channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <MapPin size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 mb-1">Address</h3>
              <p className="text-sm text-surface-600">{CLINIC.address}</p>
            </div>
          </Card>

          <Card className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <Phone size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 mb-1">Phone</h3>
              <a href={`tel:${CLINIC.phone}`} className="text-sm text-primary-600 hover:underline">
                {CLINIC.phone}
              </a>
            </div>
          </Card>

          <Card className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <Mail size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 mb-1">Email</h3>
              <a href={`mailto:${CLINIC.email}`} className="text-sm text-primary-600 hover:underline">
                {CLINIC.email}
              </a>
            </div>
          </Card>

          <Card className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <Clock size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 mb-1">Working Hours</h3>
              <p className="text-sm text-surface-600">Open 24/7 — Booking available anytime</p>
            </div>
          </Card>
        </div>

        {/* Map placeholder — Leaflet integration in Phase 2/4 */}
        <Card className="mt-8 overflow-hidden" padding="none">
          <div className="h-80 bg-surface-100 flex items-center justify-center">
            <div className="text-center text-surface-400">
              <MapPin size={48} className="mx-auto mb-2" />
              <p className="text-sm">Interactive map will be displayed here</p>
              <p className="text-xs">Latitude: {CLINIC.lat}, Longitude: {CLINIC.lng}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
