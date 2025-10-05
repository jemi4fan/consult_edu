import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/applicant/Dashboard';
import JobsPage from './pages/applicant/JobsPage';
import ScholarshipsPage from './pages/applicant/ScholarshipsPage';
import ApplicationsPage from './pages/applicant/ApplicationsPage';
import ProfilePage from './pages/applicant/ProfilePage';
import ChatPage from './pages/applicant/ChatPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminJobsPage from './pages/admin/JobsPage';
import AdminScholarshipsPage from './pages/admin/ScholarshipsPage';
import AdminApplicantsPage from './pages/admin/ApplicantsPage';
import AdminApplicantDetailPage from './pages/admin/ApplicantDetailPage';
import AdminAdsPage from './pages/admin/AdsPage';
import AdminChatPage from './pages/admin/ChatPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';

// Staff Pages
import StaffApplicantsPage from './pages/staff/ApplicantsPage';
import StaffApplicantDetailPage from './pages/staff/ApplicantDetailPage';

// Other Pages
import ApplicationWizard from './pages/wizard/ApplicationWizard';
import NotFound from './pages/error/NotFound';
import Debug from './pages/Debug';
import Landing from './pages/Landing';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RootShell = () => (
  <div className="min-h-screen bg-gray-50">
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { background: '#363636', color: '#fff' },
        success: { duration: 3000, iconTheme: { primary: '#4ade80', secondary: '#fff' } },
        error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
    <Outlet />
  </div>
);

const router = createBrowserRouter(
  [
    {
      element: <RootShell />,
      children: [
        { path: '/debug', element: <Debug /> },
        { path: '/home', element: <Landing /> },
        { path: '/login', element: <Navigate to="/auth/login" replace /> },
        {
          path: '/auth',
          element: <AuthLayout />,
          children: [
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            { path: 'forgot-password', element: <ForgotPassword /> },
            { path: 'reset-password', element: <ResetPassword /> },
          ],
        },
        {
          path: '/',
          element: (
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          ),
          children: [
            { index: true, element: <RoleBasedRedirect /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'jobs', element: <JobsPage /> },
            { path: 'scholarships', element: <ScholarshipsPage /> },
            { path: 'applications', element: <ApplicationsPage /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'chat', element: <ChatPage /> },
            { path: 'wizard/:type/:id?', element: <ApplicationWizard /> },
            { path: 'admin', element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            ) },
            { path: 'admin/jobs', element: (
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <AdminJobsPage />
              </ProtectedRoute>
            ) },
            { path: 'admin/scholarships', element: (
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <AdminScholarshipsPage />
              </ProtectedRoute>
            ) },
            { path: 'admin/applicants', element: (
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <AdminApplicantsPage />
              </ProtectedRoute>
            ) },
            { path: 'admin/applicants/:id', element: (
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <AdminApplicantDetailPage />
              </ProtectedRoute>
            ) },
            { path: 'admin/ads', element: (
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <AdminAdsPage />
              </ProtectedRoute>
            ) },
            { path: 'admin/chat', element: (
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <AdminChatPage />
              </ProtectedRoute>
            ) },
            { path: 'admin/staff', element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <StaffManagementPage />
              </ProtectedRoute>
            ) },
          ],
        },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true }} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

