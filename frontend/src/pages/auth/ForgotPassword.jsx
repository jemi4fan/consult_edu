import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword, loading, error, clearError } = useAuth();
  const [emailSent, setEmailSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email);
      setEmailSent(true);
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto h-12 w-12 bg-success-100 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-success-600" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a password reset link to your email address.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setEmailSent(false)}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              try again
            </button>
          </p>
        </div>

        <div>
          <Link
            to="/auth/login"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="rounded-md bg-danger-50 p-4">
            <div className="text-sm text-danger-700">{error}</div>
            <button
              type="button"
              onClick={clearError}
              className="mt-2 text-sm text-danger-600 hover:text-danger-500"
            >
              Dismiss
            </button>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Send reset link
          </Button>
        </div>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;


