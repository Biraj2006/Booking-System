import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { APP_NAME, ROUTES, CLINIC } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-900 text-surface-300">
      {/* Main footer */}
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to={ROUTES.HOME} className="flex items-center gap-2 text-white mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Heart size={18} className="text-white fill-white" />
              </div>
              <span className="text-lg font-bold">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-surface-400 leading-relaxed mb-4">
              Your trusted 24/7 clinical booking system. Book appointments with top doctors anytime, anywhere.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-400">
              <Clock size={14} />
              <span>Open 24/7 — Booking Available Anytime</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Find Doctors', path: ROUTES.DOCTORS },
                { label: 'Emergency', path: ROUTES.EMERGENCY },
                { label: 'Contact Us', path: ROUTES.CONTACT },
                { label: 'Login', path: ROUTES.LOGIN },
                { label: 'Register', path: ROUTES.REGISTER },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-surface-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2 text-sm text-surface-400">
              <li>General Consultation</li>
              <li>Online Consultation</li>
              <li>Specialist Care</li>
              <li>Diagnostic Services</li>
              <li>Emergency Care</li>
              <li>Preventive Health</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm">
                <MapPin size={16} className="text-primary-400 mt-0.5 shrink-0" />
                <span className="text-surface-400">{CLINIC.address}</span>
              </li>
              <li>
                <a
                  href={`tel:${CLINIC.phone}`}
                  className="flex items-center gap-2.5 text-sm text-surface-400 hover:text-white transition-colors"
                >
                  <Phone size={16} className="text-primary-400 shrink-0" />
                  {CLINIC.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CLINIC.email}`}
                  className="flex items-center gap-2.5 text-sm text-surface-400 hover:text-white transition-colors"
                >
                  <Mail size={16} className="text-primary-400 shrink-0" />
                  {CLINIC.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-surface-800">
        <div className="container-app py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-surface-500">
            © {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-surface-500">
            Built for better healthcare access
          </p>
        </div>
      </div>
    </footer>
  );
}
