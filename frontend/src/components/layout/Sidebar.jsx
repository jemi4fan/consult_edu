import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UserIcon,
  ChatIcon,
  CogIcon,
  UsersIcon,
  SpeakerphoneIcon,
  ChartBarIcon,
} from '@heroicons/react/outline';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const applicantNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
    { name: 'Scholarships', href: '/scholarships', icon: AcademicCapIcon },
    { name: 'My Applications', href: '/applications', icon: DocumentTextIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Messages', href: '/chat', icon: ChatIcon },
  ];

  const staffNavigation = [
    { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
    { name: 'Jobs Management', href: '/admin/jobs', icon: BriefcaseIcon },
    { name: 'Scholarships', href: '/admin/scholarships', icon: AcademicCapIcon },
    { name: 'Applicants', href: '/admin/applicants', icon: UsersIcon },
    { name: 'Ads Management', href: '/admin/ads', icon: SpeakerphoneIcon },
    { name: 'Messages', href: '/admin/chat', icon: ChatIcon },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
    { name: 'Jobs Management', href: '/admin/jobs', icon: BriefcaseIcon },
    { name: 'Scholarships', href: '/admin/scholarships', icon: AcademicCapIcon },
    { name: 'Applicants', href: '/admin/applicants', icon: UsersIcon },
    { name: 'Ads Management', href: '/admin/ads', icon: SpeakerphoneIcon },
    { name: 'Messages', href: '/admin/chat', icon: ChatIcon },
    { name: 'Staff Management', href: '/admin/staff', icon: CogIcon },
  ];

  const navigation = user?.role === 'admin' 
    ? adminNavigation 
    : user?.role === 'staff'
    ? staffNavigation
    : applicantNavigation;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          Scholarship & Job Platform
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon
              className={`mr-3 h-5 w-5 flex-shrink-0 ${
                window.location.pathname === item.href
                  ? 'text-indigo-500'
                  : 'text-gray-400 group-hover:text-gray-500'
              }`}
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.first_name?.charAt(0)}{user?.father_name?.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.father_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;