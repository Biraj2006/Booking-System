import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Mail, Lock, User, Phone, Heart, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema, type RegisterFormValues } from '@/lib/validators';
import { APP_NAME, ROUTES } from '@/lib/constants';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
  });

  // Redirect if already logged in
  if (user) {
    navigate(ROUTES.PATIENT_DASHBOARD, { replace: true });
  }

  const onSubmit = async (data: RegisterFormValues) => {
    const { error } = await signUp(data.email, data.password, {
      full_name: data.full_name,
      role: 'patient',
    });

    if (error) {
      toast.error('Registration failed', {
        description: error.message || 'Something went wrong. Please try again.',
      });
      return;
    }

    setIsSuccess(true);
    toast.success('Account created!', {
      description: 'Please check your email to verify your account.',
    });
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Check Your Email</h1>
          <p className="text-surface-600 mb-6">
            We've sent a verification link to your email address. Please click the link to verify your account and get started.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
            <strong>Note:</strong> If you don't see the email, check your spam folder.
          </div>
          <Link to={ROUTES.LOGIN}>
            <Button fullWidth>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart size={28} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Create Account</h1>
          <p className="text-surface-500 mt-1">Join {APP_NAME} to book appointments</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              icon={<User size={18} />}
              error={errors.full_name?.message}
              autoComplete="name"
              disabled={isSubmitting}
              {...register('full_name')}
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<Mail size={18} />}
              error={errors.email?.message}
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email')}
            />

            {/* Phone (optional) */}
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone (optional)"
              icon={<Phone size={18} />}
              error={errors.phone?.message}
              autoComplete="tel"
              helperText="Optional — used for appointment reminders"
              disabled={isSubmitting}
              {...register('phone')}
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                icon={<Lock size={18} />}
                error={errors.password?.message}
                autoComplete="new-password"
                disabled={isSubmitting}
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

            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                icon={<Lock size={18} />}
                error={errors.confirm_password?.message}
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register('confirm_password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-surface-400 space-y-1 pl-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
            >
              <UserPlus size={18} />
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-surface-400">Already have an account?</span>
            </div>
          </div>

          {/* Login link */}
          <Link to={ROUTES.LOGIN}>
            <Button variant="outline" fullWidth>
              Sign In Instead
            </Button>
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-surface-400 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
