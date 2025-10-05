import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, jobsAPI, scholarshipsAPI, applicationsAPI, chatAPI, adsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  UsersIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  ChatIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/outline';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Fetch dashboard statistics
  const { data: userStats } = useQuery(
    'adminUserStats',
    () => usersAPI.getUserStats(),
    {
      select: (response) => response.data.data,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const { data: jobStats } = useQuery(
    'adminJobStats',
    () => jobsAPI.getJobStats(),
    {
      select: (response) => response.data.data,
      refetchInterval: 30000,
    }
  );

  const { data: scholarshipStats } = useQuery(
    'adminScholarshipStats',
    () => scholarshipsAPI.getScholarshipStats(),
    {
      select: (response) => response.data.data,
      refetchInterval: 30000,
    }
  );

  const { data: applicationStats } = useQuery(
    'adminApplicationStats',
    () => applicationsAPI.getApplicationStats(),
    {
      select: (response) => response.data.data,
      refetchInterval: 30000,
    }
  );

  const { data: chatStats } = useQuery(
    'adminChatStats',
    () => chatAPI.getChatStats(),
    {
      select: (response) => response.data.data,
      refetchInterval: 30000,
    }
  );

  const { data: adStats } = useQuery(
    'adminAdStats',
    () => adsAPI.getAdStats(),
    {
      select: (response) => response.data.data,
      refetchInterval: 30000,
    }
  );

  // Fetch recent applications
  const { data: recentApplications } = useQuery(
    'adminRecentApplications',
    () => applicationsAPI.getPendingApplications(5),
    {
      select: (response) => response.data.data?.applications || [],
      refetchInterval: 15000, // Refresh every 15 seconds
    }
  );

  // Fetch recent activity (applications)
  const { data: recentActivity } = useQuery(
    'adminRecentActivity',
    () => applicationsAPI.getApplications({ limit: 10, sort: '-createdAt' }),
    {
      select: (response) => response.data.data?.applications || [],
      refetchInterval: 30000,
    }
  );

  const stats = [
    {
      name: 'Total Applicants',
      value: userStats?.overview?.total_users || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      href: '/admin/applicants'
    },
    {
      name: 'Active Jobs',
      value: jobStats?.overview?.active_jobs || 0,
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      href: '/admin/jobs'
    },
    {
      name: 'Scholarships',
      value: scholarshipStats?.overview?.total_scholarships || 0,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      href: '/admin/scholarships'
    },
    {
      name: 'Pending Applications',
      value: applicationStats?.overview?.pending_applications || 0,
      icon: ClockIcon,
      color: 'bg-orange-500',
      href: '/admin/applicants'
    },
    {
      name: 'Recent Applications',
      value: recentApplications?.length || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      href: '/admin/applicants'
    },
    {
      name: 'Active Chats',
      value: chatStats?.overview?.active_conversations || 0,
      icon: ChatIcon,
      color: 'bg-blue-500',
      href: '/admin/chat'
    }
  ];

  const quickActions = [
    {
      name: 'Add New Job',
      description: 'Create a new job posting',
      icon: BriefcaseIcon,
      color: 'bg-blue-500',
      href: '/admin/jobs?action=create'
    },
    {
      name: 'Add Scholarship',
      description: 'Create a new scholarship opportunity',
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      href: '/admin/scholarships?action=create'
    },
    {
      name: 'Manage Applicants',
      description: 'View and manage applicant profiles',
      icon: UsersIcon,
      color: 'bg-purple-500',
      href: '/admin/applicants'
    },
    {
      name: 'View Messages',
      description: 'Check recent chat messages',
      icon: ChatIcon,
      color: 'bg-orange-500',
      href: '/admin/chat'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'Job':
        return BriefcaseIcon;
      case 'Scholarship':
        return AcademicCapIcon;
      default:
        return CheckCircleIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'Job':
        return 'text-green-600';
      case 'Scholarship':
        return 'text-purple-600';
      default:
        return 'text-blue-600';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your administrator dashboard today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <PlusIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {quickActions.map((action) => (
              <Link key={action.name} to={action.href}>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className={`${action.color} p-2 rounded-md`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{action.name}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/admin/applicants">
              <Button variant="outline" size="sm">
                <EyeIcon className="h-4 w-4 mr-1" />
                View All
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentActivity?.length > 0 ? (
              recentActivity.slice(0, 5).map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`${getActivityColor(activity.type)} p-1 rounded-full`}>
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          {activity.user_id?.first_name} {activity.user_id?.father_name}
                        </span>
                        {' '}submitted application for{' '}
                        <span className="font-medium">
                          {activity.type === 'Job' 
                            ? activity.job_id?.name 
                            : activity.scholarship_id?.name}
                        </span>
                        {activity.type === 'Job' && activity.job_id?.company?.name && (
                          <span> at {activity.job_id.company.name}</span>
                        )}
                        {activity.type === 'Scholarship' && activity.scholarship_id?.university_name && (
                          <span> - {activity.scholarship_id.university_name}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;