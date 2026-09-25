import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Heart, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validators';
import { APP_NAME, ROUTES } from '@/lib/constants';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  const { updatePassword, signOut } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm_password: '' },
  });

  // Verify that the user arrived via a valid recovery link or has an active session
  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasRecoverySession(true);
      } else {
        // Also check hash or query params if session hasn't been set yet
        const hash = window.location.hash;
        const search = window.location.search;
        if (hash.includes('access_token') || hash.includes('type=recovery') || search.includes('code=')) {
          setHasRecoverySession(true);
        } else {
          setHasRecoverySession(false);
        }
      }
    });

    // 2. Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasRecoverySession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    const { error } = await updatePassword(data.password);
    if (error) {
      toast.error('Password reset failed', {
        description: error.message || 'Unable to update password. Please request a new link.',
      });
      return;
    }

    setIsSuccess(true);
    toast.success('Password updated successfully!', {
      description: 'You can now sign in with your new password.',
    });

    // Sign out of the temporary recovery session so the user can log in freshly
    await signOut();
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Password Reset Complete</h1>
          <p className="text-surface-600 mb-6">
            Your password has been changed successfully. You can now sign in with your new credentials.
          </p>
          <Button fullWidth onClick={() => navigate(ROUTES.LOGIN)}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Invalid or expired recovery link state
  if (hasRecoverySession === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Invalid or Expired Link</h1>
          <p className="text-surface-600 mb-6">
            This password reset link is invalid or has expired. Please request a new link.
          </p>
          <div className="space-y-3">
            <Link to={ROUTES.FORGOT_PASSWORD}>
              <Button fullWidth>Request New Link</Button>
            </Link>
            <div>
              <Link
                to={ROUTES.LOGIN}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
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
          <h1 className="text-2xl font-bold text-surface-900">Set New Password</h1>
          <p className="text-surface-500 mt-1">
            Choose a strong, secure password for your {APP_NAME} account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* New Password */}
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters with letters & numbers"
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
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your new password"
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

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
            >
              Update Password
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
