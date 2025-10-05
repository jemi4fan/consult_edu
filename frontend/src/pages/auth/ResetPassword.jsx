import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();
  const { resetPassword, loading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const onSubmit = async (data) => {
    try {
      await resetPassword(token, {
        password: data.password,
        confirm_password: data.confirm_password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto h-12 w-12 bg-success-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-success-600" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Password reset successfully</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>

        <div className="bg-success-50 p-4 rounded-md">
          <p className="text-sm text-success-700">
            Redirecting to sign in page in a few seconds...
          </p>
        </div>

        <div>
          <Link
            to="/auth/login"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Sign in now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New password
          </label>
          <div className="mt-1 relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Enter your new password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                },
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {errors.password && (
              <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
            Confirm new password
          </label>
          <div className="mt-1 relative">
            <Input
              id="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirm your new password"
              {...register('confirm_password', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-danger-600">{errors.confirm_password.message}</p>
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
            Reset password
          </Button>
        </div>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;


