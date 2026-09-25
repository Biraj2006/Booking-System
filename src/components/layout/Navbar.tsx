import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Heart,
  LogIn,
  UserPlus,
  Search,
  User,
  LogOut,
  LayoutDashboard,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { APP_NAME, ROUTES, CLINIC } from '@/lib/constants';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.HOME);
    setIsMobileMenuOpen(false);
  };

  const getDashboardRoute = () => {
    if (!user) return ROUTES.LOGIN;
    switch (user.role) {
      case 'admin': return ROUTES.ADMIN_DASHBOARD;
      case 'doctor': return ROUTES.DOCTOR_DASHBOARD;
      default: return ROUTES.PATIENT_DASHBOARD;
    }
  };

  const navLinks = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'Nearby Clinics', path: ROUTES.NEARBY_CLINICS },
    { label: 'Find Doctors', path: ROUTES.DOCTORS },
    { label: 'Emergency', path: ROUTES.EMERGENCY },
    { label: 'Contact', path: ROUTES.CONTACT },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-200 shadow-navbar">
      {/* Top bar — emergency phone */}
      <div className="bg-primary-700 text-white text-xs py-1.5">
        <div className="container-app flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Heart size={12} className="text-red-300 fill-red-300" />
            <span>24/7 Healthcare Available</span>
          </span>
          <a
            href={`tel:${CLINIC.emergencyPhone}`}
            className="flex items-center gap-1 text-white hover:text-primary-200 transition-colors"
          >
            <Phone size={12} />
            Emergency: {CLINIC.emergencyPhone}
          </a>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="container-app" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 text-primary-700 hover:text-primary-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Heart size={20} className="text-white fill-white" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.path)
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-surface-600 hover:text-primary-700 hover:bg-surface-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to={ROUTES.DOCTORS}
              className="p-2 rounded-lg text-surface-500 hover:text-primary-600 hover:bg-surface-50 transition-colors"
              aria-label="Search doctors"
            >
              <Search size={20} />
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Link to={getDashboardRoute()}>
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-surface-200">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User size={16} className="text-primary-700" />
                  </div>
                  <div className="hidden lg:block text-sm">
                    <p className="font-medium text-surface-800 leading-tight">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-surface-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    aria-label="Sign out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    <LogIn size={16} />
                    Login
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button size="sm">
                    <UserPlus size={16} />
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-50 transition-colors cursor-pointer"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-surface-100 py-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(link.path)
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-surface-600 hover:text-primary-700 hover:bg-surface-50'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <hr className="my-2 border-surface-100" />

              {isAuthenticated && user ? (
                <>
                  <Link
                    to={getDashboardRoute()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer text-left"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-4 pt-2">
                  <Link to={ROUTES.LOGIN} className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth size="sm">Login</Button>
                  </Link>
                  <Link to={ROUTES.REGISTER} className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button fullWidth size="sm">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
