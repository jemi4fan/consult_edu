import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { jobsAPI, scholarshipsAPI, applicationsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  BriefcaseIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/outline';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch featured jobs
  const { data: featuredJobs, isLoading: jobsLoading } = useQuery(
    'featuredJobs',
    () => jobsAPI.getFeaturedJobs(3),
    {
      select: (response) => response.data.data?.jobs || []
    }
  );

  // Fetch featured scholarships
  const { data: featuredScholarships, isLoading: scholarshipsLoading } = useQuery(
    'featuredScholarships',
    () => scholarshipsAPI.getFeaturedScholarships(3),
    {
      select: (response) => response.data.data?.scholarships || []
    }
  );

  // Fetch user applications
  const { data: userApplications, isLoading: applicationsLoading } = useQuery(
    'userApplications',
    () => applicationsAPI.getUserApplications({ limit: 5 }),
    {
      select: (response) => response.data.data?.applications || []
    }
  );

  const stats = [
    {
      name: 'Total Applications',
      value: userApplications?.length || 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      href: '/applications'
    },
    {
      name: 'Available Jobs',
      value: featuredJobs?.length || 0,
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      href: '/jobs'
    },
    {
      name: 'Available Scholarships',
      value: featuredScholarships?.length || 0,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      href: '/scholarships'
    },
    {
      name: 'Profile Completion',
      value: user?.applicant_data?.profile_completion || 0,
      icon: UserIcon,
      color: 'bg-orange-500',
      href: '/profile'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-green-100 text-green-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Accepted':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Submitted':
        return CheckCircleIcon;
      case 'Under Review':
        return ClockIcon;
      case 'Accepted':
        return CheckCircleIcon;
      case 'Rejected':
        return DocumentTextIcon;
      default:
        return ClockIcon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your applications today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-md`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to={stat.href}>
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </Link>
            </div>
        </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <Link to="/applications">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
              </div>
          
          {applicationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              ))}
            </div>
          ) : userApplications?.length > 0 ? (
            <div className="space-y-3">
              {userApplications.slice(0, 3).map((application) => {
                const StatusIcon = getStatusIcon(application.status);
                return (
                  <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {application.type === 'Job' ? application.job_id?.name : application.scholarship_id?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Applied on {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {application.status}
                    </div>
              </div>
                );
              })}
              </div>
          ) : (
            <div className="text-center py-6">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No applications yet</p>
              <Link to="/jobs">
                <Button className="mt-3">Browse Jobs</Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Featured Opportunities */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Featured Opportunities</h2>
            <div className="flex space-x-2">
              <Link to="/jobs">
                <Button variant="outline" size="sm">Jobs</Button>
              </Link>
              <Link to="/scholarships">
                <Button variant="outline" size="sm">Scholarships</Button>
              </Link>
            </div>
      </div>

            <div className="space-y-4">
            {/* Featured Jobs */}
            {jobsLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : featuredJobs?.length > 0 ? (
              featuredJobs.slice(0, 2).map((job) => (
                <div key={job.id} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-900">{job.name}</h3>
                      <p className="text-xs text-blue-700">{job.company?.name}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <Link to={`/apply/job/${job.id}`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Apply
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : null}

            {/* Featured Scholarships */}
            {scholarshipsLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : featuredScholarships?.length > 0 ? (
              featuredScholarships.slice(0, 2).map((scholarship) => (
                <div key={scholarship.id} className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-purple-900">{scholarship.name}</h3>
                      <p className="text-xs text-purple-700">{scholarship.university_name}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <Link to={`/apply/scholarship/${scholarship.id}`}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Apply
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : null}
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;