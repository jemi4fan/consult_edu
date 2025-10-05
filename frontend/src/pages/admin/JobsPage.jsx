import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { jobsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  SearchIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  LocationMarkerIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/outline';
import CountrySelect from '../../components/ui/CountrySelect';

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('action') === 'create');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requirements: '',
    benefits: '',
    country: '',
    city: '',
    application_fee: '',
    deadline: '',
    company: {
      name: '',
      website: '',
      description: '',
      contact_info: {
        email: '',
        phone: ''
      }
    }
  });

  // Fetch jobs with search and pagination
  const { data: jobsData, isLoading, error } = useQuery(
    ['jobs', searchTerm],
    () => jobsAPI.getJobs({ 
      search: searchTerm,
      limit: 20,
      sort: '-createdAt'
    }),
    {
      select: (response) => response.data.data,
      keepPreviousData: true,
    }
  );

  // Create job mutation
  const createJobMutation = useMutation(
    (jobData) => jobsAPI.createJob(jobData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
        toast.success('Job created successfully!');
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          requirements: '',
          benefits: '',
          country: '',
          city: '',
          application_fee: '',
          deadline: '',
          company: {
            name: '',
            website: '',
            description: '',
            contact_info: {
              email: '',
              phone: ''
            }
          }
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create job');
      }
    }
  );

  // Update job mutation
  const updateJobMutation = useMutation(
    ({ id, jobData }) => jobsAPI.updateJob(id, jobData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
        setShowEditModal(false);
        setSelectedJob(null);
        toast.success('Job updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update job');
      }
    }
  );

  // Delete job mutation
  const deleteJobMutation = useMutation(
    (id) => jobsAPI.deleteJob(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
        setShowDeleteModal(false);
        setSelectedJob(null);
        toast.success('Job deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete job');
      }
    }
  );

  // Feature job mutation
  const featureJobMutation = useMutation(
    ({ id, is_featured }) => jobsAPI.featureJob(id, is_featured),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
        toast.success('Job featured status updated!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update job');
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  const handleCreateJob = (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name.trim()) {
      toast.error('Job title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Job description is required');
      return;
    }
    
    if (formData.description.trim().length < 10) {
      toast.error('Job description must be at least 10 characters long');
      return;
    }
    
    if (!formData.country) {
      toast.error('Country is required');
      return;
    }
    
    if (!formData.application_fee) {
      toast.error('Application fee is required');
      return;
    }
    
    if (!formData.deadline) {
      toast.error('Deadline is required');
      return;
    }
    
    if (!formData.company.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    
    // Map form data to backend expected format
    const jobData = {
      title: formData.name, // Map name to title for backend
      description: formData.description,
      country: formData.country,
      city: formData.city,
      application_fee: formData.application_fee,
      deadline: formData.deadline,
      company_name: formData.company.name, // Map company.name to company_name for backend
      requirements: formData.requirements,
      benefits: formData.benefits,
      company: formData.company
    };
    
    createJobMutation.mutate(jobData);
  };

  const handleUpdateJob = (e) => {
    e.preventDefault();
    updateJobMutation.mutate({
      id: selectedJob.id,
      jobData: formData
    });
  };

  const handleDeleteJob = () => {
    deleteJobMutation.mutate(selectedJob.id);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setFormData({
      name: job.name || '',
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      country: job.country || '',
      city: job.city || '',
      application_fee: job.application_fee || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      company: {
        name: job.company?.name || '',
        website: job.company?.website || '',
        description: job.company?.description || '',
        contact_info: {
          email: job.company?.contact_info?.email || '',
          phone: job.company?.contact_info?.phone || ''
        }
      }
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  const handleFeatureToggle = (job) => {
    featureJobMutation.mutate({
      id: job.id,
      is_featured: !job.is_featured
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs Management</h1>
          <p className="text-gray-600 mt-1">Manage job postings and applications</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add New Job</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                type="text"
                placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          <Button type="submit" variant="outline">
            Search
            </Button>
        </form>
      </Card>

      {/* Jobs List */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </Card>
            ))}
        </div>
        ) : error ? (
          <Card className="p-6">
            <div className="text-center text-red-600">
              Error loading jobs: {error.message}
        </div>
          </Card>
        ) : jobsData?.jobs?.length > 0 ? (
          jobsData.jobs.map((job) => (
            <Card key={job.id} className="p-6">
                <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                    {job.is_featured && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <LocationMarkerIcon className="h-4 w-4 mr-2" />
                      {job.city}, {job.country}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Deadline: {formatDate(job.deadline)}
                  </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Fee: {formatCurrency(job.application_fee)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Company:</strong> {job.company?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Description:</strong> {job.description?.substring(0, 150)}...
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Created: {formatDate(job.createdAt)}
                    </span>
                  </div>
                  </div>

                <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                    onClick={() => handleFeatureToggle(job)}
                    >
                    {job.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditJob(job)}
                  >
                    <PencilIcon className="h-4 w-4" />
                    </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(job)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first job posting.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Job
                </Button>
              )}
        </div>
          </Card>
      )}
      </div>

      {/* Create Job Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Job"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title *
                </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
              </div>
          
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
                </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
              </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
                </label>
              <CountrySelect
                value={formData.country}
                onChange={(country) => setFormData({...formData, country})}
                placeholder="Select a country..."
                className="w-full"
              />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
                </label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
              </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Fee *
                </label>
              <Input
                type="number"
                step="0.01"
                value={formData.application_fee}
                onChange={(e) => setFormData({...formData, application_fee: e.target.value})}
                required
              />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline *
                </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <Input
              value={formData.company.name}
              onChange={(e) => setFormData({
                ...formData, 
                company: {...formData.company, name: e.target.value}
              })}
              placeholder="Optional"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createJobMutation.isLoading}
            >
              Create Job
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Job Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Job"
      >
        <form onSubmit={handleUpdateJob} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
              </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <CountrySelect
                value={formData.country}
                onChange={(country) => setFormData({...formData, country})}
                placeholder="Select a country..."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Fee *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.application_fee}
                onChange={(e) => setFormData({...formData, application_fee: e.target.value})}
                required
              />
                </div>
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline *
              </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                required
              />
                  </div>
                </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <Input
              value={formData.company.name}
              onChange={(e) => setFormData({
                ...formData, 
                company: {...formData.company, name: e.target.value}
              })}
              placeholder="Optional"
            />
            </div>

            <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
              </Button>
            <Button
              type="submit"
              loading={updateJobMutation.isLoading}
            >
              Update Job
              </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Job"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{selectedJob?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteJob}
              loading={deleteJobMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JobsPage;