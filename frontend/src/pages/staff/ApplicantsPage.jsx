import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usersAPI, applicantsAPI, applicationsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  SearchIcon,
  UsersIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/outline';

const StaffApplicantsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch applicants with search and pagination
  const { data: applicantsData, isLoading, error } = useQuery(
    ['applicants', searchTerm],
    () => applicantsAPI.getApplicants({ 
      search: searchTerm,
      limit: 20,
      sort: '-createdAt'
    }),
    {
      select: (response) => response.data.data,
      keepPreviousData: true,
    }
  );

  // Update user status mutation
  const updateUserStatusMutation = useMutation(
    ({ id, is_active }) => usersAPI.activateUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('applicants');
        toast.success('User status updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      }
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (id) => usersAPI.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('applicants');
        setShowDeleteModal(false);
        setSelectedApplicant(null);
        toast.success('User deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  const handleViewDetails = (applicant) => {
    navigate(`/staff/applicants/${applicant.id}`);
  };

  const handleDeleteClick = (applicant) => {
    setSelectedApplicant(applicant);
    setSelectedUser(applicant.user_id);
    setShowDeleteModal(true);
  };

  const handleActivateUser = (userId) => {
    updateUserStatusMutation.mutate({ id: userId, is_active: true });
  };

  const handleDeactivateUser = (userId) => {
    updateUserStatusMutation.mutate({ id: userId, is_active: false });
  };

  const handleDeleteUser = () => {
    deleteUserMutation.mutate(selectedUser.id);
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applicants Management</h1>
          <p className="text-gray-600 mt-1">Manage applicant profiles and applications</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                type="text"
                placeholder="Search applicants..."
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

      {/* Applicants List */}
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
              Error loading applicants: {error.message}
                          </div>
          </Card>
        ) : applicantsData?.applicants?.length > 0 ? (
          applicantsData.applicants.map((applicant) => (
            <Card key={applicant.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {applicant.user_id?.first_name?.charAt(0)}{applicant.user_id?.father_name?.charAt(0)}
                      </span>
                          </div>
                        </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {applicant.user_id?.first_name} {applicant.user_id?.father_name} {applicant.user_id?.grandfather_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(applicant.user_id?.is_active ? 'active' : 'inactive')}`}>
                        {applicant.user_id?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MailIcon className="h-4 w-4 mr-2" />
                        {applicant.user_id?.email}
                      </div>
                      {applicant.user_id?.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          {applicant.user_id.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Joined: {formatDate(applicant.user_id?.created_at)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Profile: {applicant.profile_completion}% complete
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Username:</strong> {applicant.user_id?.username}
                      </p>
                      {applicant.bio && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Bio:</strong> {applicant.bio.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        National ID: {applicant.user_id?.national_id || 'Not provided'}
                      </span>
                      {applicant.user_id?.is_verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                      </div>
                
                <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(applicant)}
                        >
                    <EyeIcon className="h-4 w-4" />
                        </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applicant.user_id?.is_active 
                      ? handleDeactivateUser(applicant.user_id.id)
                      : handleActivateUser(applicant.user_id.id)
                    }
                  >
                    {applicant.user_id?.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(applicant)}
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
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No applicants have registered yet.'}
              </p>
          </div>
      </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Applicant"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{selectedUser?.first_name} {selectedUser?.father_name}"? This action cannot be undone and will remove all associated data.
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
              onClick={handleDeleteUser}
              loading={deleteUserMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffApplicantsPage;
