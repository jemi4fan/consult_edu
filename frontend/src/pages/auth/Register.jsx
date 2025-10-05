import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, loading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link to="/home" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500">
          <i className="fas fa-home"></i>
          Home
        </Link>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
            <button
              type="button"
              onClick={clearError}
              className="mt-2 text-sm text-red-600 hover:text-red-500"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <div className="mt-1">
              <Input
                id="first_name"
                type="text"
                autoComplete="given-name"
                placeholder="Enter your first name"
                {...register('first_name', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="father_name" className="block text-sm font-medium text-gray-700">
              Father Name *
            </label>
            <div className="mt-1">
              <Input
                id="father_name"
                type="text"
                autoComplete="family-name"
                placeholder="Enter your father's name"
                {...register('father_name', {
                  required: 'Father name is required',
                  minLength: {
                    value: 2,
                    message: 'Father name must be at least 2 characters',
                  },
                })}
              />
              {errors.father_name && (
                <p className="mt-1 text-sm text-red-600">{errors.father_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="grandfather_name" className="block text-sm font-medium text-gray-700">
              Grandfather Name *
            </label>
            <div className="mt-1">
              <Input
                id="grandfather_name"
                type="text"
                placeholder="Enter your grandfather's name"
                {...register('grandfather_name', {
                  required: 'Grandfather name is required',
                  minLength: {
                    value: 2,
                    message: 'Grandfather name must be at least 2 characters',
                  },
                })}
              />
              {errors.grandfather_name && (
                <p className="mt-1 text-sm text-red-600">{errors.grandfather_name.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username *
          </label>
          <div className="mt-1">
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
              {...register('username', {
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Username can only contain letters, numbers, and underscores',
                },
              })}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="mt-1">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <div className="mt-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
                },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <div className="mt-1">
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1">
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Enter your phone number"
                {...register('phone', {
                  pattern: {
                    value: /^[\+]?[1-9][\d]{0,15}$/,
                    message: 'Please enter a valid phone number',
                  },
                })}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="national_id" className="block text-sm font-medium text-gray-700">
              National ID
            </label>
            <div className="mt-1">
              <Input
                id="national_id"
                type="text"
                placeholder="Enter your national ID"
                {...register('national_id', {
                  minLength: {
                    value: 5,
                    message: 'National ID must be at least 5 characters',
                  },
                  maxLength: {
                    value: 50,
                    message: 'National ID must be less than 50 characters',
                  },
                })}
              />
              {errors.national_id && (
                <p className="mt-1 text-sm text-red-600">{errors.national_id.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Register;