import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { scholarshipsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  SearchIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  LocationMarkerIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/outline';
import CountrySelect from '../../components/ui/CountrySelect';

const ScholarshipsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('action') === 'create');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    program: [],
    country: '',
    university_name: '',
    major: '',
    application_fee: '',
    deadline: '',
    intake_date: '',
    requirements: '',
    benefits: ''
  });

  // Fetch scholarships with search and pagination
  const { data: scholarshipsData, isLoading, error } = useQuery(
    ['scholarships', searchTerm],
    () => scholarshipsAPI.getScholarships({ 
      search: searchTerm,
      limit: 20,
      sort: '-createdAt'
    }),
    {
      select: (response) => response.data.data,
      keepPreviousData: true,
    }
  );

  // Create scholarship mutation
  const createScholarshipMutation = useMutation(
    (scholarshipData) => scholarshipsAPI.createScholarship(scholarshipData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scholarships');
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          program: [],
          country: '',
          university_name: '',
          major: '',
          application_fee: '',
          deadline: '',
          intake_date: '',
          requirements: '',
          benefits: ''
        });
        toast.success('Scholarship created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create scholarship');
      }
    }
  );

  // Update scholarship mutation
  const updateScholarshipMutation = useMutation(
    ({ id, scholarshipData }) => scholarshipsAPI.updateScholarship(id, scholarshipData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scholarships');
        setShowEditModal(false);
        setSelectedScholarship(null);
        toast.success('Scholarship updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update scholarship');
      }
    }
  );

  // Delete scholarship mutation
  const deleteScholarshipMutation = useMutation(
    (id) => scholarshipsAPI.deleteScholarship(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scholarships');
        setShowDeleteModal(false);
        setSelectedScholarship(null);
        toast.success('Scholarship deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete scholarship');
      }
    }
  );

  // Feature scholarship mutation
  const featureScholarshipMutation = useMutation(
    ({ id, is_featured }) => scholarshipsAPI.featureScholarship(id, is_featured),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scholarships');
        toast.success('Scholarship featured status updated!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update scholarship');
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  const handleCreateScholarship = (e) => {
    e.preventDefault();
    createScholarshipMutation.mutate(formData);
  };

  const handleUpdateScholarship = (e) => {
    e.preventDefault();
    updateScholarshipMutation.mutate({
      id: selectedScholarship.id,
      scholarshipData: formData
    });
  };

  const handleDeleteScholarship = () => {
    deleteScholarshipMutation.mutate(selectedScholarship.id);
  };

  const handleEditScholarship = (scholarship) => {
    setSelectedScholarship(scholarship);
    setFormData({
      name: scholarship.name || '',
      description: scholarship.description || '',
      program: scholarship.program || [],
      country: scholarship.country || '',
      university_name: scholarship.university_name || '',
      major: scholarship.major || '',
      application_fee: scholarship.application_fee || '',
      deadline: scholarship.deadline ? new Date(scholarship.deadline).toISOString().split('T')[0] : '',
      intake_date: scholarship.intake_date ? new Date(scholarship.intake_date).toISOString().split('T')[0] : '',
      requirements: scholarship.requirements || '',
      benefits: scholarship.benefits || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (scholarship) => {
    setSelectedScholarship(scholarship);
    setShowDeleteModal(true);
  };

  const handleFeatureToggle = (scholarship) => {
    featureScholarshipMutation.mutate({
      id: scholarship.id,
      is_featured: !scholarship.is_featured
    });
  };

  const handleProgramChange = (program) => {
    setFormData(prev => ({
      ...prev,
      program: prev.program.includes(program)
        ? prev.program.filter(p => p !== program)
        : [...prev.program, program]
    }));
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

  const programOptions = ['UG', 'MSC', 'PhD', 'HOD'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scholarships Management</h1>
          <p className="text-gray-600 mt-1">Manage scholarship opportunities and applications</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add New Scholarship</span>
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
                placeholder="Search scholarships..."
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

      {/* Scholarships List */}
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
              Error loading scholarships: {error.message}
        </div>
          </Card>
        ) : scholarshipsData?.scholarships?.length > 0 ? (
          scholarshipsData.scholarships.map((scholarship) => (
            <Card key={scholarship.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{scholarship.name}</h3>
                    {scholarship.is_featured && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <LocationMarkerIcon className="h-4 w-4 mr-2" />
                      {scholarship.country}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Deadline: {formatDate(scholarship.deadline)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Fee: {formatCurrency(scholarship.application_fee)}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>University:</strong> {scholarship.university_name}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Major:</strong> {scholarship.major}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Programs:</strong> {scholarship.program?.join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Description:</strong> {scholarship.description?.substring(0, 150)}...
                    </p>
                </div>

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      scholarship.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {scholarship.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Created: {formatDate(scholarship.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureToggle(scholarship)}
                  >
                    {scholarship.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditScholarship(scholarship)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(scholarship)}
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
              <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scholarships found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first scholarship opportunity.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Scholarship
                </Button>
              )}
            </div>
          </Card>
        )}
        </div>

      {/* Create Scholarship Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Scholarship"
        size="lg"
      >
        <form onSubmit={handleCreateScholarship} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scholarship Name *
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              required
            />
          </div>
          
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Programs *
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {programOptions.map((program) => (
                <label key={program} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.program.includes(program)}
                    onChange={() => handleProgramChange(program)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{program}</span>
                </label>
              ))}
            </div>
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
                University Name *
              </label>
              <Input
                value={formData.university_name}
                onChange={(e) => setFormData({...formData, university_name: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Major *
                </label>
            <Input
              value={formData.major}
              onChange={(e) => setFormData({...formData, major: e.target.value})}
              required
            />
              </div>
          
          <div className="grid grid-cols-3 gap-4">
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
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intake Date *
                </label>
              <Input
                type="date"
                value={formData.intake_date}
                onChange={(e) => setFormData({...formData, intake_date: e.target.value})}
                required
              />
            </div>
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
              loading={createScholarshipMutation.isLoading}
            >
              Create Scholarship
            </Button>
              </div>
        </form>
      </Modal>

      {/* Edit Scholarship Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Scholarship"
        size="lg"
      >
        <form onSubmit={handleUpdateScholarship} className="space-y-4">
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scholarship Name *
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              required
            />
              </div>
          
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Programs *
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {programOptions.map((program) => (
                <label key={program} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.program.includes(program)}
                    onChange={() => handleProgramChange(program)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{program}</span>
                </label>
              ))}
            </div>
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
                University Name *
              </label>
              <Input
                value={formData.university_name}
                onChange={(e) => setFormData({...formData, university_name: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Major *
            </label>
            <Input
              value={formData.major}
              onChange={(e) => setFormData({...formData, major: e.target.value})}
              required
            />
            </div>

          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intake Date *
              </label>
              <Input
                type="date"
                value={formData.intake_date}
                onChange={(e) => setFormData({...formData, intake_date: e.target.value})}
                required
              />
            </div>
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
              loading={updateScholarshipMutation.isLoading}
            >
              Update Scholarship
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Scholarship"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{selectedScholarship?.name}"? This action cannot be undone.
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
              onClick={handleDeleteScholarship}
              loading={deleteScholarshipMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScholarshipsPage;