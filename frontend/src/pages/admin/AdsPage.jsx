import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  SearchIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  GlobeIcon,
  UserIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/outline';

const AdsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  // Form state for creating new ad
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    target_audience: ['All'],
    type: 'Announcement',
    category: 'General',
    start_date: '',
    end_date: '',
    is_active: true,
    priority: 'Normal'
  });

  const [imageFile, setImageFile] = useState(null);

  // Fetch ads with search and pagination
  const { data: adsData, isLoading, error } = useQuery(
    ['ads', searchTerm],
    () => adsAPI.getAds({ 
      search: searchTerm,
      limit: 20,
      sort: '-createdAt'
    }),
    {
      select: (response) => response.data.data,
      keepPreviousData: true,
    }
  );

  // Create ad mutation
  const createAdMutation = useMutation(
    (adData) => adsAPI.createAd(adData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ads');
        setShowCreateModal(false);
        setFormData({
          title: '',
          content: '',
          description: '',
          target_audience: ['All'],
          type: 'Announcement',
          category: 'General',
          start_date: '',
          end_date: '',
          is_active: true,
          priority: 'Normal'
        });
        toast.success('Ad created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create ad');
      }
    }
  );

  // Update ad mutation
  const updateAdMutation = useMutation(
    ({ id, data }) => adsAPI.updateAd(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ads');
        setShowDetailsModal(false);
        setSelectedAd(null);
        toast.success('Ad updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update ad');
      }
    }
  );

  // Delete ad mutation
  const deleteAdMutation = useMutation(
    (id) => adsAPI.deleteAd(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ads');
        setShowDeleteModal(false);
        setSelectedAd(null);
        toast.success('Ad deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete ad');
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  const handleViewDetails = (ad) => {
    setSelectedAd(ad);
    setShowDetailsModal(true);
  };

  const handleEditClick = (ad) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title || '',
      content: ad.content || '',
      description: ad.description || '',
      type: ad.type || 'Announcement',
      category: ad.category || 'General',
      priority: ad.priority || 'Normal',
      target_audience: ad.target_audience || ['All'],
      start_date: ad.start_date ? new Date(ad.start_date).toISOString().split('T')[0] : '',
      end_date: ad.end_date ? new Date(ad.end_date).toISOString().split('T')[0] : '',
      is_active: ad.is_active || true
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (ad) => {
    setSelectedAd(ad);
    setShowDeleteModal(true);
  };

  const handleCreateAd = () => {
    setShowCreateModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitAd = (e) => {
    e.preventDefault();
    createAdMutation.mutate(formData);
  };

  const handleUpdateAd = (e) => {
    e.preventDefault();
    updateAdMutation.mutate({
      id: selectedAd.id,
      data: formData
    });
    setShowEditModal(false);
  };

  const handleDeleteAd = () => {
    deleteAdMutation.mutate(selectedAd.id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads Management</h1>
          <p className="text-gray-600 mt-1">Manage promotional advertisements and banners</p>
        </div>
        <Button onClick={handleCreateAd} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add New Ad</span>
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
                placeholder="Search ads..."
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

      {/* Ads List */}
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
              Error loading ads: {error.message}
            </div>
          </Card>
        ) : adsData?.ads?.length > 0 ? (
          adsData.ads.map((ad) => (
            <Card key={ad.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ad.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ad.is_active)}`}>
                      {ad.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ad.priority)}`}>
                      {ad.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {ad.content.substring(0, 150)}...
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <GlobeIcon className="h-4 w-4 mr-2" />
                      Category: {ad.category}
                </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Target: {ad.target_audience?.join(', ') || 'All'}
                  </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Duration: {formatDate(ad.start_date)} - {formatDate(ad.end_date)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Views: {ad.view_count || 0}</span>
                    <span>Clicks: {ad.click_count || 0}</span>
                    <span>Type: {ad.type}</span>
                    <span>Created: {formatDate(ad.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(ad)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(ad)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(ad)}
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
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ads found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No ads have been created yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateAd} className="mt-4">
                  Create Your First Ad
                    </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Create Ad Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Ad"
        size="lg"
      >
        <form onSubmit={handleSubmitAd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength={20}
              placeholder="Enter a description (minimum 20 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleFormChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Image/File
            </label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {imageFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {imageFile.name}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Announcement">Announcement</option>
                <option value="News">News</option>
                <option value="Event">Event</option>
                <option value="Promotion">Promotion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="General">General</option>
                <option value="Job">Job</option>
                <option value="Scholarship">Scholarship</option>
                <option value="System">System</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                name="target_audience"
                value={Array.isArray(formData.target_audience) ? formData.target_audience[0] : formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: [e.target.value] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Users</option>
                <option value="Applicants">Applicants Only</option>
                <option value="Staff">Staff Only</option>
                <option value="Admin">Admin Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleFormChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleFormChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Active
            </label>
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
              loading={createAdMutation.isLoading}
            >
              Create Ad
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Ad Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Ad"
        size="lg"
      >
        <form onSubmit={handleUpdateAd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
              minLength={20}
              placeholder="Enter a description (minimum 20 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Image/File
            </label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {imageFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Announcement">Announcement</option>
                <option value="News">News</option>
                <option value="Event">Event</option>
                <option value="Promotion">Promotion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="General">General</option>
                <option value="Job">Job</option>
                <option value="Scholarship">Scholarship</option>
                <option value="System">System</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                name="target_audience"
                value={Array.isArray(formData.target_audience) ? formData.target_audience[0] : formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: [e.target.value] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Users</option>
                <option value="Applicants">Applicants Only</option>
                <option value="Staff">Staff Only</option>
                <option value="Admin">Admin Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleFormChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleFormChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleFormChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Active
            </label>
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
              loading={updateAdMutation.isLoading}
            >
              Update Ad
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ad Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Ad Details"
        size="lg"
      >
        {selectedAd && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-sm text-gray-900">{selectedAd.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAd.is_active)}`}>
                    {selectedAd.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedAd.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{selectedAd.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                  <p className="text-sm text-gray-900">{Array.isArray(selectedAd.target_audience) ? selectedAd.target_audience.join(', ') : selectedAd.target_audience}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <p className="text-sm text-gray-900">{selectedAd.start_date ? formatDate(selectedAd.start_date) : 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <p className="text-sm text-gray-900">{selectedAd.end_date ? formatDate(selectedAd.end_date) : 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedAd.priority)}`}>
                    {selectedAd.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedAd.createdAt)}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900 mt-1">{selectedAd.description}</p>
              </div>
              {selectedAd.content && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedAd.content}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{selectedAd.view_count || 0}</p>
                  <p className="text-sm text-gray-600">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedAd.click_count || 0}</p>
                  <p className="text-sm text-gray-600">Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedAd.click_count && selectedAd.view_count 
                      ? ((selectedAd.click_count / selectedAd.view_count) * 100).toFixed(1)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-600">CTR</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  updateAdMutation.mutate({
                    id: selectedAd.id,
                    data: { is_active: !selectedAd.is_active }
                  });
                  setShowDetailsModal(false);
                }}
              >
                {selectedAd.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Ad"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{selectedAd?.title}"? This action cannot be undone.
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
              onClick={handleDeleteAd}
              loading={deleteAdMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdsPage;