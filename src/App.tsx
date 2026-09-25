import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ROUTES } from '@/lib/constants';

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Public Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DoctorsPage from '@/pages/DoctorsPage';
import DoctorDetailPage from '@/pages/DoctorDetailPage';
import EmergencyPage from '@/pages/EmergencyPage';
import ContactPage from '@/pages/ContactPage';
import NearbyClinicsPage from '@/pages/NearbyClinicsPage';
import ClinicDetailPage from '@/pages/ClinicDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Protected Pages
import BookingPage from '@/pages/BookingPage';
import BookingSuccessPage from '@/pages/BookingSuccessPage';
import PatientDashboardPage from '@/pages/PatientDashboardPage';
import DoctorDashboardPage from '@/pages/DoctorDashboardPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';

// Auth Guard
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            className: 'font-sans',
          }}
        />

        <Routes>
          {/* ========== Public Routes (with Navbar + Footer) ========== */}
          <Route element={<MainLayout />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
            <Route path={ROUTES.DOCTORS} element={<DoctorsPage />} />
            <Route path={ROUTES.DOCTOR_DETAIL} element={<DoctorDetailPage />} />
            <Route path={ROUTES.EMERGENCY} element={<EmergencyPage />} />
            <Route path={ROUTES.NEARBY_CLINICS} element={<NearbyClinicsPage />} />
            <Route path={ROUTES.CLINIC_DETAIL} element={<ClinicDetailPage />} />
            <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          </Route>

          {/* ========== Protected: Booking (with Navbar) ========== */}
          <Route element={<MainLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path={ROUTES.BOOKING} element={<BookingPage />} />
              <Route path={ROUTES.BOOKING_SUCCESS} element={<BookingSuccessPage />} />
            </Route>
          </Route>

          {/* ========== Protected: Patient Dashboard ========== */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route element={<DashboardLayout role="patient" />}>
              <Route path={ROUTES.PATIENT_DASHBOARD} element={<PatientDashboardPage />} />
              <Route path={ROUTES.PATIENT_APPOINTMENTS} element={<PatientDashboardPage />} />
              <Route path={ROUTES.PATIENT_PROFILE} element={<PatientDashboardPage />} />
            </Route>
          </Route>

          {/* ========== Protected: Doctor Dashboard ========== */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route element={<DashboardLayout role="doctor" />}>
              <Route path={ROUTES.DOCTOR_DASHBOARD} element={<DoctorDashboardPage />} />
              <Route path={ROUTES.DOCTOR_APPOINTMENTS} element={<DoctorDashboardPage />} />
              <Route path={ROUTES.DOCTOR_PATIENTS} element={<DoctorDashboardPage />} />
              <Route path={ROUTES.DOCTOR_AVAILABILITY} element={<DoctorDashboardPage />} />
              <Route path={ROUTES.DOCTOR_PROFILE_EDIT} element={<DoctorDashboardPage />} />
            </Route>
          </Route>

          {/* ========== Protected: Admin Dashboard ========== */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout role="admin" />}>
              <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
              <Route path={ROUTES.ADMIN_DOCTORS} element={<AdminDashboardPage />} />
              <Route path={ROUTES.ADMIN_PATIENTS} element={<AdminDashboardPage />} />
              <Route path={ROUTES.ADMIN_APPOINTMENTS} element={<AdminDashboardPage />} />
              <Route path={ROUTES.ADMIN_SPECIALIZATIONS} element={<AdminDashboardPage />} />
              <Route path={ROUTES.ADMIN_REPORTS} element={<AdminDashboardPage />} />
              <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<AdminDashboardPage />} />
            </Route>
          </Route>

          {/* ========== 404 ========== */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
