import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data.identifier, data.password);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link to="/home" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-500">
          <i className="fas fa-home"></i>
          Home
        </Link>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            create a new account
          </Link>
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
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
            Email or Username
          </label>
          <div className="mt-1">
            <Input
              id="identifier"
              type="text"
              autoComplete="email"
              placeholder="Enter your email or username"
              {...register('identifier', {
                required: 'Email or username is required',
              })}
            />
            {errors.identifier && (
              <p className="mt-1 text-sm text-danger-600">{errors.identifier.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
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

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Sign in
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-600 mb-1">Admin Account:</p>
            <p className="text-xs font-mono">admin@example.com or admin / admin123</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-600 mb-1">Staff Account:</p>
            <p className="text-xs font-mono">staff@example.com or staff / staff123</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-600 mb-1">Applicant Account:</p>
            <p className="text-xs font-mono">applicant1@example.com or applicant1 / applicant123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
