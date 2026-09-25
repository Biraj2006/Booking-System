import { Siren, Phone, AlertTriangle, ExternalLink } from 'lucide-react';
import { CLINIC } from '@/lib/constants';
import Card from '@/components/common/Card';

export default function EmergencyPage() {
  return (
    <div className="py-12">
      <div className="container-app max-w-4xl">
        {/* Warning banner */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8 mb-8 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-800 mb-2">Emergency Services</h1>
              <p className="text-red-700 leading-relaxed">
                <strong>If you are experiencing a medical emergency, please call emergency services immediately.</strong>{' '}
                Online booking is not a replacement for emergency medical services. Do not use this platform for emergencies.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Siren size={32} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 mb-2">Emergency Helpline</h3>
            <a
              href={`tel:${CLINIC.emergencyPhone}`}
              className="text-3xl font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              {CLINIC.emergencyPhone}
            </a>
            <p className="text-sm text-surface-500 mt-2">Available 24/7</p>
          </Card>

          <Card className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Phone size={32} className="text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 mb-2">Clinic Emergency</h3>
            <a
              href={`tel:${CLINIC.phone}`}
              className="text-3xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {CLINIC.phone}
            </a>
            <p className="text-sm text-surface-500 mt-2">24/7 On-Call Support</p>
          </Card>
        </div>

        {/* When to call */}
        <Card>
          <h3 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            When to Call Emergency Services
          </h3>
          <ul className="space-y-2">
            {[
              'Severe chest pain or difficulty breathing',
              'Loss of consciousness or unresponsiveness',
              'Severe bleeding that won\'t stop',
              'Signs of stroke (face drooping, arm weakness, speech difficulty)',
              'Severe allergic reactions (swelling, difficulty breathing)',
              'Serious injuries from accidents or falls',
              'Seizures lasting more than 5 minutes',
              'Suspected poisoning or drug overdose',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-surface-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-8 text-center text-sm text-surface-500">
          <ExternalLink size={14} className="inline mr-1" />
          For non-emergency medical consultations, please{' '}
          <a href="/doctors" className="text-primary-600 hover:underline">
            book an appointment
          </a>{' '}
          with one of our doctors.
        </div>
      </div>
    </div>
  );
}
