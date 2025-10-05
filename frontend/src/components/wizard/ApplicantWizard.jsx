import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { usersAPI, applicantsAPI, applicationsAPI } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import CountrySelect from '../ui/CountrySelect';
import toast from 'react-hot-toast';
import {
  UserIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SaveIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/outline';

const ApplicantWizard = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDraft, setIsDraft] = useState(false);
  const [createdUserId, setCreatedUserId] = useState(null);
  const [createdApplicantId, setCreatedApplicantId] = useState(null);

  // Form data for each step
  const [profileData, setProfileData] = useState({
    first_name: '',
    father_name: '',
    grandfather_name: '',
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    phone: '',
    national_id: '',
    address: '',
    role: 'applicant'
  });

  const [applicantData, setApplicantData] = useState({
    dob: '',
    gender: '',
    nationality: '',
    bio: '',
    skills: [],
    languages: []
  });

  const [educationData, setEducationData] = useState([]);
  const [experienceData, setExperienceData] = useState([]);
  const [applicationData, setApplicationData] = useState({
    type: '',
    job_id: null,
    scholarship_id: null,
    status: 'Draft',
    notes: ''
  });

  // Mutations
  const createUserMutation = useMutation(usersAPI.createUser, {
    onSuccess: (response) => {
      setCreatedUserId(response.data.data.user.id);
      toast.success('User created successfully!');
      setCurrentStep(1);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  });

  const createApplicantMutation = useMutation(applicantsAPI.createApplicant, {
    onSuccess: (response) => {
      setCreatedApplicantId(response.data.data.applicant.id);
      toast.success('Applicant profile created successfully!');
      setCurrentStep(2);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create applicant profile');
    }
  });

  const createApplicationMutation = useMutation(applicationsAPI.createApplication, {
    onSuccess: () => {
      queryClient.invalidateQueries('applicants');
      toast.success('Application created successfully!');
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create application');
    }
  });

  const steps = [
    { id: 0, name: 'Profile Information', icon: UserIcon, description: 'Create user account' },
    { id: 1, name: 'Applicant Details', icon: UserIcon, description: 'Personal information' },
    { id: 2, name: 'Education & Experience', icon: AcademicCapIcon, description: 'Academic background' },
    { id: 3, name: 'Application', icon: BriefcaseIcon, description: 'Apply for opportunities' },
    { id: 4, name: 'Review & Submit', icon: CheckCircleIcon, description: 'Review and submit' }
  ];

  const resetForm = () => {
    setCurrentStep(0);
    setIsDraft(false);
    setCreatedUserId(null);
    setCreatedApplicantId(null);
    setProfileData({
      first_name: '',
      father_name: '',
      grandfather_name: '',
      email: '',
      username: '',
      password: '',
      confirm_password: '',
      phone: '',
      national_id: '',
      address: '',
      role: 'applicant'
    });
    setApplicantData({
      dob: '',
      gender: '',
      nationality: '',
      bio: '',
      skills: [],
      languages: []
    });
    setEducationData([]);
    setExperienceData([]);
    setApplicationData({
      type: '',
      job_id: null,
      scholarship_id: null,
      status: 'Draft',
      notes: ''
    });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplicantChange = (e) => {
    const { name, value } = e.target;
    setApplicantData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillAdd = () => {
    const skill = prompt('Enter skill:');
    if (skill && !applicantData.skills.includes(skill)) {
      setApplicantData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleSkillRemove = (index) => {
    setApplicantData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleLanguageAdd = () => {
    const language = prompt('Enter language:');
    const proficiency = prompt('Enter proficiency (Beginner, Intermediate, Advanced, Native):');
    if (language && proficiency) {
      setApplicantData(prev => ({
        ...prev,
        languages: [...prev.languages, { language, proficiency }]
      }));
    }
  };

  const handleLanguageRemove = (index) => {
    setApplicantData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const handleEducationAdd = () => {
    setEducationData(prev => [...prev, {
      degree: '',
      institution: '',
      major: '',
      graduation_year: '',
      gpa: '',
      country: ''
    }]);
  };

  const handleEducationChange = (index, field, value) => {
    setEducationData(prev => prev.map((edu, i) => 
      i === index ? { ...edu, [field]: value } : edu
    ));
  };

  const handleEducationRemove = (index) => {
    setEducationData(prev => prev.filter((_, i) => i !== index));
  };

  const handleExperienceAdd = () => {
    setExperienceData(prev => [...prev, {
      company: '',
      position: '',
      start_date: '',
      end_date: '',
      current: false,
      description: ''
    }]);
  };

  const handleExperienceChange = (index, field, value) => {
    setExperienceData(prev => prev.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    ));
  };

  const handleExperienceRemove = (index) => {
    setExperienceData(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = () => {
    setIsDraft(true);
    // Save current progress
    toast.success('Draft saved successfully!');
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate profile data
      if (!profileData.first_name || !profileData.email || !profileData.username || !profileData.password) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (profileData.password !== profileData.confirm_password) {
        toast.error('Passwords do not match');
        return;
      }
      createUserMutation.mutate(profileData);
    } else if (currentStep === 1) {
      // Create applicant profile
      createApplicantMutation.mutate({
        user_id: createdUserId,
        ...applicantData,
        education: educationData,
        work_experience: experienceData
      });
    } else if (currentStep === 2) {
      // Move to application step
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Move to review step
      setCurrentStep(4);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createApplicationMutation.mutate({
      applicant_id: createdApplicantId,
      ...applicationData
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <Input
                  name="first_name"
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father Name *</label>
                <Input
                  name="father_name"
                  value={profileData.father_name}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grandfather Name</label>
                <Input
                  name="grandfather_name"
                  value={profileData.grandfather_name}
                  onChange={handleProfileChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <Input
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <Input
                  type="password"
                  name="password"
                  value={profileData.password}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <Input
                  type="password"
                  name="confirm_password"
                  value={profileData.confirm_password}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                <Input
                  name="national_id"
                  value={profileData.national_id}
                  onChange={handleProfileChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={profileData.address}
                onChange={handleProfileChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Applicant Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <Input
                  type="date"
                  name="dob"
                  value={applicantData.dob}
                  onChange={handleApplicantChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={applicantData.gender}
                  onChange={handleApplicantChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <CountrySelect
                  value={applicantData.nationality}
                  onChange={(value) => setApplicantData(prev => ({ ...prev, nationality: value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={applicantData.bio}
                onChange={handleApplicantChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Skills Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Skills</label>
                <Button type="button" variant="outline" size="sm" onClick={handleSkillAdd}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Skill
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {applicantData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(index)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Languages Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Languages</label>
                <Button type="button" variant="outline" size="sm" onClick={handleLanguageAdd}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Language
                </Button>
              </div>
              <div className="space-y-2">
                {applicantData.languages.map((lang, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">{lang.language} ({lang.proficiency})</span>
                    <button
                      type="button"
                      onClick={() => handleLanguageRemove(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Education & Experience</h3>
            
            {/* Education Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">Education</h4>
                <Button type="button" variant="outline" size="sm" onClick={handleEducationAdd}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Education
                </Button>
              </div>
              <div className="space-y-4">
                {educationData.map((edu, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                          placeholder="e.g., Bachelor of Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                          placeholder="e.g., University Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                        <Input
                          value={edu.major}
                          onChange={(e) => handleEducationChange(index, 'major', e.target.value)}
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                        <Input
                          type="number"
                          value={edu.graduation_year}
                          onChange={(e) => handleEducationChange(index, 'graduation_year', e.target.value)}
                          placeholder="2023"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GPA (Optional)</label>
                        <Input
                          value={edu.gpa}
                          onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)}
                          placeholder="e.g., 3.8"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleEducationRemove(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Experience Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">Work Experience</h4>
                <Button type="button" variant="outline" size="sm" onClick={handleExperienceAdd}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              </div>
              <div className="space-y-4">
                {experienceData.map((exp, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <Input
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <Input
                          value={exp.position}
                          onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                          placeholder="Job Title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <Input
                          type="date"
                          value={exp.start_date}
                          onChange={(e) => handleExperienceChange(index, 'start_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <Input
                          type="date"
                          value={exp.end_date}
                          onChange={(e) => handleExperienceChange(index, 'end_date', e.target.value)}
                          disabled={exp.current}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => handleExperienceChange(index, 'current', e.target.checked)}
                            className="mr-2"
                          />
                          Currently working here
                        </label>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Describe your role and responsibilities..."
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleExperienceRemove(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Application</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Type</label>
                <select
                  name="type"
                  value={applicationData.type}
                  onChange={handleApplicationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Type</option>
                  <option value="Job">Job Application</option>
                  <option value="Scholarship">Scholarship Application</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={applicationData.status}
                  onChange={handleApplicationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={applicationData.notes}
                onChange={handleApplicationChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Any additional notes or comments..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
            
            {/* Profile Summary */}
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Profile Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {profileData.first_name} {profileData.father_name} {profileData.grandfather_name}</div>
                <div><strong>Email:</strong> {profileData.email}</div>
                <div><strong>Username:</strong> {profileData.username}</div>
                <div><strong>Phone:</strong> {profileData.phone || 'Not provided'}</div>
                <div><strong>National ID:</strong> {profileData.national_id || 'Not provided'}</div>
              </div>
            </Card>

            {/* Applicant Details Summary */}
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Applicant Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Date of Birth:</strong> {applicantData.dob || 'Not provided'}</div>
                <div><strong>Gender:</strong> {applicantData.gender || 'Not provided'}</div>
                <div><strong>Nationality:</strong> {applicantData.nationality || 'Not provided'}</div>
                <div><strong>Skills:</strong> {applicantData.skills.length} skills</div>
                <div><strong>Languages:</strong> {applicantData.languages.length} languages</div>
              </div>
              {applicantData.bio && (
                <div className="mt-2">
                  <strong>Bio:</strong>
                  <p className="text-sm text-gray-600 mt-1">{applicantData.bio}</p>
                </div>
              )}
            </Card>

            {/* Education Summary */}
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Education ({educationData.length} entries)</h4>
              {educationData.map((edu, index) => (
                <div key={index} className="text-sm mb-2">
                  <strong>{edu.degree}</strong> in {edu.major} from {edu.institution} ({edu.graduation_year})
                  {edu.gpa && ` - GPA: ${edu.gpa}`}
                </div>
              ))}
            </Card>

            {/* Experience Summary */}
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Work Experience ({experienceData.length} entries)</h4>
              {experienceData.map((exp, index) => (
                <div key={index} className="text-sm mb-2">
                  <strong>{exp.position}</strong> at {exp.company}
                  {exp.current ? ' (Current)' : ` (${exp.start_date} - ${exp.end_date})`}
                </div>
              ))}
            </Card>

            {/* Application Summary */}
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Application Details</h4>
              <div className="text-sm space-y-1">
                <div><strong>Type:</strong> {applicationData.type || 'Not selected'}</div>
                <div><strong>Status:</strong> {applicationData.status}</div>
                {applicationData.notes && (
                  <div>
                    <strong>Notes:</strong>
                    <p className="text-gray-600 mt-1">{applicationData.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title="Add New Applicant"
      size="xl"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {currentStep < 4 && (
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="flex items-center"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="flex items-center"
                loading={createUserMutation.isLoading || createApplicantMutation.isLoading}
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="flex items-center"
                loading={createApplicationMutation.isLoading}
              >
                Submit Application
                <CheckCircleIcon className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ApplicantWizard;

