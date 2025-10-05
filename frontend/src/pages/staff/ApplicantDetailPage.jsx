import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { applicantsAPI, applicationsAPI, documentsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UploadIcon,
  EyeIcon,
  DownloadIcon,
  TrashIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/outline';

const StaffApplicantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch applicant details
  const { data: applicantData, isLoading, error } = useQuery(
    ['applicant', id],
    () => applicantsAPI.getApplicant(id),
    {
      select: (response) => response.data.data.applicant,
      enabled: !!id,
    }
  );

  // Fetch applicant's applications
  const { data: applicationsData } = useQuery(
    ['applicantApplications', id],
    () => applicationsAPI.getApplications({ applicant_id: id }),
    {
      select: (response) => response.data.data?.applications || [],
      enabled: !!id,
    }
  );

  // Fetch applicant's documents
  const { data: documentsData } = useQuery(
    ['applicantDocuments', id],
    () => documentsAPI.getDocuments({ applicant_id: id }),
    {
      select: (response) => response.data.data?.documents || [],
      enabled: !!id,
    }
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'text-green-600';
      case 'Under Review':
        return 'text-yellow-600';
      case 'Accepted':
        return 'text-green-600';
      case 'Rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case 'Submitted':
      case 'Accepted':
        return CheckCircleIcon;
      case 'Under Review':
        return ClockIcon;
      case 'Rejected':
        return XCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const getDocumentTypeIcon = (type) => {
    switch (type) {
      case 'resume':
        return <DocumentTextIcon className="h-4 w-4 text-blue-600" />;
      case 'transcript':
        return <AcademicCapIcon className="h-4 w-4 text-green-600" />;
      case 'cover_letter':
        return <DocumentTextIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !applicantData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading applicant details</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const applicant = applicantData;
  const user = applicant.user_id;
  const applications = applicationsData || [];
  const documents = documentsData || [];

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'applications', name: 'Applications', icon: BriefcaseIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.first_name} {user?.father_name} {user?.grandfather_name}
            </h1>
            <p className="text-gray-600">Applicant Profile</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user?.is_active ? 'active' : 'inactive')}`}>
            {user?.is_active ? 'Active' : 'Inactive'}
          </span>
          {user?.is_verified && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user?.first_name} {user?.father_name} {user?.grandfather_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900 mt-1">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="text-sm text-gray-900 mt-1">{user?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900 mt-1">{user?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">National ID</label>
                  <p className="text-sm text-gray-900 mt-1">{user?.national_id || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(user?.created_at)}</p>
                </div>
              </div>
              
              {user?.address && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="text-sm text-gray-900 mt-1">{user.address}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Profile Information */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Completion</label>
                  <div className="mt-2">
                    <ProgressBar value={applicant?.profile_completion || 0} size="sm" />
                    <p className="text-sm text-gray-600 mt-1">{applicant?.profile_completion || 0}%</p>
                  </div>
                </div>
                {applicant?.dob && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(applicant.dob)}</p>
                  </div>
                )}
                {applicant?.gender && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="text-sm text-gray-900 mt-1">{applicant.gender}</p>
                  </div>
                )}
                {applicant?.nationality && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nationality</label>
                    <p className="text-sm text-gray-900 mt-1">{applicant.nationality}</p>
                  </div>
                )}
              </div>
              
              {applicant?.bio && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <p className="text-sm text-gray-900 mt-1">{applicant.bio}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Education */}
          {applicant?.education && applicant.education.length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {applicant.education.map((edu) => (
                    <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                          <p className="text-sm text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-600">{edu.major}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">
                              Graduated: {edu.graduation_year}
                            </span>
                            {edu.gpa && (
                              <span className="text-xs text-gray-500">
                                GPA: {edu.gpa}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
          </div>
          <div className="px-6 py-4">
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((application) => {
                  const StatusIcon = getApplicationStatusIcon(application.status);
                  return (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className={`h-4 w-4 ${getApplicationStatusColor(application.status)}`} />
                            <h4 className="font-medium text-gray-900">
                              {application.type === 'Job' 
                                ? application.job_id?.name 
                                : application.scholarship_id?.name}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              application.status === 'Submitted' ? 'bg-green-100 text-green-800' :
                              application.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {application.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Applied: {formatDate(application.createdAt)}
                          </p>
                          {application.updatedAt && application.updatedAt !== application.createdAt && (
                            <p className="text-sm text-gray-600">
                              Last updated: {formatDate(application.updatedAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications</h3>
                <p className="text-gray-600">This applicant hasn't submitted any applications yet.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <Button>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
          <div className="px-6 py-4">
            {documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {getDocumentTypeIcon(doc.type)}
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          <p className="text-sm text-gray-600">
                            {doc.type.replace('_', ' ')} • {doc.size}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded: {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents</h3>
                <p className="text-gray-600">This applicant hasn't uploaded any documents yet.</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StaffApplicantDetailPage;
