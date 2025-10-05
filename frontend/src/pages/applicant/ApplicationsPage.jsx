import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useQuery } from 'react-query';
import { applicationsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Briefcase,
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Rocket,
  RefreshCw,
} from 'lucide-react';

const ApplicationsPage = () => {
  const navigate = useNavigate();
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartApplicationId, setRestartApplicationId] = useState(null);

  // Fetch applications from API
  const { data: applicationsData, isLoading, refetch } = useQuery(
    'applications',
    () => applicationsAPI.getUserApplications(),
    {
      select: (response) => response.data.data?.applications || [],
      onError: (error) => {
        toast.error('Failed to load applications');
        console.error('Error loading applications:', error);
      }
    }
  );

  const applications = applicationsData || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      submitted: 'success',
      in_progress: 'warning',
      draft: 'secondary',
      withdrawn: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      paid: 'success',
      unpaid: 'warning',
      pending: 'warning',
      failed: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getApplicationTypeIcon = (type) => {
    return type === 'job' ? (
      <Briefcase className="h-5 w-5 text-blue-600" />
    ) : (
      <GraduationCap className="h-5 w-5 text-purple-600" />
    );
  };

  const handleResumeApplication = (application) => {
    navigate(`/wizard/${application.type}/${application.id}`);
  };

  const handleRestartApplication = (applicationId) => {
    setRestartApplicationId(applicationId);
    setShowRestartModal(true);
  };

  const confirmRestartApplication = async () => {
    try {
      // Call API to restart application
      await applicationsAPI.restartApplication(restartApplicationId);
      toast.success('Application restarted successfully');
      setShowRestartModal(false);
      setRestartApplicationId(null);
      refetch();
    } catch (error) {
      toast.error('Failed to restart application');
      console.error('Restart error:', error);
    }
  };

  const handleStartNewApplication = (type) => {
    navigate(`/wizard/${type}`);
  };

  // Determine application lifecycle state
  const getApplicationLifecycleState = () => {
    if (applications.length === 0) return 'no_application';
    
    const hasInProgress = applications.some(app => app.status === 'in_progress' || app.status === 'draft');
    const hasSubmitted = applications.some(app => app.status === 'submitted');
    
    if (hasInProgress) return 'in_progress';
    if (hasSubmitted) return 'submitted';
    return 'no_application';
  };

  const lifecycleState = getApplicationLifecycleState();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">
            Track and manage your job and scholarship applications.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link to="/wizard/scholarship">
              <GraduationCap className="mr-2 h-4 w-4" />
              Apply for Scholarship
            </Link>
          </Button>
          <Button asChild>
            <Link to="/wizard/job">
              <Briefcase className="mr-2 h-4 w-4" />
              Apply for Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Application Lifecycle States */}
      {lifecycleState === 'no_application' && (
        <Card>
          <CardContent className="p-12 text-center">
            <Rocket className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">You have no active applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start a new application now!
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <Button onClick={() => handleStartNewApplication('scholarship')}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Start Scholarship Application
              </Button>
              <Button onClick={() => handleStartNewApplication('job')}>
                <Briefcase className="mr-2 h-4 w-4" />
                Start Job Application
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {lifecycleState === 'in_progress' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Application In Progress</h3>
              <p className="text-sm text-gray-600 mt-1">
                You have an application in progress. Resume or restart as needed.
              </p>
            </div>
            
            {applications.filter(app => app.status === 'in_progress' || app.status === 'draft').map((application) => (
              <div key={application.id} className="border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getApplicationTypeIcon(application.type)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {application.title || `${application.type} Application`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {application.company || application.university || 'In Progress'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleRestartApplication(application.id)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restart
                    </Button>
                    <Button size="sm" onClick={() => handleResumeApplication(application)}>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{application.progress}%</span>
                  </div>
                  <ProgressBar value={application.progress} size="sm" />
                  <p className="text-xs text-gray-500 mt-1">
                    Step {application.currentStep} of {application.totalSteps}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {lifecycleState === 'submitted' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Application Submitted</h3>
              <p className="text-sm text-gray-600 mt-1">
                Your application has been submitted successfully. You can start a new application.
              </p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => handleStartNewApplication('scholarship')}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Start New Scholarship Application
              </Button>
              <Button onClick={() => handleStartNewApplication('job')}>
                <Briefcase className="mr-2 h-4 w-4" />
                Start New Job Application
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      {applications.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">All Applications</h2>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          
          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getApplicationTypeIcon(application.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.title || `${application.type} Application`}
                        </h3>
                        {getStatusIcon(application.status)}
                        {getStatusBadge(application.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {application.company || application.university || 'Application'}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{application.progress}%</span>
                        </div>
                        <ProgressBar value={application.progress} size="sm" />
                        <p className="text-xs text-gray-500 mt-1">
                          Step {application.currentStep} of {application.totalSteps}
                        </p>
                      </div>

                      {/* Application Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Type</label>
                          <p className="text-sm text-gray-900 capitalize">{application.type}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Status</label>
                          <div className="mt-0.5">
                            {getStatusBadge(application.status)}
                          </div>
                        </div>
                        {application.deadline && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">Deadline</label>
                            <p className="text-sm text-gray-900">
                              {new Date(application.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {application.submitted_at && (
                          <div>
                            <label className="text-xs font-medium text-gray-500">Submitted</label>
                            <p className="text-sm text-gray-900">
                              {new Date(application.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {application.status !== 'submitted' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResumeApplication(application)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {(application.status === 'in_progress' || application.status === 'draft') && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleResumeApplication(application)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {application.status === 'draft' ? 'Resume Application' : 'Continue Application'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Restart Confirmation Modal */}
      <Modal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        title="Restart Application"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to restart this application? All your progress will be lost and cannot be recovered.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowRestartModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRestartApplication}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApplicationsPage;


