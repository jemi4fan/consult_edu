import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import {
  User,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  FileText,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editedProfile, setEditedProfile] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone_number || '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  });

  // Mock data - replace with actual API calls
  const profileData = {
    progress: 75,
    education: [
      {
        id: 1,
        degree: 'Bachelor',
        institution: 'University of California',
        graduationYear: 2018,
        gpa: 3.8,
        major: 'Computer Science',
      },
      {
        id: 2,
        degree: 'Master',
        institution: 'Stanford University',
        graduationYear: 2020,
        gpa: 3.9,
        major: 'Software Engineering',
      },
    ],
    documents: [
      {
        id: 1,
        name: 'Resume.pdf',
        type: 'resume',
        uploadDate: '2024-01-15',
        size: '2.3 MB',
      },
      {
        id: 2,
        name: 'Transcript.pdf',
        type: 'transcript',
        uploadDate: '2024-01-16',
        size: '1.8 MB',
      },
      {
        id: 3,
        name: 'Cover_Letter.pdf',
        type: 'cover_letter',
        uploadDate: '2024-01-17',
        size: '0.8 MB',
      },
    ],
  };

  const handleSave = async () => {
    try {
      await updateProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setEditedProfile({
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone_number || '',
      dateOfBirth: '',
      gender: '',
      nationality: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
    });
    setIsEditing(false);
  };

  const getDocumentTypeIcon = (type) => {
    switch (type) {
      case 'resume':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'transcript':
        return <GraduationCap className="h-4 w-4 text-green-600" />;
      case 'cover_letter':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">
            Manage your personal information and documents.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Profile Completion</h3>
              <p className="text-sm text-gray-600">
                Complete your profile to improve your application success rate
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{profileData.progress}%</div>
              <ProgressBar value={profileData.progress} size="sm" className="mt-2 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['general', 'education', 'documents'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* General Information Tab */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              General Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile.firstName}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, firstName: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {user?.first_name || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile.lastName}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, lastName: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {user?.last_name || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center py-2">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{user?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile.phone}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, phone: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex items-center py-2">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">
                      {user?.phone_number || 'Not provided'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedProfile.dateOfBirth}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, dateOfBirth: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex items-center py-2">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">
                      {profileData.dateOfBirth || 'Not provided'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={editedProfile.gender}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, gender: e.target.value })
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 py-2 capitalize">
                    {profileData.gender || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile.nationality}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, nationality: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {profileData.nationality || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                {isEditing ? (
                  <Input
                    value={editedProfile.country}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, country: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {profileData.country || 'Not provided'}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                {isEditing ? (
                  <Textarea
                    value={editedProfile.address}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, address: e.target.value })
                    }
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start py-2">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <p className="text-sm text-gray-900">
                      {profileData.address || 'Not provided'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education Tab */}
      {activeTab === 'education' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <GraduationCap className="mr-2 h-5 w-5" />
                Education
              </CardTitle>
              <Button onClick={() => setIsEducationModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Education
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileData.education.map((edu) => (
                <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-5 w-5 text-purple-600" />
                        <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{edu.institution}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Major</label>
                          <p className="text-sm text-gray-900">{edu.major}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Graduation Year</label>
                          <p className="text-sm text-gray-900">{edu.graduationYear}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">GPA</label>
                          <p className="text-sm text-gray-900">{edu.gpa}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Documents
              </CardTitle>
              <Button onClick={() => setIsDocumentModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileData.documents.map((doc) => (
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
                          Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education Modal - Placeholder */}
      <Modal
        isOpen={isEducationModalOpen}
        onClose={() => setIsEducationModalOpen(false)}
        title="Add Education"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Add education functionality would be implemented here with a form containing:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Degree</li>
            <li>Institution</li>
            <li>Graduation Year</li>
            <li>GPA</li>
            <li>Major</li>
          </ul>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsEducationModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEducationModalOpen(false)}>
              Save Education
            </Button>
          </div>
        </div>
      </Modal>

      {/* Document Upload Modal - Placeholder */}
      <Modal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        title="Upload Document"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Upload document functionality would be implemented here with:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>File upload with drag & drop</li>
            <li>Document type selection</li>
            <li>File validation</li>
            <li>Progress indicator</li>
          </ul>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDocumentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDocumentModalOpen(false)}>
              Upload Document
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;


