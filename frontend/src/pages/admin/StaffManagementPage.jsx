import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { 
  SearchIcon,
  PlusIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/outline';

const StaffManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form state for creating new staff
  const [formData, setFormData] = useState({
    first_name: '',
    father_name: '',
    grandfather_name: '',
    email: '',
    username: '',
    phone: '',
    national_id: '',
    role: 'staff',
    is_active: true
  });

  // Fetch staff users
  const { data: staffData, isLoading, error } = useQuery(
    ['staff', searchTerm],
    () => usersAPI.getUsers({ 
      search: searchTerm,
      role: 'staff',
      limit: 50,
      sort: '-createdAt'
    }),
    {
      select: (response) => response.data.data,
      keepPreviousData: true,
    }
  );

  // Create staff mutation
  const createStaffMutation = useMutation(
    (staffData) => usersAPI.createUser(staffData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staff');
        setShowCreateModal(false);
        setFormData({
          first_name: '',
          father_name: '',
          grandfather_name: '',
          email: '',
          username: '',
          phone: '',
          national_id: '',
      role: 'staff',
          is_active: true
        });
        toast.success('Staff member created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create staff member');
      }
    }
  );

  // Update staff mutation
  const updateStaffMutation = useMutation(
    ({ id, data }) => usersAPI.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staff');
        setShowDetailsModal(false);
        setSelectedStaff(null);
        toast.success('Staff member updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update staff member');
      }
    }
  );

  // Delete staff mutation
  const deleteStaffMutation = useMutation(
    (id) => usersAPI.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staff');
        setShowDeleteModal(false);
        setSelectedStaff(null);
        toast.success('Staff member deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete staff member');
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setShowDetailsModal(true);
  };

  const handleEditClick = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      first_name: staff.first_name || '',
      father_name: staff.father_name || '',
      grandfather_name: staff.grandfather_name || '',
      email: staff.email || '',
      username: staff.username || '',
      phone: staff.phone || '',
      national_id: staff.national_id || '',
      role: staff.role || 'staff',
      is_active: staff.is_active || true
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (staff) => {
    setSelectedStaff(staff);
    setShowDeleteModal(true);
  };

  const handleCreateStaff = () => {
    setShowCreateModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitStaff = (e) => {
    e.preventDefault();
    createStaffMutation.mutate({
      ...formData,
      password: 'TempPassword123!' // Temporary password, should be changed on first login
    });
  };

  const handleUpdateStaff = (staffData) => {
    updateStaffMutation.mutate({ id: selectedStaff.id, data: staffData });
  };

  const handleDeleteStaff = () => {
    deleteStaffMutation.mutate(selectedStaff.id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'applicant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage staff members and their permissions</p>
        </div>
        <Button onClick={handleCreateStaff} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* Search */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                type="text"
                placeholder="Search staff members..."
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

      {/* Staff List */}
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
              Error loading staff: {error.message}
                          </div>
          </Card>
        ) : staffData?.users?.length > 0 ? (
          staffData.users.map((staff) => (
            <Card key={staff.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {staff.first_name?.charAt(0)}{staff.father_name?.charAt(0)}
                      </span>
                          </div>
                        </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {staff.first_name} {staff.father_name} {staff.grandfather_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(staff.is_active)}`}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(staff.role)}`}>
                        {staff.role}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MailIcon className="h-4 w-4 mr-2" />
                        {staff.email}
                      </div>
                      {staff.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          {staff.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Joined: {formatDate(staff.created_at)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Username: {staff.username}
                      </div>
                      </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        National ID: {staff.national_id || 'Not provided'}
                      </span>
                      {staff.is_verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
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
                    onClick={() => handleViewDetails(staff)}
                  >
                    <UserIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(staff)}
                  >
                    <PencilIcon className="h-4 w-4" />
                        </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(staff)}
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
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No staff members have been added yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateStaff} className="mt-4">
                  Add Your First Staff Member
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Create Staff Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Staff Member"
        size="lg"
      >
        <form onSubmit={handleSubmitStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <Input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father Name *
              </label>
              <Input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grandfather Name
              </label>
              <Input
                type="text"
                name="grandfather_name"
                value={formData.grandfather_name}
                onChange={handleFormChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                National ID
              </label>
              <Input
                type="text"
                name="national_id"
                value={formData.national_id}
                onChange={handleFormChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
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
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> A temporary password will be set for this staff member. 
              They should change it on their first login.
            </p>
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
              loading={createStaffMutation.isLoading}
            >
              Create Staff Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Staff Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Staff Details"
        size="lg"
      >
        {selectedStaff && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-sm text-gray-900">
                    {selectedStaff.first_name} {selectedStaff.father_name} {selectedStaff.grandfather_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedStaff.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="text-sm text-gray-900">{selectedStaff.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{selectedStaff.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">National ID</label>
                  <p className="text-sm text-gray-900">{selectedStaff.national_id || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedStaff.role)}`}>
                    {selectedStaff.role}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedStaff.is_active)}`}>
                    {selectedStaff.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedStaff.created_at)}</p>
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
                onClick={() => handleUpdateStaff({ is_active: !selectedStaff.is_active })}
              >
                {selectedStaff.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Staff Member"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{selectedStaff?.first_name} {selectedStaff?.father_name}"? 
            This action cannot be undone and will remove all associated data.
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
              onClick={handleDeleteStaff}
              loading={deleteStaffMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffManagementPage;