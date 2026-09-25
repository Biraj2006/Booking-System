import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Heart, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validators';
import { APP_NAME, ROUTES } from '@/lib/constants';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    const { error } = await resetPassword(data.email);
    if (error) {
      const isSmtpError = error.message?.toLowerCase().includes('recovery email');
      toast.error('Password reset failed', {
        description: isSmtpError
          ? 'Email delivery failed. Please verify the SMTP / email provider settings in your Supabase project dashboard.'
          : (error.message || 'Something went wrong. Please try again.'),
        duration: isSmtpError ? 7000 : 4000,
      });
      return;
    }
    setIsSuccess(true);
    toast.success('Reset link sent!', {
      description: 'Check your email for the password reset link.',
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
          <p className="text-surface-600 mb-2">
            We've sent a password reset link to:
          </p>
          <p className="font-semibold text-surface-800 mb-6">{getValues('email')}</p>
          <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 mb-6 text-sm text-surface-600">
            Click the link in the email to reset your password. The link will expire in 24 hours.
          </div>
          <div className="space-y-3">
            <Link to={ROUTES.LOGIN}>
              <Button fullWidth>Back to Login</Button>
            </Link>
            <button
              onClick={() => setIsSuccess(false)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
            >
              Didn't receive the email? Try again
            </button>
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
          <h1 className="text-2xl font-bold text-surface-900">Reset Password</h1>
          <p className="text-surface-500 mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              icon={<Mail size={18} />}
              error={errors.email?.message}
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email')}
            />

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
            >
              <Mail size={18} />
              Send Reset Link
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Help note */}
        <p className="text-center text-xs text-surface-400 mt-6">
          If you continue to have trouble, contact us at {APP_NAME} support.
        </p>
      </div>
    </div>
  );
}
