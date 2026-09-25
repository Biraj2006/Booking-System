import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Mail, Lock, Heart, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { APP_NAME, ROUTES } from '@/lib/constants';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Redirect if already logged in
  if (user) {
    const dashboardRoute =
      user.role === 'admin'
        ? ROUTES.ADMIN_DASHBOARD
        : user.role === 'doctor'
        ? ROUTES.DOCTOR_DASHBOARD
        : ROUTES.PATIENT_DASHBOARD;
    navigate(dashboardRoute, { replace: true });
  }

  const onSubmit = async (data: LoginFormValues) => {
    const { error } = await signIn(data.email, data.password);
    if (error) {
      toast.error('Login failed', {
        description: error.message || 'Invalid email or password. Please try again.',
      });
      return;
    }
    toast.success('Welcome back!', {
      description: 'You have been signed in successfully.',
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart size={28} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Welcome Back</h1>
          <p className="text-surface-500 mt-1">Sign in to your {APP_NAME} account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<Mail size={18} />}
              error={errors.email?.message}
              autoComplete="email"
              disabled={isSubmitting || authLoading}
              {...register('email')}
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                icon={<Lock size={18} />}
                error={errors.password?.message}
                autoComplete="current-password"
                disabled={isSubmitting || authLoading}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting || authLoading}
            >
              <LogIn size={18} />
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-surface-400">New to {APP_NAME}?</span>
            </div>
          </div>

          {/* Register link */}
          <Link to={ROUTES.REGISTER}>
            <Button variant="outline" fullWidth>
              Create an Account
            </Button>
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-surface-400 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
