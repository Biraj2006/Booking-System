import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  User,
  Clock,
  Users,
  Stethoscope,
  FileText,
  Shield,
  Activity,
  LogOut,
  Heart,
  ChevronLeft,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { APP_NAME, ROUTES } from '@/lib/constants';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const navItems: Record<UserRole, NavItem[]> = {
  patient: [
    { label: 'Dashboard', path: ROUTES.PATIENT_DASHBOARD, icon: <LayoutDashboard size={20} /> },
    { label: 'Nearby Clinics', path: ROUTES.NEARBY_CLINICS, icon: <MapPin size={20} /> },
    { label: 'Appointments', path: ROUTES.PATIENT_APPOINTMENTS, icon: <Calendar size={20} /> },
    { label: 'Profile', path: ROUTES.PATIENT_PROFILE, icon: <User size={20} /> },
  ],
  doctor: [
    { label: 'Dashboard', path: ROUTES.DOCTOR_DASHBOARD, icon: <LayoutDashboard size={20} /> },
    { label: 'Appointments', path: ROUTES.DOCTOR_APPOINTMENTS, icon: <Calendar size={20} /> },
    { label: 'My Patients', path: ROUTES.DOCTOR_PATIENTS, icon: <Users size={20} /> },
    { label: 'Availability', path: ROUTES.DOCTOR_AVAILABILITY, icon: <Clock size={20} /> },
    { label: 'Profile', path: ROUTES.DOCTOR_PROFILE_EDIT, icon: <User size={20} /> },
  ],
  admin: [
    { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: <LayoutDashboard size={20} /> },
    { label: 'Doctors', path: ROUTES.ADMIN_DOCTORS, icon: <Stethoscope size={20} /> },
    { label: 'Patients', path: ROUTES.ADMIN_PATIENTS, icon: <Users size={20} /> },
    { label: 'Appointments', path: ROUTES.ADMIN_APPOINTMENTS, icon: <Calendar size={20} /> },
    { label: 'Specializations', path: ROUTES.ADMIN_SPECIALIZATIONS, icon: <Activity size={20} /> },
    { label: 'Reports', path: ROUTES.ADMIN_REPORTS, icon: <FileText size={20} /> },
    { label: 'Audit Logs', path: ROUTES.ADMIN_AUDIT_LOGS, icon: <Shield size={20} /> },
  ],
};

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const items = navItems[role];

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-surface-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-surface-200">
          <NavLink to={ROUTES.HOME} className="flex items-center gap-2 text-primary-700">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <span className="font-bold text-sm">{APP_NAME}</span>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User size={20} className="text-primary-700" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-surface-800 truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-surface-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Dashboard navigation">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-surface-600 hover:bg-surface-50 hover:text-surface-800'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-surface-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
